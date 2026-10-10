import { expect, test } from "bun:test"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { createComponentStyleDocument } from "../helpers/create-component-style-document"
import { expectSchematicComponentPalette } from "../helpers/expect-schematic-component-palette"

const options = { centerOnSchematicSheet: false, schematicUnitScale: 0.1 }

test("component palette normalization respects includeText false", () => {
  const elements = convertAltiumSchDocToCircuitJson(
    createComponentStyleDocument(),
    {
      ...options,
      includeText: false,
    },
  )
  expect(elements.some((element) => element.type === "schematic_text")).toBe(
    false,
  )
  expect(
    elements.filter((element) => element.type === "schematic_port"),
  ).toHaveLength(2)
  expectSchematicComponentPalette(elements)
})
