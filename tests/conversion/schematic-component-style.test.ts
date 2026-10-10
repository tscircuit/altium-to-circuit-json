import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { expectSchematicComponentPalette } from "../helpers/expect-schematic-component-palette"
import { findDetachedSymbolPortIds } from "../helpers/find-detached-symbol-ports"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"

function createDocument(libraryReference = "CustomDevice", designator = "U1") {
  return parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      `|RECORD=1|LibReference=${libraryReference}|Designator=${designator}|PartCount=1|CurrentPartId=1|Location.X=50|Location.Y=50`,
      "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=50|Name=IN|Designator=1|PinLength=10|Orientation=2|COLOR=16711680",
      "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=60|Location.Y=50|Name=OUT|Designator=2|PinLength=10|Orientation=0|COLOR=16711680",
      "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55|COLOR=16711680|AREACOLOR=16777215|ISSOLID=T",
      "|RECORD=13|OwnerIndex=1|OwnerPartId=1|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55|COLOR=16711680",
      "|RECORD=8|OwnerIndex=1|OwnerPartId=1|Location.X=48|Location.Y=52|RADIUS=1|COLOR=16711680|AREACOLOR=0|ISSOLID=T",
      "|RECORD=7|OwnerIndex=1|OwnerPartId=1|LOCATIONCOUNT=3|X1=50|Y1=50|X2=53|Y2=50|X3=50|Y3=53|COLOR=16711680|AREACOLOR=16711680|ISSOLID=T",
      `|RECORD=34|OwnerIndex=1|OwnerPartId=-1|Location.X=50|Location.Y=58|Text=${designator}|COLOR=8388608`,
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Location.X=50|Location.Y=42|Name=Comment|Text=Device|COLOR=8388608",
      "|RECORD=4|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=53|Text=hidden|ISHIDDEN=T|COLOR=16711680",
      "|RECORD=4|Location.X=20|Location.Y=80|Text=Sheet note|COLOR=16711680",
      "|RECORD=13|Location.X=10|Location.Y=10|Corner.X=20|Corner.Y=10|COLOR=16711680",
      "|RECORD=27|LOCATIONCOUNT=2|X1=20|Y1=50|X2=40|Y2=50",
    ].join("\n"),
  )
}

const options = { centerOnSchematicSheet: false, schematicUnitScale: 0.1 }

test.each([
  ["Res1", "R1", /^boxresistor_/u],
  ["Cap", "C1", /^capacitor_/u],
  ["DIODE_RECTIFIER", "D1", /^diode_/u],
])(
  "prefers the native %s symbol over complete colored source artwork",
  (reference, name, symbol) => {
    const elements = convertAltiumSchDocToCircuitJson(
      createDocument(reference, name),
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
  },
)

test("styles compatibility bodies without changing solid marks, labels, or sheet artwork", async () => {
  const elements = convertAltiumSchDocToCircuitJson(createDocument(), options)
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

test("component palette normalization respects includeText false", () => {
  const elements = convertAltiumSchDocToCircuitJson(createDocument(), {
    ...options,
    includeText: false,
  })
  expect(elements.some((element) => element.type === "schematic_text")).toBe(
    false,
  )
  expect(
    elements.filter((element) => element.type === "schematic_port"),
  ).toHaveLength(2)
  expectSchematicComponentPalette(elements)
})
