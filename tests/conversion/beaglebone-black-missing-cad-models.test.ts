import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { BEAGLEBONE_BLACK_PCB_FILENAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("BeagleBone Black source contains no CAD models", async () => {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(BEAGLEBONE_BLACK_PCB_FILENAME),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${BEAGLEBONE_BLACK_PCB_FILENAME}/${embeddedModel.index}.step`,
  })

  expect({
    convertedCadComponentCount: circuitJson.filter(
      (element) => element.type === "cad_component",
    ).length,
    convertedPcbComponentCount: circuitJson.filter(
      (element) => element.type === "pcb_component",
    ).length,
    sourceComponentBodyCount: document.componentBodies.length,
    sourceEmbeddedModelCount: document.embeddedModels.length,
  }).toEqual({
    convertedCadComponentCount: 0,
    convertedPcbComponentCount: 381,
    sourceComponentBodyCount: 0,
    sourceEmbeddedModelCount: 0,
  })
})
