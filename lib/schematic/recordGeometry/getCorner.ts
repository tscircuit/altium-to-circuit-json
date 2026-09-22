import type { AltiumPoint, AltiumRecord } from "altiumts"
import { getCoordinate } from "./getCoordinate"

export function getCorner(record: AltiumRecord): AltiumPoint | undefined {
  if (
    record.getCaseInsensitive("CORNER.X") === undefined ||
    record.getCaseInsensitive("CORNER.Y") === undefined
  ) {
    return undefined
  }
  return {
    x: getCoordinate(record, "CORNER.X"),
    y: getCoordinate(record, "CORNER.Y"),
  }
}
