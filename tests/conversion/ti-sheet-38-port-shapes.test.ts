import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicPath } from "circuit-json"
import { renderHierarchicalPort } from "../../lib/schematic/rendering"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI sheet 38 points dense ports away from their connected wire end", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/38.SchDoc`,
  )
  const document = parseAltiumSchDoc(source)
  const record = document.records[1078]
  expect(record?.getDecoded("NAME")).toBe("GPIO0_39_EXP")
  if (!record) throw new Error("Expected TI sheet 38 GPIO0_39_EXP port")

  const [element] = renderHierarchicalPort({
    record,
    index: 1078,
    context: { document, records: document.records, scale: 1 },
    options: { includeText: false },
    color: "#ff0000",
  })
  const path = element as SchematicPath

  expect(path.points).toEqual([
    { x: 1210, y: 565 },
    { x: 1264, y: 565 },
    { x: 1274, y: 560 },
    { x: 1264, y: 555 },
    { x: 1210, y: 555 },
  ])
})
