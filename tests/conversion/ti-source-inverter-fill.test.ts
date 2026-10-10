import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI DRV8307 source-drawn inverter bubbles remain hollow", async () => {
  const elements = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(await readReferenceBytes("ti-drv8307evm.SchDoc")),
  )
  const source = elements
    .filter((e) => e.type === "source_component")
    .find((e) => e.name === "U11")
  expect(source).toBeDefined()
  const componentIds = elements
    .filter((e) => e.type === "schematic_component")
    .filter((e) => e.source_component_id === source?.source_component_id)
    .map((e) => e.schematic_component_id)
  const bubbles = elements
    .filter((e) => e.type === "schematic_circle")
    .filter((e) => componentIds.includes(e.schematic_component_id ?? ""))
  expect(bubbles).toHaveLength(2)
  for (const bubble of bubbles) {
    expect(bubble).toMatchObject({
      color: "#840000",
      fill_color: "#ffffc2",
      is_filled: true,
    })
  }
})
