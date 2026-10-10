import { expect, test } from "bun:test"
import { createComponentStyleDocument } from "../helpers/create-component-style-document"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { expectSchematicComponentPalette } from "../helpers/expect-schematic-component-palette"
import { findDetachedSymbolPortIds } from "../helpers/find-detached-symbol-ports"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"

const options = { centerOnSchematicSheet: false, schematicUnitScale: 0.1 }

test("styles compatibility bodies without changing solid marks, labels, or sheet artwork", async () => {
  const elements = convertAltiumSchDocToCircuitJson(
    createComponentStyleDocument(),
    options,
  )
  const component = elements.find(
    (element) => element.type === "schematic_component",
  )
  expect(component?.is_box_with_pins).toBe(false)
  expect(component?.symbol_name).toBeUndefined()
  expectSchematicComponentPalette(elements)
  expect(
    elements.find(
      (element) =>
        element.type === "schematic_rect" && element.schematic_component_id,
    ),
  ).toMatchObject({
    color: "#840000",
    fill_color: "#ffffc2",
    is_filled: true,
    center: { x: 5, y: 5 },
    width: 1,
    height: 1,
  })
  expect(
    elements.find((element) => element.type === "schematic_circle"),
  ).toMatchObject({
    color: "#840000",
    fill_color: "#840000",
    is_filled: true,
    center: { x: 48 * 0.1, y: 52 * 0.1 },
    radius: 0.1,
  })
  expect(
    elements.find((element) => element.type === "schematic_path"),
  ).toMatchObject({
    stroke_color: "#840000",
    fill_color: "#840000",
    is_filled: true,
  })
  expect(
    elements.find(
      (element) => element.type === "schematic_text" && element.text === "U1",
    ),
  ).toMatchObject({ color: "#0f0f0f" })
  expect(
    elements.find(
      (element) =>
        element.type === "schematic_text" && element.text === "Device",
    ),
  ).toMatchObject({ color: "#0f0f0f" })
  expect(
    elements.some(
      (element) =>
        element.type === "schematic_text" && element.text === "hidden",
    ),
  ).toBe(false)
  expect(
    elements.find(
      (element) =>
        element.type === "schematic_text" && element.text === "Sheet note",
    ),
  ).toMatchObject({ color: "#0000ff" })
  expect(
    elements.find(
      (element) =>
        element.type === "schematic_line" && !element.schematic_component_id,
    ),
  ).toMatchObject({ color: "#0000ff" })
  const ports = elements.filter((element) => element.type === "schematic_port")
  expect(ports.map((port) => port.pin_number)).toEqual([1, 2])
  expect(
    elements.find((element) => element.type === "source_trace")
      ?.connected_source_port_ids,
  ).toContain(ports[0]?.source_port_id)
  expect(findDetachedSymbolPortIds(elements)).toEqual([])
  for (const element of elements) {
    const parsed = any_circuit_element.safeParse(element)
    expect(parsed.success, JSON.stringify(element)).toBe(true)
  }
  await expect(renderImportedSchematicToSvg(elements)).toMatchSvgSnapshot(
    import.meta.path,
    "component-palette",
  )
})
