import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI fiducial keeps its enclosing background and solid center", async () => {
  const elements = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(
      await readReferenceBytes("ti-lm5155evm-fly-hardware.SchDoc"),
    ),
  )
  const source = elements
    .filter((e) => e.type === "source_component")
    .find((e) => e.name === "FID1")
  expect(source).toBeDefined()
  const component = elements
    .filter((e) => e.type === "schematic_component")
    .find((e) => e.source_component_id === source?.source_component_id)
  expect(component).toBeDefined()
  const circles = elements
    .filter((e) => e.type === "schematic_circle")
    .filter(
      (e) => e.schematic_component_id === component?.schematic_component_id,
    )
    .sort((a, b) => b.radius - a.radius)
  expect(circles).toHaveLength(2)
  expect(circles[0]).toMatchObject({ is_filled: true, fill_color: "#ffffc2" })
  expect(circles[1]).toMatchObject({ is_filled: true, fill_color: "#840000" })
})
