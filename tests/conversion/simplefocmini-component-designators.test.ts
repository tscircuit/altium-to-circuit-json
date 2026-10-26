import { expect, test } from "bun:test"
import { convertAltiumToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("SimpleFOC Mini preserves PCB component designators", async () => {
  const source = await readReferenceBytes("simplefocmini-2024-04-26.PcbDoc")
  const elements = convertAltiumToCircuitJson(source, { sourceType: "pcb" })
  const sourceComponents = elements.filter(
    (element) => element.type === "source_component",
  )
  const pcbComponents = elements.filter(
    (element) => element.type === "pcb_component",
  )
  const designatorById = new Map(
    sourceComponents.map((component) => [
      component.source_component_id,
      component.name,
    ]),
  )

  expect(pcbComponents).toHaveLength(16)
  expect(
    pcbComponents.every((component) =>
      designatorById.has(component.source_component_id),
    ),
  ).toBe(true)
  expect(
    pcbComponents
      .slice(3)
      .map((component) => designatorById.get(component.source_component_id)),
  ).toEqual([
    "LED1",
    "R5",
    "C3",
    "H1",
    "R1",
    "R2",
    "R3",
    "R4",
    "C1",
    "C2",
    "C4",
    "P1",
    "U1",
  ])
})
