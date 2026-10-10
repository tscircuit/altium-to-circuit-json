import type { AnyCircuitElement } from "circuit-json"
import { getSchematicComponentFillColor } from "./getSchematicComponentFillColor"
import { SCHEMATIC_COMPONENT_COLORS } from "./schematicComponentColors"

export function normalizeSchematicComponentElement<T extends AnyCircuitElement>(
  element: T,
): T {
  if (element.type === "schematic_text") {
    const color = element.schematic_text_id.startsWith(
      "schematic_pin_designator_",
    )
      ? SCHEMATIC_COMPONENT_COLORS.pinNumber
      : element.schematic_text_id.startsWith("schematic_pin_name_")
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
      fill_color: getSchematicComponentFillColor(element.fill_color),
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
      fill_color: getSchematicComponentFillColor(element.fill_color),
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
