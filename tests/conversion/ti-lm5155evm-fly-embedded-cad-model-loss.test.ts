import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "LM5155EVM-FLY preserves embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 24,
      "embeddedModelPlacementCount": 24,
      "firstBottomConvertedCadComponent": {
        "layer": "bottom",
        "modelStepUrl": "/cad-models/ti-lm5155evm-fly.PcbDoc/17.step",
        "position": {
          "x": 97.58688128,
          "y": 75.79351872,
          "z": -0.81532128,
        },
        "rotation": {
          "x": 270,
          "y": 0,
          "z": 270,
        },
      },
      "firstBottomEmbeddedModelPlacement": {
        "layer": "bottom",
        "modelIndex": 17,
        "modelZOffsetMils": 0.6032,
        "positionMils": {
          "x": 3842.0032,
          "y": 2983.9968,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 90,
        },
        "standoffHeightMils": 0.6032,
      },
      "firstConvertedCadComponent": {
        "layer": "top",
        "modelStepUrl": "/cad-models/ti-lm5155evm-fly.PcbDoc/0.step",
        "position": {
          "x": 18.64765892,
          "y": 61.3155492,
          "z": 0.8,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 0,
        },
      },
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "modelZOffsetMils": 0,
        "positionMils": {
          "x": 734.1598,
          "y": 2413.998,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 0,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
