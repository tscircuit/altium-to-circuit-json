import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

const PCB_FILENAME = TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb

test("converts LM5155EVM-FLY bottom-projected mounting feet", async () => {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(PCB_FILENAME),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${PCB_FILENAME}/${embeddedModel.index}.step`,
  })
  const bottomCadModels = circuitJson.filter(
    (element): element is CadComponent =>
      element.type === "cad_component" && element.layer === "bottom",
  )

  expect(bottomCadModels).toHaveLength(4)
  for (const model of bottomCadModels) {
    expect(model.model_step_url).toStartWith(`/cad-models/${PCB_FILENAME}/`)
  }
})
