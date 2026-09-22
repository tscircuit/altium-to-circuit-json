import {
  type AltiumPadRecord,
  type getAltiumPcbPadGeometry,
  normalizeAltiumAngle,
} from "altiumts"
import type { LayerRef, PcbPlatedHole } from "circuit-json"
import { createOctagonPoints, milsToMillimeters } from "../geometry"
import { ALTIUM_SLOT_HOLE_TYPE, MILS_TO_MILLIMETERS } from "../model"
import { getRotatedHoleOffset } from "./getRotatedHoleOffset"
import { isRectangularShape } from "./isRectangularShape"
import { normalizeShape } from "./normalizeShape"

export function convertThroughHolePad({
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
