import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"
import { readReferenceBytes } from "../helpers/read-reference"

const PCB_FILENAME = TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb

test("renders LM5155EVM-FLY bottom-projected mounting feet", async () => {
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
  await expectTiEvmConversion3dSnapshot({
    circuitJson,
    pcbFilename: PCB_FILENAME,
    testPath: import.meta.path,
  })
}, 40_000)
