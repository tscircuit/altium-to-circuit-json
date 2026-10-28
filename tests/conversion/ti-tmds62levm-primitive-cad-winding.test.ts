import { expect, test } from "bun:test"
import { AltiumComponentBodyRecord, parseAltiumAscii } from "altiumts"
import type { CadComponent, CircuitJson } from "circuit-json"
import {
  convertCircuitJsonToGltf,
  loadJscadPlan,
  type STLMesh,
} from "circuit-json-to-gltf"
import { createPrimitiveBodyPlan } from "../../lib/pcb/cadModels/createPrimitiveBodyPlan"
import sourceBodies from "../fixtures/ti-tmds62levm-primitive-cad-bodies.json"
import { expectPrimitiveCadBodySnapshot } from "../helpers/expect-primitive-cad-body-snapshot"
import { getSignedMeshVolume } from "../helpers/get-signed-mesh-volume"

test("TMDS62LEVM primitive bodies face outward without a flickering PCB-plane cap", async () => {
  const cadComponents = sourceBodies.map((sourceBody): CadComponent => {
    const componentBody = parseAltiumAscii(sourceBody.bodyRecord)[0]
    if (!(componentBody instanceof AltiumComponentBodyRecord))
      throw new Error("Expected a ComponentBody")
    const layer = sourceBody.layer === "bottom" ? "bottom" : "top"
    return {
      type: "cad_component",
      cad_component_id: sourceBody.name,
      source_component_id: sourceBody.name,
      pcb_component_id: sourceBody.name,
      position: {
        ...sourceBody.componentPosition,
        z: layer === "bottom" ? -0.8 : 0.8,
      },
      rotation: { x: 0, y: 0, z: 0 },
      layer,
      model_origin_position: { x: 0, y: 0, z: 0 },
      model_object_fit: "contain_within_bounds",
      anchor_alignment: "center",
      model_jscad: createPrimitiveBodyPlan({
        componentBody,
        componentPosition: sourceBody.componentPosition,
        layer,
      }),
    }
  })
  expect(cadComponents).toHaveLength(3)
  const visualCircuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board",
      center: { x: 32, y: 58 },
      width: 40,
      height: 78,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    ...cadComponents,
  ]
  const glb = await convertCircuitJsonToGltf(visualCircuitJson, {
    format: "glb",
  })
  if (!(glb instanceof ArrayBuffer)) throw new Error("Expected a GLB")
  await expectPrimitiveCadBodySnapshot({
    glb,
    testPath: import.meta.path,
    viewName: "top",
    camPos: [-19, 15, 9],
    lookAt: [-35.6, 2, 31.1],
  })
  await expectPrimitiveCadBodySnapshot({
    glb,
    testPath: import.meta.path,
    viewName: "bottom",
    camPos: [-18, -7, 78],
    lookAt: [-22.92477, -2.7, 85.64922418],
  })

  for (const cadComponent of cadComponents) {
    const mesh = loadJscadPlan(cadComponent.model_jscad)
    expect(getMinimumOutwardFaceDistance(mesh)).toBeGreaterThan(0)
    if (cadComponent.layer === "top") {
      // 8.382 mm square with two 1.016 mm corner chamfers, 3.81 mm tall.
      expect(Math.abs(getSignedMeshVolume(mesh))).toBeCloseTo(
        (8.382 ** 2 - 1.016 ** 2) * 3.81,
        6,
      )
      expect(mesh.boundingBox.min.y).toBeCloseTo(0, 8)
      expect(mesh.boundingBox.max.y).toBeCloseTo(3.81, 8)
    } else {
      expect(Math.abs(getSignedMeshVolume(mesh))).toBeCloseTo(
        1.016 * 1.524 * 3.81,
        6,
      )
      expect(mesh.boundingBox.min.y).toBeCloseTo(-3.81, 8)
      expect(mesh.boundingBox.max.y).toBeCloseTo(0, 8)
    }
  }
})

// These three source bodies are convex. Each outward face normal must point
// away from the interior box center, in the loader's Y-up mm frame.
function getMinimumOutwardFaceDistance(mesh: STLMesh): number {
  const center = {
    x: (mesh.boundingBox.min.x + mesh.boundingBox.max.x) / 2,
    y: (mesh.boundingBox.min.y + mesh.boundingBox.max.y) / 2,
    z: (mesh.boundingBox.min.z + mesh.boundingBox.max.z) / 2,
  }
  return Math.min(
    ...mesh.triangles.map(
      ({ normal, vertices: [point] }) =>
        normal.x * (point.x - center.x) +
        normal.y * (point.y - center.y) +
        normal.z * (point.z - center.z),
    ),
  )
}
