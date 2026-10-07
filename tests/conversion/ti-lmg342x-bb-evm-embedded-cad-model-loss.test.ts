import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "LMG342X-BB-EVM preserves embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 77,
      "embeddedModelPlacementCount": 77,
      "firstBottomConvertedCadComponent": {
        "layer": "bottom",
        "modelStepUrl": "/cad-models/ti-lmg342x-bb-evm.PcbDoc/24.step",
        "position": {
          "x": 65.14276278,
          "y": 104.62254157999999,
          "z": -0.8,
        },
        "rotation": {
          "x": 180,
          "y": 0,
          "z": 0,
        },
      },
      "firstBottomEmbeddedModelPlacement": {
        "layer": "bottom",
        "modelIndex": 24,
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 2564.6757,
          "y": 4118.9977,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0,
        },
        "standoffHeightMils": -0.0001,
      },
      "firstConvertedCadComponent": {
        "layer": "top",
        "modelStepUrl": "/cad-models/ti-lmg342x-bb-evm.PcbDoc/0.step",
        "position": {
          "x": 141.52254652,
          "y": 102.8446,
          "z": 0.8,
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
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 5571.7538,
          "y": 4049,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
