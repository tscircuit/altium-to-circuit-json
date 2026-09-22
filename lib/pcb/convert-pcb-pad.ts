import {
  type AltiumPadRecord,
  getAltiumPcbPadGeometry,
  normalizeAltiumAngle,
} from "altiumts"
import type { LayerRef, PcbHole, PcbPlatedHole, PcbSmtPad } from "circuit-json"

import { ALTIUM_SLOT_HOLE_TYPE, MILS_TO_MILLIMETERS } from "./constants"
import { createOctagonPoints, milsToMillimeters } from "./coordinates"
import { mapAltiumCopperLayer } from "./map-altium-copper-layer"

export function convertPcbPad({
  record,
  recordIndex,
}: {
  record: AltiumPadRecord
  recordIndex: number
}): PcbSmtPad | PcbPlatedHole | PcbHole | undefined {
  const position = record.position
  if (!position) return undefined
  const geometry = getAltiumPcbPadGeometry({
    record,
    useRequestedLayerGeometry: true,
  })
  const x = milsToMillimeters(position.x)
  const y = milsToMillimeters(position.y)
  const width = milsToMillimeters(geometry.widthMils)
  const height = milsToMillimeters(geometry.heightMils)
  const cornerRadius =
    geometry.cornerRadiusMils === 0
      ? undefined
      : milsToMillimeters(geometry.cornerRadiusMils)
  const holeDiameter = milsToMillimeters(geometry.holeSizeMils)
  const shape = normalizeShape(geometry.shape)
  const id = `altium_${recordIndex}`

  if (!geometry.plated && holeDiameter > 0) {
    return {
      type: "pcb_hole",
      pcb_hole_id: `pcb_hole_${id}`,
      hole_shape: "circle",
      hole_diameter: holeDiameter,
      x,
      y,
    }
  }

  if (record.behavior === "through-hole" || holeDiameter > 0) {
    return convertThroughHolePad({
      cornerRadius,
      geometry,
      height,
      holeDiameter,
      id,
      record,
      shape,
      width,
      x,
      y,
    })
  }

  const layer = mapAltiumCopperLayer(record.layer)
  if (!layer) return undefined
  const base = {
    type: "pcb_smtpad" as const,
    pcb_smtpad_id: `pcb_smtpad_${id}`,
    x,
    y,
    layer,
    soldermask_margin:
      record.solderMaskExpansionMils === undefined
        ? undefined
        : milsToMillimeters(record.solderMaskExpansionMils),
  }

  if (shape.includes("OCTAGON")) {
    return {
      ...base,
      shape: "polygon",
      points: createOctagonPoints({
        x,
        y,
        width,
        height,
        ccwRotationDegrees: record.rotation,
      }),
    }
  }
  if (shape === "ROUND" || shape === "CIRCLE" || shape === "OVAL") {
    if (Math.abs(width - height) < 0.0001) {
      return { ...base, shape: "circle", radius: width / 2 }
    }
    return record.rotation === 0
      ? {
          ...base,
          shape: "pill",
          width,
          height,
          radius: Math.min(width, height) / 2,
        }
      : {
          ...base,
          shape: "rotated_pill",
          width,
          height,
          radius: Math.min(width, height) / 2,
          ccw_rotation: record.rotation,
        }
  }

  return record.rotation === 0
    ? { ...base, shape: "rect", width, height, corner_radius: cornerRadius }
    : {
        ...base,
        shape: "rotated_rect",
        width,
        height,
        corner_radius: cornerRadius,
        ccw_rotation: record.rotation,
      }
}

function convertThroughHolePad({
  cornerRadius,
  geometry,
  height,
  holeDiameter,
  id,
  record,
  shape,
  width,
  x,
  y,
}: {
  cornerRadius: number | undefined
  geometry: ReturnType<typeof getAltiumPcbPadGeometry>
  height: number
  holeDiameter: number
  id: string
  record: AltiumPadRecord
  shape: string
  width: number
  x: number
  y: number
}): PcbPlatedHole {
  const holeOffset = getRotatedHoleOffset(record, geometry)
  const holeCcwRotationDegrees = normalizeAltiumAngle(
    record.rotation + geometry.holeRotationDegrees,
  )
  const isSlot =
    record.getNumber("HOLETYPE") === ALTIUM_SLOT_HOLE_TYPE ||
    normalizeShape(geometry.holeShape).includes("SLOT") ||
    geometry.slotLengthMils > geometry.holeSizeMils ||
    (record.holeWidthMils ?? 0) > geometry.holeSizeMils
  const layers: LayerRef[] = ["top", "bottom"]

  if (isSlot) {
    const holeHeight = milsToMillimeters(Math.max(geometry.holeSizeMils, 1))
    const holeWidth = milsToMillimeters(
      Math.max(geometry.slotLengthMils, geometry.holeSizeMils, 1),
    )
    if (isRectangularShape(shape)) {
      const rotated = holeCcwRotationDegrees !== 0 || record.rotation !== 0
      if (rotated) {
        return {
          type: "pcb_plated_hole",
          pcb_plated_hole_id: `pcb_plated_hole_${id}`,
          shape: "rotated_pill_hole_with_rect_pad",
          hole_shape: "rotated_pill",
          pad_shape: "rect",
          hole_width: holeWidth,
          hole_height: holeHeight,
          hole_ccw_rotation: holeCcwRotationDegrees,
          rect_pad_width: width,
          rect_pad_height: height,
          rect_border_radius: cornerRadius,
          rect_ccw_rotation: record.rotation,
          hole_offset_x: milsToMillimeters(holeOffset.x),
          hole_offset_y: milsToMillimeters(holeOffset.y),
          x,
          y,
          layers,
        }
      }
      return {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: `pcb_plated_hole_${id}`,
        shape: "pill_hole_with_rect_pad",
        hole_shape: "pill",
        pad_shape: "rect",
        hole_width: holeWidth,
        hole_height: holeHeight,
        rect_pad_width: width,
        rect_pad_height: height,
        rect_border_radius: cornerRadius,
        hole_offset_x: milsToMillimeters(holeOffset.x),
        hole_offset_y: milsToMillimeters(holeOffset.y),
        x,
        y,
        layers,
      }
    }
    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: `pcb_plated_hole_${id}`,
      shape: "pill",
      outer_width: width,
      outer_height: height,
      hole_width: holeWidth,
      hole_height: holeHeight,
      ccw_rotation: holeCcwRotationDegrees,
      x,
      y,
      layers,
    }
  }

  if (isRectangularShape(shape)) {
    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: `pcb_plated_hole_${id}`,
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_diameter: Math.max(holeDiameter, MILS_TO_MILLIMETERS),
      rect_pad_width: width,
      rect_pad_height: height,
      rect_border_radius: cornerRadius,
      rect_ccw_rotation: record.rotation,
      hole_offset_x: milsToMillimeters(holeOffset.x),
      hole_offset_y: milsToMillimeters(holeOffset.y),
      x,
      y,
      layers,
    }
  }

  if (shape.includes("OCTAGON")) {
    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: `pcb_plated_hole_${id}`,
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: Math.max(holeDiameter, MILS_TO_MILLIMETERS),
      pad_outline: createOctagonPoints({
        x,
        y,
        width,
        height,
        ccwRotationDegrees: record.rotation,
      }),
      hole_offset_x: milsToMillimeters(holeOffset.x),
      hole_offset_y: milsToMillimeters(holeOffset.y),
      x,
      y,
      layers,
    }
  }

  if (
    (shape === "ROUND" || shape === "CIRCLE" || shape === "OVAL") &&
    Math.abs(width - height) >= 0.0001
  ) {
    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: `pcb_plated_hole_${id}`,
      shape: "pill",
      outer_width: width,
      outer_height: height,
      hole_width: Math.max(holeDiameter, MILS_TO_MILLIMETERS),
      hole_height: Math.max(holeDiameter, MILS_TO_MILLIMETERS),
      ccw_rotation: record.rotation,
      x,
      y,
      layers,
    }
  }

  return {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: `pcb_plated_hole_${id}`,
    shape: "circle",
    outer_diameter: Math.max(width, height),
    hole_diameter: Math.max(holeDiameter, MILS_TO_MILLIMETERS),
    x,
    y,
    layers,
  }
}

function getRotatedHoleOffset(
  record: AltiumPadRecord,
  geometry: ReturnType<typeof getAltiumPcbPadGeometry>,
): { x: number; y: number } {
  const ccwPadRotationRadians = (record.rotation * Math.PI) / 180
  return {
    x:
      geometry.holeOffsetXMils * Math.cos(ccwPadRotationRadians) -
      geometry.holeOffsetYMils * Math.sin(ccwPadRotationRadians),
    y:
      geometry.holeOffsetXMils * Math.sin(ccwPadRotationRadians) +
      geometry.holeOffsetYMils * Math.cos(ccwPadRotationRadians),
  }
}

function normalizeShape(shape: string | undefined): string {
  return (shape ?? "ROUND").replace(/[\s_-]+/gu, "").toUpperCase()
}

function isRectangularShape(shape: string): boolean {
  return shape.includes("RECT") || shape === "SQUARE"
}
