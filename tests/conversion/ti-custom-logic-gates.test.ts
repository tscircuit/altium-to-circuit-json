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

test("preserves custom TI logic-gate bodies instead of generic boxes", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/13.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const gateSourceIds = new Set(
    circuitJson
      .filter(
        (element): element is SourceComponent =>
          element.type === "source_component" &&
          (element.name === "U57" || element.name === "U58"),
      )
      .flatMap((element) =>
        element.source_component_id ? [element.source_component_id] : [],
      ),
  )
  const gateComponents = circuitJson.filter(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id !== undefined &&
      gateSourceIds.has(element.source_component_id),
  )

  expect(gateComponents).toHaveLength(2)
  expect(
    gateComponents.every(
      (component) =>
        component.is_box_with_pins === false &&
        component.symbol_name === undefined,
    ),
  ).toBe(true)
  expect(
    gateComponents.every((component) =>
      circuitJson.some(
        (element) =>
          (element.type === "schematic_arc" ||
            element.type === "schematic_rect") &&
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
