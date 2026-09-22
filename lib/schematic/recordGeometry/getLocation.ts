import type { AltiumPoint, AltiumRecord } from "altiumts"
import { getCoordinate } from "./getCoordinate"

export function getLocation(record: AltiumRecord): AltiumPoint | undefined {
  if (
    record.getCaseInsensitive("LOCATION.X") === undefined ||
    record.getCaseInsensitive("LOCATION.Y") === undefined
  ) {
    return undefined
  }
  return {
    x: getCoordinate(record, "LOCATION.X"),
    y: getCoordinate(record, "LOCATION.Y"),
  }
}
