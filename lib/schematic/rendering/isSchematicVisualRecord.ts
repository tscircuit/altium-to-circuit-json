import type { AltiumRecord } from "altiumts"
import { isSchematicPrimitiveRecord } from "./isSchematicPrimitiveRecord"

export function isSchematicVisualRecord(record: AltiumRecord): boolean {
  return (
    isSchematicPrimitiveRecord(record) ||
    ["4", "25", "28", "34", "41"].includes(record.recordKind ?? "")
  )
}
