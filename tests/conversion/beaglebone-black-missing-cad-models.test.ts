import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import { BEAGLEBONE_BLACK_PCB_FILENAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("BeagleBone Black board source contains no CAD models", async () => {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(BEAGLEBONE_BLACK_PCB_FILENAME),
  )

  expect({
    sourceComponentCount: document.components.length,
    sourceComponentBodyCount: document.componentBodies.length,
    sourceEmbeddedModelCount: document.embeddedModels.length,
  }).toEqual({
    sourceComponentCount: 381,
    sourceComponentBodyCount: 0,
    sourceEmbeddedModelCount: 0,
  })
})
