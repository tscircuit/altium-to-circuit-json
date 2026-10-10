import { expect, test } from "bun:test"
import { normalizeSchematicComponentElement } from "../../lib/schematic/components/normalizeSchematicComponentElement"

test("preserves transparent borders and fills on component graphics", () => {
  for (const color of ["transparent", "none"]) {
    const path = {
      type: "schematic_path" as const,
      schematic_path_id: "hidden-border",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      stroke_width: 0.01,
      stroke_color: color,
      fill_color: color,
      is_filled: false,
      is_dashed: true,
    }
    expect(normalizeSchematicComponentElement(path)).toEqual(path)
    const circle = {
      type: "schematic_circle" as const,
      schematic_circle_id: "open-bubble",
      center: { x: 1, y: 2 },
      radius: 0.05,
      color,
      fill_color: color,
      is_filled: false,
      is_dashed: false,
    }
    expect(normalizeSchematicComponentElement(circle)).toEqual(circle)
  }
})
