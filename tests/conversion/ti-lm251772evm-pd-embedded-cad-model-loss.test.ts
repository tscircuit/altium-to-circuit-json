import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "LM251772EVM-PD preserves embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm251772EvmPd.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 94,
      "embeddedModelPlacementCount": 94,
      "firstBottomConvertedCadComponent": {
        "layer": "bottom",
        "modelStepUrl": "/cad-models/ti-lm251772evm-pd.PcbDoc/40.step",
        "position": {
          "x": 116.6368,
          "y": 125.3236,
          "z": -0.8,
        },
        "rotation": {
          "x": 180,
          "y": 0,
          "z": 180,
        },
      },
      "firstBottomEmbeddedModelPlacement": {
        "layer": "bottom",
        "modelIndex": 40,
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 4592,
          "y": 4934,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
        "standoffHeightMils": 0,
      },
      "firstConvertedCadComponent": {
        "layer": "top",
        "modelStepUrl": "/cad-models/ti-lm251772evm-pd.PcbDoc/0.step",
        "position": {
          "x": 67.52780754,
          "y": 82.96859962,
          "z": 0.8,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 270,
        },
      },
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 2658.5751,
          "y": 3266.4803,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 270,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm251772EvmPd.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
