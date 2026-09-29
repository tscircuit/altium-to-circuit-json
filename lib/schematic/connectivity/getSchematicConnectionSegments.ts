import { type AltiumRecord, AltiumSchPinRecord } from "altiumts"
import { getLocation } from "../geometry"
import type { SchematicSegment } from "../model"
import { DIRECTION_BY_ORIENTATION, VECTOR_BY_DIRECTION } from "./constants"
import { getWireSegments } from "./getWireSegments"

export function getSchematicConnectionSegments(
  records: AltiumRecord[],
): SchematicSegment[] {
  const segments = getWireSegments(
    records.filter(
      (record) => record.recordKind === "26" || record.recordKind === "27",
    ),
  )
  for (const record of records) {
    if (!(record instanceof AltiumSchPinRecord)) continue
    const conglomerate = record.pinConglomerate
    if (
      record.getBoolean("ISHIDDEN") ||
      (conglomerate !== undefined && (conglomerate & 4) !== 0)
    ) {
      continue
    }
    const location = getLocation(record)
    if (!location) continue
    const orientation =
      (conglomerate ?? record.orientationQuarterTurns ?? 0) & 3
    const direction = DIRECTION_BY_ORIENTATION[orientation] ?? "right"
    const directionVector = VECTOR_BY_DIRECTION[direction]
    const pinLength = Math.max(record.pinLengthSchematicUnits ?? 10, 0)
    const terminal = {
      x: location.x + directionVector.x * pinLength,
      y: location.y + directionVector.y * pinLength,
    }
    segments.push({ end: terminal, start: terminal })
  }
  return segments
}
