import { expect, test } from "bun:test"
import { getPcbLayerStack, parseAltiumBinaryPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("reproduces BW0253 rejecting renamed native copper layers", async () => {
  const source = await readReferenceBytes("bw0253.PcbDoc")
  const document = parseAltiumBinaryPcbDoc(source)
  if (!document.board) throw new Error("BW0253 has no board record")
  const innerLayers = getPcbLayerStack(document.board).entries.filter(
    (entry) =>
      entry.source === "v8" &&
      ["16777219", "16777218"].includes(entry.layerId ?? ""),
  )
  expect(innerLayers.map(({ layerId, name }) => ({ layerId, name }))).toEqual([
    { layerId: "16777219", name: "MidLayer 1" },
    { layerId: "16777218", name: "MidLayer 2" },
  ])
  expect(() => convertAltiumPcbDocToCircuitJson(document)).toThrow(
    'Ambiguous copper layer name "MidLayer 1" for MID2 in board stack',
  )
  expect(document.getBytes()).toEqual(source)
})
