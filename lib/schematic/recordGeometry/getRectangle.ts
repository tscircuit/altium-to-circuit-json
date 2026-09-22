import type { AltiumRecord } from "altiumts"
import { getCorner } from "./getCorner"
import { getLocation } from "./getLocation"
import type { Rectangle } from "./types"

export function getRectangle(record: AltiumRecord): Rectangle | undefined {
  const location = getLocation(record)
  const corner = getCorner(record)
  if (!location || !corner) return undefined
  return {
    minX: Math.min(location.x, corner.x),
    minY: Math.min(location.y, corner.y),
    maxX: Math.max(location.x, corner.x),
    maxY: Math.max(location.y, corner.y),
  }
}
