import { expect, test } from "bun:test"
import { normalizeSchematicComponentElement } from "../../lib/schematic/components/normalizeSchematicComponentElement"

test.each(["transparent", "none"])(
  "preserves %s borders and fills on component graphics",
  (color) => {
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
  },
)

test("distinguishes active-low pin names from pin numbers and component labels", () => {
  const text = {
    type: "schematic_text" as const,
    schematic_text_id: "schematic_pin_name_altium_3",
    text: "RESET",
    text_parts: [{ text: "RESET", overline: true }],
    position: { x: 1, y: 2 },
    font_size: 0.18,
    anchor: "top_left" as const,
    rotation: 90,
    color: "#0000ff",
  }
  expect(normalizeSchematicComponentElement(text)).toEqual({
    ...text,
    color: "#006464",
  })
  expect(
    normalizeSchematicComponentElement({
      ...text,
      schematic_text_id: "schematic_pin_designator_altium_3",
    }).color,
  ).toBe("#a90000")
  expect(
    normalizeSchematicComponentElement({
      ...text,
      schematic_text_id: "schematic_text_altium_3",
    }).color,
  ).toBe("#0f0f0f")
  expect(text.color).toBe("#0000ff")
})
