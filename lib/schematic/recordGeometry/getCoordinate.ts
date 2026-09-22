import type { AltiumRecord } from "altiumts"

export function getCoordinate(
  record: AltiumRecord,
  key: string,
  fallback = 0,
): number {
  const integerPart = Number(record.getCaseInsensitive(key) ?? fallback)
  const fractionRaw = record.getCaseInsensitive(`${key}_FRAC`)
  if (!Number.isFinite(integerPart) || fractionRaw === undefined) {
    return Number.isFinite(integerPart) ? integerPart : fallback
  }
  const fraction = Number(`0.${fractionRaw.replace(/^[+-]/u, "")}`)
  if (!Number.isFinite(fraction)) return integerPart
  return integerPart < 0 ? integerPart - fraction : integerPart + fraction
}
