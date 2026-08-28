import {
  AltiumFillRecord,
  type AltiumPoint,
  type AltiumRecord,
  AltiumRegionRecord,
  getPcbRegionGeometry,
} from "altiumts"

const MILS_TO_MILLIMETERS = 0.0254
const BOARD_GRAPHICS_COMPONENT_ID = "pcb_component_altium_board_graphics"

interface AltiumFabricationRect {
  shape: "rect" | "rotated_rect"
  x: number
  y: number
  width: number
  height: number
  ccwRotation: number
  pcbComponentId: string
}

interface AltiumFabricationPolygon {
  shape: "polygon"
  points: Array<{ x: number; y: number }>
  pcbComponentId: string
}

export type AltiumFabricationGraphic =
  | AltiumFabricationRect
  | AltiumFabricationPolygon

export function getAltiumFabricationGraphic({
  record,
}: {
  record: AltiumRecord
}): AltiumFabricationGraphic | undefined {
  if (record instanceof AltiumFillRecord) {
    if (!record.bounds) return undefined
    const width = milsToMillimeters(record.bounds.maxX - record.bounds.minX)
    const height = milsToMillimeters(record.bounds.maxY - record.bounds.minY)
    return {
      shape: record.rotation === 0 ? "rect" : "rotated_rect",
      x: milsToMillimeters((record.bounds.minX + record.bounds.maxX) / 2),
      y: milsToMillimeters((record.bounds.minY + record.bounds.maxY) / 2),
      width,
      height,
      ccwRotation: record.rotation,
      pcbComponentId: pcbComponentIdForRecord(record),
    }
  }

  if (record instanceof AltiumRegionRecord) {
    const geometry = getPcbRegionGeometry(record)
    if (geometry.holes.length > 0 || geometry.outline.points.length < 3) {
      return undefined
    }
    return {
      shape: "polygon",
      points: geometry.outline.points.map(toMillimeterPoint),
      pcbComponentId: pcbComponentIdForRecord(record),
    }
  }

  return undefined
}

function pcbComponentIdForRecord(record: AltiumRecord): string {
  const index = record.getNumber("COMPONENT")
  return index === undefined || index < 0
    ? BOARD_GRAPHICS_COMPONENT_ID
    : `pcb_component_altium_${index}`
}

function milsToMillimeters(value: number): number {
  return value * MILS_TO_MILLIMETERS
}

function toMillimeterPoint(point: AltiumPoint): { x: number; y: number } {
  return { x: milsToMillimeters(point.x), y: milsToMillimeters(point.y) }
}
