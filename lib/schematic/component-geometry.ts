import {
  type AltiumPoint,
  type AltiumRecord,
  AltiumSchEllipseRecord,
  AltiumSchPinRecord,
  AltiumSchRectangleRecord,
  getSchematicRecordPoints,
} from "altiumts"
import type { SchematicComponent, SchematicText } from "circuit-json"

import {
  type Bounds,
  getBoundsForPoints,
  getCorner,
  getLocation,
  getRectangle,
  mergeBounds,
} from "./geometry"

export function createComponentText({
  anchor,
  component,
  id,
  position,
  text,
}: {
  anchor: SchematicText["anchor"]
  component: SchematicComponent
  id: string
  position: AltiumPoint
  text: string
}): SchematicText {
  return {
    type: "schematic_text",
    anchor,
    color: "#006464",
    font_size: 0.18,
    position,
    rotation: 0,
    schematic_component_id: component.schematic_component_id,
    schematic_sheet_id: component.schematic_sheet_id,
    schematic_text_id: id,
    text,
  }
}

export function getComponentBodyBounds(
  records: AltiumRecord[],
  portPoints: AltiumPoint[],
): Bounds {
  const rectangles = records
    .filter(
      (record): record is AltiumSchRectangleRecord =>
        record instanceof AltiumSchRectangleRecord,
    )
    .flatMap((record) => {
      const rectangle = getRectangle(record)
      return rectangle ? [rectangle] : []
    })
  if (rectangles.length > 0) return mergeBounds(rectangles)

  const points: AltiumPoint[] = []
  for (const record of records) {
    if (record instanceof AltiumSchPinRecord) continue
    const location = getLocation(record)
    const corner = getCorner(record)
    if (location && corner) points.push(location, corner)
    points.push(...getSchematicRecordPoints(record))
    if (record instanceof AltiumSchEllipseRecord && location) {
      const radiusX = Math.abs(record.getNumber("RADIUS") ?? 0)
      const radiusY = Math.abs(record.getNumber("SECONDARYRADIUS") ?? radiusX)
      points.push(
        { x: location.x - radiusX, y: location.y - radiusY },
        { x: location.x + radiusX, y: location.y + radiusY },
      )
    }
  }
  if (points.length > 0) return getBoundsForPoints(points)
  const bounds = getBoundsForPoints(portPoints)
  if (bounds.minX === bounds.maxX) {
    bounds.minX -= 2
    bounds.maxX += 2
  }
  if (bounds.minY === bounds.maxY) {
    bounds.minY -= 2
    bounds.maxY += 2
  }
  return bounds
}
