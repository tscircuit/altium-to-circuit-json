import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

type SchematicComponent = Extract<
  AnyCircuitElement,
  { type: "schematic_component" }
>
type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>

test("preserves complete testpoint circles from the TI source schematic", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/25.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const testpointSourceIds = new Set(
    circuitJson
      .filter(
        (element): element is SourceComponent =>
          element.type === "source_component" &&
          (element.name === "TP4" || element.name === "TP5"),
      )
      .flatMap((element) =>
        element.source_component_id ? [element.source_component_id] : [],
      ),
  )
  const testpointComponents = circuitJson.filter(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id !== undefined &&
      testpointSourceIds.has(element.source_component_id),
  )

  expect(testpointComponents).toHaveLength(2)
  expect(
    testpointComponents.every(
      (component) =>
        component.is_box_with_pins === false &&
        component.symbol_name === undefined,
    ),
  ).toBe(true)
  expect(
    testpointComponents.every((component) =>
      circuitJson.some(
        (element) =>
          element.type === "schematic_circle" &&
          element.schematic_component_id === component.schematic_component_id,
      ),
    ),
  ).toBe(true)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
