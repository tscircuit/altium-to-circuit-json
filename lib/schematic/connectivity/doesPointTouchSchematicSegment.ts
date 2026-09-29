import type { AltiumPoint } from "altiumts"
import type { SchematicSegment } from "../model"
import { isPointOnSegment } from "./isPointOnSegment"

export function doesPointTouchSchematicSegment(
  point: AltiumPoint,
  segments: SchematicSegment[],
): boolean {
  return segments.some(({ end, start }) =>
    isPointOnSegment({ end, point, start }),
  )
}
