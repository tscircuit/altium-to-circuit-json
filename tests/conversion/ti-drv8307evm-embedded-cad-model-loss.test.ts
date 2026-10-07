import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "DRV8307EVM preserves embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.drv8307Evm.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 6,
      "embeddedModelPlacementCount": 6,
      "firstBottomConvertedCadComponent": undefined,
      "firstBottomEmbeddedModelPlacement": undefined,
      "firstConvertedCadComponent": {
        "layer": "top",
        "modelStepUrl": "/cad-models/ti-drv8307evm.PcbDoc/0.step",
        "position": {
          "x": 35.88981646,
          "y": 51.935024399999996,
          "z": 2.21523974,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
      },
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "modelZOffsetMils": 55.7181,
        "positionMils": {
          "x": 1412.9849,
          "y": 2044.686,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
        "standoffHeightMils": 0.6,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.drv8307Evm.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
