import type { Point } from "circuit-json"

export function translateSchematicPoint(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y }
}
