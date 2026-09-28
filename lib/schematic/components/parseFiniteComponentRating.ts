import { type BaseTscircuitUnit, parseAndConvertSiUnit } from "format-si-unit"

export function parseFiniteComponentRating({
  componentUnit,
  displayText,
}: {
  componentUnit: BaseTscircuitUnit
  displayText: string
}): number | undefined {
  if (!displayText.trim()) return undefined
  let parsedComponentRating: number | null | undefined
  try {
    parsedComponentRating = parseAndConvertSiUnit(
      displayText,
      componentUnit,
    ).value
  } catch {
    return undefined
  }
  if (
    typeof parsedComponentRating !== "number" ||
    !Number.isFinite(parsedComponentRating)
  ) {
    return undefined
  }
  return parsedComponentRating
}
