import { expect, test } from "bun:test"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { createComponentStyleDocument } from "../helpers/create-component-style-document"
import { findDetachedSymbolPortIds } from "../helpers/find-detached-symbol-ports"

const options = { centerOnSchematicSheet: false, schematicUnitScale: 0.1 }

test("prefers native symbols over complete colored source artwork", () => {
  for (const [reference, name, symbol] of [
    ["Res1", "R1", /^boxresistor_/u],
    ["Cap", "C1", /^capacitor_/u],
    ["DIODE_RECTIFIER", "D1", /^diode_/u],
  ] as const) {
    const elements = convertAltiumSchDocToCircuitJson(
      createComponentStyleDocument(reference, name),
      options,
    )
    const component = elements.find(
      (element) => element.type === "schematic_component",
    )
    expect(component?.symbol_name).toMatch(symbol)
    expect(
      elements.filter(
        (element) =>
          [
            "schematic_line",
            "schematic_circle",
            "schematic_path",
            "schematic_rect",
          ].includes(element.type) &&
          "schematic_component_id" in element &&
          element.schematic_component_id === component?.schematic_component_id,
      ),
    ).toEqual([])
    expect(
      elements.filter((element) => element.type === "schematic_port"),
    ).toHaveLength(2)
    expect(findDetachedSymbolPortIds(elements)).toEqual([])
  }
})
