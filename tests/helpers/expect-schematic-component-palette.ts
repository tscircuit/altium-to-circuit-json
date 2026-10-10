import { expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"

export function expectSchematicComponentPalette(
  elements: AnyCircuitElement[],
): void {
  for (const element of elements) {
    if (
      !("schematic_component_id" in element) ||
      !element.schematic_component_id
    )
      continue
    // No-ERC crosses are sheet annotations associated with a component later.
    if (
      element.type === "schematic_line" &&
      /_[ab]$/u.test(element.schematic_line_id)
    )
      continue
    if ("color" in element && element.color !== undefined) {
      expect(
        ["#840000", "#a90000", "#006464", "#0f0f0f", "transparent", "none"],
        JSON.stringify(element),
      ).toContain(element.color)
    }
    if ("stroke_color" in element && element.stroke_color !== undefined) {
      expect(
        ["#840000", "#a90000", "transparent", "none"],
        JSON.stringify(element),
      ).toContain(element.stroke_color)
    }
    if ("fill_color" in element && element.fill_color !== undefined) {
      expect(
        ["#ffffc2", "#840000", "transparent", "none"],
        JSON.stringify(element),
      ).toContain(element.fill_color)
    }
  }
}
