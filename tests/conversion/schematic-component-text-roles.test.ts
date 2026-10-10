import { expect, test } from "bun:test"
import { normalizeSchematicComponentElement } from "../../lib/schematic/components/normalizeSchematicComponentElement"

test("distinguishes active-low pin names from pin numbers and component labels", () => {
  const text = {
    type: "schematic_text" as const,
    schematic_text_id: "opaque-text-id",
    text: "RESET",
    text_parts: [{ text: "RESET", overline: true }],
    position: { x: 1, y: 2 },
    font_size: 0.18,
    anchor: "top_left" as const,
    rotation: 90,
    color: "#0000ff",
  }
  expect(
    normalizeSchematicComponentElement(text, { textRole: "pin_name" }),
  ).toEqual({
    ...text,
    color: "#006464",
  })
  expect(
    normalizeSchematicComponentElement(
      {
        ...text,
        schematic_text_id: "opaque-number-id",
      },
      { textRole: "pin_number" },
    ).color,
  ).toBe("#a90000")
  expect(
    normalizeSchematicComponentElement({
      ...text,
      schematic_text_id: "schematic_pin_name_misleading-id",
    }).color,
  ).toBe("#0f0f0f")
  expect(text.color).toBe("#0000ff")
})
