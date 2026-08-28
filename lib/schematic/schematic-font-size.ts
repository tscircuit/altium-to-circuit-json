import type { AltiumRecord } from "altiumts"

export function getAltiumSchematicFontSizePoints({
  fallbackPoints,
  record,
  sheetRecord,
}: {
  fallbackPoints: number
  record: AltiumRecord
  sheetRecord: AltiumRecord | undefined
}): number {
  const parsedFontId = Number(record.getCaseInsensitive("FONTID") ?? 1)
  const fontId = Number.isFinite(parsedFontId)
    ? Math.max(Math.round(parsedFontId), 1)
    : 1
  const parsedFontSize = Number(
    sheetRecord?.getCaseInsensitive(`SIZE${fontId}`) ?? fallbackPoints,
  )
  return Number.isFinite(parsedFontSize)
    ? Math.max(parsedFontSize, 1)
    : Math.max(fallbackPoints, 1)
}
