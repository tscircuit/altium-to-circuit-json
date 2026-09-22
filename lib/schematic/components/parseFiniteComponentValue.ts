import { type BaseTscircuitUnit, parseAndConvertSiUnit } from "format-si-unit"

export function parseFiniteComponentValue({
  componentUnit,
  componentValue,
}: {
  componentUnit: BaseTscircuitUnit
  componentValue: string
}): number | undefined {
  const parsedComponentValue = parseAndConvertSiUnit(
    componentValue,
    componentUnit,
  ).value
  if (
    typeof parsedComponentValue !== "number" ||
    !Number.isFinite(parsedComponentValue)
  ) {
    return undefined
  }
  return parsedComponentValue
}
