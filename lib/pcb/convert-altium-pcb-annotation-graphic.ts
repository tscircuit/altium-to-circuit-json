import {
  AltiumArcRecord,
  AltiumFillRecord,
  type AltiumPcbDocument,
  type AltiumPoint,
  type AltiumRecord,
  AltiumRegionRecord,
  AltiumTrackRecord,
  getPcbRegionGeometry,
} from "altiumts"
import type {
  PcbFabricationNotePath,
  PcbFabricationNoteRect,
} from "circuit-json"
import {
  approximateAltiumArc,
  milsToMillimeters,
  toMillimeterPoint,
} from "./coordinates"
import {
  getPcbAnnotationColor,
  getPcbAnnotationComponentId,
  getPcbAnnotationLayer,
} from "./pcb-annotation-properties"

type PcbAnnotationGraphic = PcbFabricationNotePath | PcbFabricationNoteRect

export function convertAltiumPcbAnnotationGraphic({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumRecord
  recordIndex: number
}): PcbAnnotationGraphic | undefined {
  if (record instanceof AltiumTrackRecord) {
    return convertTrack({ document, record, recordIndex })
  }
  if (record instanceof AltiumArcRecord) {
    return convertArc({ document, record, recordIndex })
  }
  if (record instanceof AltiumFillRecord) {
    return convertFill({ document, record, recordIndex })
  }
  if (record instanceof AltiumRegionRecord && record.recordKind === "Region") {
    return convertRegion({ document, record, recordIndex })
  }
  return undefined
}

function convertTrack({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumTrackRecord
  recordIndex: number
}): PcbFabricationNotePath | undefined {
  if (!record.start || !record.end) return undefined
  return createPath({
    document,
    points: [record.start, record.end],
    record,
    recordIndex,
    strokeWidthMils: record.widthMils ?? 4,
  })
}

function convertArc({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumArcRecord
  recordIndex: number
}): PcbFabricationNotePath | undefined {
  if (!record.center || !record.radiusMils) return undefined
  return createPath({
    document,
    points: approximateAltiumArc({
      center: record.center,
      radiusMils: record.radiusMils,
      startAngle: record.startAngle,
      endAngle: record.endAngle,
    }),
    record,
    recordIndex,
    strokeWidthMils: record.widthMils ?? 4,
  })
}

function convertRegion({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumRegionRecord
  recordIndex: number
}): PcbFabricationNotePath | undefined {
  const points = closePath(getPcbRegionGeometry(record).outline.points)
  if (points.length < 4) return undefined
  return createPath({
    document,
    points,
    record,
    recordIndex,
    strokeWidthMils: 4,
  })
}

function convertFill({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumFillRecord
  recordIndex: number
}): PcbFabricationNotePath | PcbFabricationNoteRect | undefined {
  const bounds = record.bounds
  if (!bounds) return undefined
  const widthMils = bounds.maxX - bounds.minX
  const heightMils = bounds.maxY - bounds.minY
  if (widthMils <= 0 || heightMils <= 0) return undefined
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }

  if (record.rotation === 0) {
    return {
      type: "pcb_fabrication_note_rect",
      pcb_fabrication_note_rect_id: `pcb_fabrication_note_rect_altium_${recordIndex}`,
      pcb_component_id: getPcbAnnotationComponentId(record),
      center: toMillimeterPoint(center),
      width: milsToMillimeters(widthMils),
      height: milsToMillimeters(heightMils),
      layer: getPcbAnnotationLayer({ document, record }),
      stroke_width: 0,
      is_filled: true,
      has_stroke: false,
      color: getPcbAnnotationColor(record),
    }
  }

  return createPath({
    document,
    points: createRotatedRectangle({
      center,
      heightMils,
      rotation: record.rotation,
      widthMils,
    }),
    record,
    recordIndex,
    strokeWidthMils: 4,
  })
}

function createPath({
  document,
  points,
  record,
  recordIndex,
  strokeWidthMils,
}: {
  document: AltiumPcbDocument
  points: AltiumPoint[]
  record: AltiumRecord
  recordIndex: number
  strokeWidthMils: number
}): PcbFabricationNotePath {
  return {
    type: "pcb_fabrication_note_path",
    pcb_fabrication_note_path_id: `pcb_fabrication_note_path_altium_${recordIndex}`,
    pcb_component_id: getPcbAnnotationComponentId(record),
    layer: getPcbAnnotationLayer({ document, record }),
    route: points.map(toMillimeterPoint),
    stroke_width: milsToMillimeters(strokeWidthMils),
    color: getPcbAnnotationColor(record),
  }
}

function closePath(points: AltiumPoint[]): AltiumPoint[] {
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return points
  return first.x === last.x && first.y === last.y ? points : [...points, first]
}

function createRotatedRectangle({
  center,
  heightMils,
  rotation,
  widthMils,
}: {
  center: AltiumPoint
  heightMils: number
  rotation: number
  widthMils: number
}): AltiumPoint[] {
  const halfWidth = widthMils / 2
  const halfHeight = heightMils / 2
  const radians = (rotation * Math.PI) / 180
  const points = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ].map((point) => ({
    x: center.x + point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: center.y + point.x * Math.sin(radians) + point.y * Math.cos(radians),
  }))
  return closePath(points)
}
