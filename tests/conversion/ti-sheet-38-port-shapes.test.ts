import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicNetLabel } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI sheet 38 points dense ports away from their connected wire end", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/38.SchDoc`,
  )
  const document = parseAltiumSchDoc(source)
  const recordIndex = document.records.findIndex(
    (record) =>
      record.recordKind === "18" &&
      record.getDecoded("NAME") === "GPIO0_39_EXP",
  )
  expect(recordIndex).toBeGreaterThanOrEqual(0)
  const label = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    includeText: false,
    schematicUnitScale: 1,
  }).find(
    (element): element is SchematicNetLabel =>
      element.type === "schematic_net_label" &&
      element.schematic_net_label_id ===
        `schematic_net_label_altium_${recordIndex}`,
  )

  expect(label).toMatchObject({
    anchor_position: { x: 1210, y: 560 },
    anchor_side: "left",
    schematic_trace_id: "schematic_trace_altium_33",
    text: "GPIO0_39_EXP",
  })
})
