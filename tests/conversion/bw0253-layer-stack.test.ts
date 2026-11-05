import { expect, test } from "bun:test"
import { getPcbLayerStack, parseAltiumBinaryPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { PcbCopperLayerMap } from "../../lib/pcb/layers"
import { readReferenceBytes } from "../helpers/read-reference"

test("converts BW0253 using native copper identities in physical order", async () => {
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
  const layerMap = new PcbCopperLayerMap(document)
  expect(layerMap.getLayer("MID-LAYER2")).toBe("inner1")
  expect(layerMap.getLayer("MID-LAYER1")).toBe("inner2")
  expect(layerMap.getDisplayName("MID-LAYER2")).toBe("MidLayer 1")
  expect(layerMap.getDisplayName("MID-LAYER1")).toBe("MidLayer 2")
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  expect(
    circuitJson.find((element) => element.type === "pcb_board")?.num_layers,
  ).toBe(4)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
  expect(document.getBytes()).toEqual(source)
})
