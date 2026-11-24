import type { AltiumPcbDocument, AltiumPcbLayerStackEntry } from "altiumts"
import { getLayerStackEntriesWithLegacyFallback } from "../layers/getLayerStackEntriesWithLegacyFallback"

export const DEFAULT_BOARD_THICKNESS_MM = 1.6

const isUnusedDielectricType = (
  dielectricType: string | undefined,
): boolean => {
  if (!dielectricType) return false
  const normalized = dielectricType.trim().toLowerCase()
  return normalized === "0" || normalized === "notused" || normalized === "none"
}

const getEntryThicknessMm = (entry: AltiumPcbLayerStackEntry): number => {
  let totalMm = 0
  if (entry.copperThickness) {
    const cuMm = entry.copperThickness.toMillimeters()
    if (Number.isFinite(cuMm) && cuMm > 0) totalMm += cuMm
  }
  if (entry.dielectricHeight && !isUnusedDielectricType(entry.dielectricType)) {
    const dielMm = entry.dielectricHeight.toMillimeters()
    if (Number.isFinite(dielMm) && dielMm > 0) totalMm += dielMm
  }
  return totalMm
}

export function getBoardThickness(document: AltiumPcbDocument): number {
  if (!document.board) return DEFAULT_BOARD_THICKNESS_MM
  const entries = getLayerStackEntriesWithLegacyFallback(document.board)

  for (const source of ["v8", "v7", "legacy"] as const) {
    const sourceEntries = entries.filter((entry) => entry.source === source)
    if (sourceEntries.length === 0) continue

    let totalMm = 0
    for (const entry of sourceEntries) {
      totalMm += getEntryThicknessMm(entry)
    }
    if (totalMm > 0) {
      return Number(totalMm.toFixed(8))
    }
  }

  return DEFAULT_BOARD_THICKNESS_MM
}
