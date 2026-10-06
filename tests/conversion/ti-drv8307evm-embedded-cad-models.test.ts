import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { CadComponent } from "circuit-json"
import { convertAltiumToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"

test("TI DRV8307EVM embedded STEP models retain their placements", async () => {
  const pcbBytes = new Uint8Array(
    await readFile(
      resolve(
        import.meta.dir,
        "../fixtures/downloaded",
        TI_EVM_REFERENCE_FILENAMES.drv8307Evm.pcb,
      ),
    ),
  )
  const circuitJson = convertAltiumToCircuitJson(pcbBytes, {
    sourceType: "pcb",
    pcb: {
      resolveEmbeddedModelUrl: ({ embeddedModel }) =>
        `/cad-models/drv8307evm/${embeddedModel.index}.step`,
    },
  })
  const cadComponents = circuitJson.filter(
    (element): element is CadComponent => element.type === "cad_component",
  )

  expect(cadComponents).toHaveLength(6)
  expect(
    cadComponents.map((component) => ({
      cadComponentId: component.cad_component_id,
      pcbComponentId: component.pcb_component_id,
      sourceComponentId: component.source_component_id,
      position: component.position,
      rotation: component.rotation,
      layer: component.layer,
      modelStepUrl: component.model_step_url,
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "cadComponentId": "cad_component_altium_139",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/0.step",
        "pcbComponentId": "pcb_component_altium_8",
        "position": {
          "x": 35.88981646,
          "y": 51.935024399999996,
          "z": 0.8152400000000001,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
        "sourceComponentId": "source_component_altium_8",
      },
      {
        "cadComponentId": "cad_component_altium_140",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/5.step",
        "pcbComponentId": "pcb_component_altium_27",
        "position": {
          "x": 35.86473142,
          "y": 74.77766858,
          "z": 0.78640084,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 180,
        },
        "sourceComponentId": "source_component_altium_27",
      },
      {
        "cadComponentId": "cad_component_altium_141",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/2.step",
        "pcbComponentId": "pcb_component_altium_18",
        "position": {
          "x": 67.04884736,
          "y": 110.08367112,
          "z": -2.70000062,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0,
        },
        "sourceComponentId": "source_component_altium_18",
      },
      {
        "cadComponentId": "cad_component_altium_142",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/1.step",
        "pcbComponentId": "pcb_component_altium_9",
        "position": {
          "x": 31.925854359999995,
          "y": 51.80124514,
          "z": 0.8152400000000001,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0,
        },
        "sourceComponentId": "source_component_altium_9",
      },
      {
        "cadComponentId": "cad_component_altium_143",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/3.step",
        "pcbComponentId": "pcb_component_altium_31",
        "position": {
          "x": 43.75343802,
          "y": 51.56878688,
          "z": 0.80014986,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 270,
        },
        "sourceComponentId": "source_component_altium_31",
      },
      {
        "cadComponentId": "cad_component_altium_144",
        "layer": "top",
        "modelStepUrl": "/cad-models/drv8307evm/4.step",
        "pcbComponentId": "pcb_component_altium_79",
        "position": {
          "x": 88.76080037999999,
          "y": 62.032598820000004,
          "z": -3.19999962,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 180,
        },
        "sourceComponentId": "source_component_altium_79",
      },
    ]
  `)
})
