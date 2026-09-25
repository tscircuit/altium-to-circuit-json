import type { AltiumRecord } from "altiumts"

export function isSchematicPrimitiveRecord(record: AltiumRecord): boolean {
  return ["6", "7", "8", "10", "11", "12", "13", "14"].includes(
    record.recordKind ?? "",
  )
}
