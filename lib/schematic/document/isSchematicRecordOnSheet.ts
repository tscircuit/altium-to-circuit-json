import type { AltiumRecord } from "altiumts"
import { getLocation } from "../geometry"
import type { SheetDimensions } from "./types"

export function isSchematicRecordOnSheet({
  record,
  sheetDimensions,
}: {
  record: AltiumRecord
  sheetDimensions: SheetDimensions
}): boolean {
  if (record.recordKind !== "4") return true
  const location = getLocation(record)
  if (!location) return true
  return (
    location.x >= 0 &&
    location.x <= sheetDimensions.width &&
    location.y >= 0 &&
    location.y <= sheetDimensions.height
  )
}
