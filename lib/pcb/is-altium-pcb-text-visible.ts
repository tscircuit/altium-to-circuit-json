import type { AltiumPcbDocument, AltiumTextRecord } from "altiumts"

export function isAltiumPcbTextVisible({
  document,
  record,
}: {
  document: AltiumPcbDocument
  record: AltiumTextRecord
}): boolean {
  const component = document.getComponentForRecord(record)
  if (!component) return true
  if (record.isDesignator && component.getBoolean("NAMEON") === false) {
    return false
  }
  if (record.isComment && component.getBoolean("COMMENTON") === false) {
    return false
  }
  return true
}
