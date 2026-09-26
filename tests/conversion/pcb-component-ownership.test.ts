import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const boardGraphicsId = "pcb_component_altium_board_graphics"
const outline =
  "|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=100mil|VY1=0mil|KIND2=0|VX2=100mil|VY2=100mil|KIND3=0|VX3=0mil|VY3=0mil"

function graphics(componentReference: string) {
  return [
    "|RECORD=Track|LAYER=TOPOVERLAY|X1=0mil|Y1=0mil|X2=100mil|Y2=0mil|WIDTH=4mil",
    "|RECORD=Arc|LAYER=TOPOVERLAY|LOCATION.X=50mil|LOCATION.Y=50mil|RADIUS=20mil|STARTANGLE=0|ENDANGLE=90|WIDTH=4mil",
    "|RECORD=Fill|LAYER=TOPOVERLAY|X1=0mil|Y1=0mil|X2=100mil|Y2=100mil",
    `|RECORD=Region|LAYER=TOPOVERLAY|REGIONKIND=COPPER${outline}`,
    "|RECORD=Text|LAYER=TOPOVERLAY|X=0mil|Y=0mil|HEIGHT=30mil|TEXT=LABEL",
    "|RECORD=Text|LAYER=TOP|X=0mil|Y=0mil|HEIGHT=30mil|TEXT=COPPER",
    "|RECORD=Text|LAYER=MECHANICAL1|X=0mil|Y=0mil|HEIGHT=30mil|TEXT=.DESIGNATOR",
    `|RECORD=Region|LAYER=MECHANICAL15|REGIONKIND=COPPER${outline}`,
  ].map((record) => record + componentReference)
}

function graphicOwners(elements: AnyCircuitElement[]) {
  return elements.flatMap((element) =>
    element.type !== "pcb_component" && "pcb_component_id" in element
      ? [{ type: element.type, owner: element.pcb_component_id }]
      : [],
  )
}

test("resolves sparse, reordered component IDs to emitted component IDs", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Component|ID=7|LAYER=TOP|X=0mil|Y=0mil|SOURCEDESIGNATOR=U7",
      "|RECORD=Component|ID=2|LAYER=BOTTOM|X=200mil|Y=200mil|SOURCEDESIGNATOR=U2",
      ...graphics("|COMPONENT=2"),
      ...graphics("|COMPONENT=7"),
    ].join("\n"),
  )
  const elements = convertAltiumPcbDocToCircuitJson(document)
  const components = elements.filter(
    (element) => element.type === "pcb_component",
  )
  expect(components.map((component) => component.pcb_component_id)).toEqual([
    "pcb_component_altium_0",
    "pcb_component_altium_1",
  ])
  const owners = graphicOwners(elements)
  const expectedTypes = [
    "pcb_silkscreen_line",
    "pcb_silkscreen_path",
    "pcb_silkscreen_rect",
    "pcb_silkscreen_graphic",
    "pcb_silkscreen_text",
    "pcb_copper_text",
    "pcb_fabrication_note_text",
    "pcb_courtyard_outline",
  ] as const
  for (const owner of components.map(
    (component) => component.pcb_component_id,
  )) {
    expect(
      owners
        .filter((graphic) => graphic.owner === owner)
        .map((graphic) => graphic.type)
        .sort(),
    ).toEqual(expectedTypes.toSorted())
  }
  expect(owners).toHaveLength(16)
  expect(
    elements
      .filter((element) => element.type === "pcb_fabrication_note_text")
      .map(({ text, pcb_component_id, layer }) => ({
        text,
        pcb_component_id,
        layer,
      })),
  ).toEqual([
    { text: "U2", pcb_component_id: "pcb_component_altium_1", layer: "bottom" },
    { text: "U7", pcb_component_id: "pcb_component_altium_0", layer: "top" },
  ])
  expect(
    elements.every((element) => any_circuit_element.safeParse(element).success),
  ).toBe(true)
})

test.each([
  "",
  "|COMPONENT=65535",
  "|COMPONENT=-1",
  "|COMPONENT=1.5",
  "|COMPONENT=70000",
  "|COMPONENT=0",
  "|COMPONENT=42",
])("keeps unresolved reference %s on the board", (reference) => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Component|ID=7|LAYER=TOP|X=0mil|Y=0mil|SOURCEDESIGNATOR=U7",
      ...graphics(reference),
    ].join("\n"),
  )
  const owners = graphicOwners(convertAltiumPcbDocToCircuitJson(document))
  expect(owners).toHaveLength(6)
  expect(owners.every((graphic) => graphic.owner === boardGraphicsId)).toBe(
    true,
  )
})

test("preserves positional component references in documents without explicit IDs", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Component|LAYER=TOP|X=0mil|Y=0mil|SOURCEDESIGNATOR=U1",
      "|RECORD=Component|LAYER=BOTTOM|X=200mil|Y=200mil|SOURCEDESIGNATOR=U2",
      ...graphics("|COMPONENT=1"),
    ].join("\n"),
  )
  const owners = graphicOwners(convertAltiumPcbDocToCircuitJson(document))
  expect(owners).toHaveLength(8)
  expect(
    owners.every((graphic) => graphic.owner === "pcb_component_altium_1"),
  ).toBe(true)
})

test.each([true, false])(
  "does not reference unexported components (includeComponents=%s)",
  (includeComponents) => {
    const document = parseAltiumPcbDoc(
      [
        "|RECORD=Board",
        `|RECORD=Component|ID=7|LAYER=TOP|SOURCEDESIGNATOR=U7${includeComponents ? "" : "|X=0mil|Y=0mil"}`,
        ...graphics("|COMPONENT=7"),
      ].join("\n"),
    )
    const elements = convertAltiumPcbDocToCircuitJson(document, {
      includeComponents,
    })
    expect(elements.some((element) => element.type === "pcb_component")).toBe(
      false,
    )
    const owners = graphicOwners(elements)
    expect(owners).toHaveLength(6)
    expect(owners.every((graphic) => graphic.owner === boardGraphicsId)).toBe(
      true,
    )
  },
)

test("resolves exploded dimension graphics through their component", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Component|ID=7|LAYER=MECHANICAL15|X=0mil|Y=0mil",
      "|RECORD=Track|COMPONENT=7|LAYER=MECHANICAL15|X1=0mil|Y1=0mil|X2=100mil|Y2=0mil|WIDTH=4mil",
    ].join("\n"),
  )
  expect(
    graphicOwners(convertAltiumPcbDocToCircuitJson(document)),
  ).toContainEqual({
    type: "pcb_fabrication_note_path",
    owner: "pcb_component_altium_0",
  })
})
