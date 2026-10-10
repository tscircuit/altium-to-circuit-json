import { SCHEMATIC_COMPONENT_COLORS } from "./schematicComponentColors"

export function getSchematicComponentFillColor(
  sourceColor: string | undefined,
  fillRole: "body" | "solid",
): string | undefined {
  if (
    sourceColor === undefined ||
    sourceColor === "transparent" ||
    sourceColor === "none"
  ) {
    return sourceColor
  }
  return fillRole === "solid"
    ? SCHEMATIC_COMPONENT_COLORS.outline
    : SCHEMATIC_COMPONENT_COLORS.body
}
