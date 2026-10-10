import { SCHEMATIC_COMPONENT_COLORS } from "./schematicComponentColors"

export function getSchematicComponentFillColor(
  sourceColor: string | undefined,
): string | undefined {
  if (
    sourceColor === undefined ||
    sourceColor === "transparent" ||
    sourceColor === "none"
  ) {
    return sourceColor
  }
  // Altium colors reach this boundary as six-digit CSS hex strings. Keep
  // light body backgrounds distinct from solid ink such as polarity marks,
  // diode triangles and pin dots, without retaining the source palette.
  const isLightBackground =
    /^#[\da-f]{6}$/iu.test(sourceColor) &&
    [1, 3, 5].every(
      (offset) =>
        Number.parseInt(sourceColor.slice(offset, offset + 2), 16) >= 128,
    )
  return isLightBackground
    ? SCHEMATIC_COMPONENT_COLORS.body
    : SCHEMATIC_COMPONENT_COLORS.outline
}
