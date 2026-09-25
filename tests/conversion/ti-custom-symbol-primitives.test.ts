import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicComponent } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("preserves native graphics for the TI RJ45 integrated magnetics symbol", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/32.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const schematicComponent = circuitJson.find(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id === "source_component_altium_3801",
  )
  const ownedElements = circuitJson.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id ===
        schematicComponent?.schematic_component_id,
  )

  expect(schematicComponent?.is_box_with_pins).toBe(false)
  expect(
    ownedElements.filter((element) => element.type === "schematic_line"),
  ).toHaveLength(227)
  expect(
    ownedElements.filter((element) => element.type === "schematic_arc"),
  ).toHaveLength(101)
  expect(
    ownedElements.filter((element) => element.type === "schematic_circle"),
  ).toHaveLength(42)
  expect(
    ownedElements.filter((element) => element.type === "schematic_text"),
  ).toHaveLength(18)
})
