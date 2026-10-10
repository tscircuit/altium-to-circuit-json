import type { AnyCircuitElement } from "circuit-json"
import { getSchematicComponentFillColor } from "./getSchematicComponentFillColor"
import { SCHEMATIC_COMPONENT_COLORS } from "./schematicComponentColors"

export function normalizeSchematicComponentElement<T extends AnyCircuitElement>(
  element: T,
  {
    textRole,
    fillRole = "solid",
  }: {
    textRole?: "component_label" | "pin_name" | "pin_number"
    fillRole?: "body" | "solid"
  } = {},
): T {
  if (element.type === "schematic_text") {
    const color =
      textRole === "pin_number"
        ? SCHEMATIC_COMPONENT_COLORS.pinNumber
        : textRole === "pin_name"
          ? SCHEMATIC_COMPONENT_COLORS.pinName
          : SCHEMATIC_COMPONENT_COLORS.label
    return { ...element, color }
  }
  if (element.type === "schematic_path") {
    return {
      ...element,
      stroke_color:
        element.stroke_color === "transparent" ||
        element.stroke_color === "none"
          ? element.stroke_color
          : SCHEMATIC_COMPONENT_COLORS.outline,
      fill_color: getSchematicComponentFillColor(element.fill_color, fillRole),
    }
  }
  if (
    element.type === "schematic_rect" ||
    element.type === "schematic_circle"
  ) {
    return {
      ...element,
      color:
        element.color === "transparent" || element.color === "none"
          ? element.color
          : SCHEMATIC_COMPONENT_COLORS.outline,
      fill_color: getSchematicComponentFillColor(element.fill_color, fillRole),
    }
  }
  if (element.type === "schematic_line" || element.type === "schematic_arc") {
    return {
      ...element,
      color:
        element.color === "transparent" || element.color === "none"
          ? element.color
          : SCHEMATIC_COMPONENT_COLORS.outline,
    }
  }
  return element
}
