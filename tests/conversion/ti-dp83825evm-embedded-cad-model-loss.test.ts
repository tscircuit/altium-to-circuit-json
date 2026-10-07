import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "DP83825EVM preserves embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.dp83825Evm.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 27,
      "embeddedModelPlacementCount": 27,
      "firstBottomConvertedCadComponent": {
        "layer": "bottom",
        "modelStepUrl": "/cad-models/ti-dp83825evm.PcbDoc/11.step",
        "position": {
          "x": 39.23885472,
          "y": 51.099745399999996,
          "z": -3.05000058,
        },
        "rotation": {
          "x": 270,
          "y": 0,
          "z": 90,
        },
      },
      "firstBottomEmbeddedModelPlacement": {
        "layer": "bottom",
        "modelIndex": 11,
        "modelZOffsetMils": 88.5827,
        "positionMils": {
          "x": 1544.8368,
          "y": 2011.801,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 270,
        },
        "standoffHeightMils": 0,
      },
      "firstConvertedCadComponent": {
        "layer": "top",
        "modelStepUrl": "/cad-models/ti-dp83825evm.PcbDoc/0.step",
        "position": {
          "x": 131.82591617999998,
          "y": 43.18008128,
          "z": 0.8,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 90,
        },
      },
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 5189.9967,
          "y": 1700.0032,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 90,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.dp83825Evm.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
