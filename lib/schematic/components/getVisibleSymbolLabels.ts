import { type AltiumRecord, AltiumSchLabelRecord } from "altiumts"

export function getVisibleSymbolLabels(records: AltiumRecord[]): Set<string> {
  return new Set(
    records.flatMap((record) => {
      if (!(record instanceof AltiumSchLabelRecord)) return []
      const text = record.text?.trim().toUpperCase()
      return text ? [text] : []
    }),
  )
}
