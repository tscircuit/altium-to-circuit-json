import type { STLMesh } from "circuit-json-to-gltf"

/** Signed volume of the loader's intermediate Y-up mm mesh. loadJscadPlan
 * swaps Y/Z without reversing triangle vertices, so correctly wound JSCAD
 * solids yield negative volume here; inside-out solids yield positive volume.
 */
export function getSignedMeshVolume(mesh: STLMesh): number {
  return mesh.triangles.reduce(
    (volume, { vertices: [first, second, third] }) => {
      return (
        volume +
        (first.x * (second.y * third.z - second.z * third.y) +
          first.y * (second.z * third.x - second.x * third.z) +
          first.z * (second.x * third.y - second.y * third.x)) /
          6
      )
    },
    0,
  )
}
