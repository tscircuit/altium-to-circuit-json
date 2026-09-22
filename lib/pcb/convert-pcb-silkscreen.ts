import {
  type AltiumArcRecord,
  type AltiumFillRecord,
  type AltiumRegionRecord,
  type AltiumTextRecord,
  type AltiumTrackRecord,
  approximateAltiumArc,
  getPcbRegionGeometry,
} from "altiumts"
import type {
  PcbSilkscreenGraphic,
  PcbSilkscreenLine,
  PcbSilkscreenPath,
  PcbSilkscreenRect,
  PcbSilkscreenText,
} from "circuit-json"

import {
  milsToMillimeters,
  toMillimeterPoint,
  withNumberedPoints,
} from "./coordinates"
import { getPcbComponentIdForRecord } from "./ids"
import { mapOverlayLayer } from "./layers"
import { mapTextAnchor } from "./text"

export function convertPcbSilkscreenLine({
  record,
  recordIndex,
}: {
  record: AltiumTrackRecord
  recordIndex: number
}): PcbSilkscreenLine | undefined {
  if (!record.start || !record.end) return undefined
  return {
    type: "pcb_silkscreen_line",
    pcb_silkscreen_line_id: `pcb_silkscreen_line_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    ...withNumberedPoints(record.start, record.end),
    layer: mapOverlayLayer(record.layer),
  }
}

export function convertPcbSilkscreenArc({
  record,
  recordIndex,
}: {
  record: AltiumArcRecord
  recordIndex: number
}): PcbSilkscreenPath | undefined {
  if (!record.center || !record.radiusMils) return undefined
  const points = approximateAltiumArc({
    center: record.center,
    radius: record.radiusMils,
    startAngleDegrees: record.startAngle,
    endAngleDegrees: record.endAngle,
  })
  return {
    type: "pcb_silkscreen_path",
    pcb_silkscreen_path_id: `pcb_silkscreen_path_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    route: points.map(toMillimeterPoint),
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    layer: mapOverlayLayer(record.layer),
  }
}

export function convertPcbSilkscreenFill({
  record,
  recordIndex,
}: {
  record: AltiumFillRecord
  recordIndex: number
}): PcbSilkscreenRect | undefined {
  if (!record.bounds) return undefined
  const width = milsToMillimeters(record.bounds.maxX - record.bounds.minX)
  const height = milsToMillimeters(record.bounds.maxY - record.bounds.minY)
  return {
    type: "pcb_silkscreen_rect",
    pcb_silkscreen_rect_id: `pcb_silkscreen_rect_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    center: {
      x: milsToMillimeters((record.bounds.minX + record.bounds.maxX) / 2),
      y: milsToMillimeters((record.bounds.minY + record.bounds.maxY) / 2),
    },
    width,
    height,
    stroke_width: Math.min(width, height),
    is_filled: true,
    has_stroke: false,
    ccw_rotation: record.rotation,
    layer: mapOverlayLayer(record.layer),
  }
}

export function convertPcbSilkscreenRegion({
  record,
  recordIndex,
}: {
  record: AltiumRegionRecord
  recordIndex: number
}): PcbSilkscreenGraphic | undefined {
  const geometry = getPcbRegionGeometry(record)
  const outerVertices = geometry.outline.points.map(toMillimeterPoint)
  if (outerVertices.length < 3) return undefined

  const innerRings = geometry.holes
    .map((hole) => ({ vertices: hole.points.map(toMillimeterPoint) }))
    .filter((ring) => ring.vertices.length >= 3)

  return {
    type: "pcb_silkscreen_graphic",
    pcb_silkscreen_graphic_id: `pcb_silkscreen_graphic_altium_region_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    shape: "brep",
    brep_shape: {
      outer_ring: { vertices: outerVertices },
      inner_rings: innerRings,
    },
    layer: mapOverlayLayer(record.layer),
  }
}

export function convertPcbSilkscreenText({
  record,
  recordIndex,
}: {
  record: AltiumTextRecord
  recordIndex: number
}): PcbSilkscreenText | undefined {
  if (!record.position || !record.text) return undefined
  return {
    type: "pcb_silkscreen_text",
    pcb_silkscreen_text_id: `pcb_silkscreen_text_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    text: record.text,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapTextAnchor(record.justification),
    ccw_rotation: record.rotation,
    layer: mapOverlayLayer(record.layer),
    is_mirrored: record.mirrored,
  }
}
