import { expect, test } from "bun:test"
import { AltiumComponentBodyRecord, parseAltiumAscii } from "altiumts"
import { loadJscadPlan, type STLMesh } from "circuit-json-to-gltf"
import { createPrimitiveBodyPlan } from "../../lib/pcb/cadModels/createPrimitiveBodyPlan"
import type { JscadPoint2 } from "../../lib/pcb/cadModels/jscadOperation"
import { getSignedMeshVolume } from "../helpers/get-signed-mesh-volume"

const outerPoints: JscadPoint2[] = [
  [1000, 2000],
  [1400, 2000],
  [1400, 2300],
  [1000, 2300],
]
const holePoints: JscadPoint2[] = [
  [1100, 2100],
  [1200, 2100],
  [1200, 2200],
  [1100, 2200],
]

test("primitive CAD extrusion preserves holes and standoff with either contour winding on both layers", () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const reverseOuter of [false, true]) {
      for (const reverseHole of [false, true]) {
        const outline = reverseOuter ? outerPoints.toReversed() : outerPoints
        const hole = reverseHole ? holePoints.toReversed() : holePoints
        const sourceRecord = [
          "|RECORD=ComponentBody|LAYER=MECHANICAL7|STANDOFFHEIGHT=20mil|OVERALLHEIGHT=100mil|HOLECOUNT=1|HOLE0COUNT=4",
          ...outline.map(
            ([x, y], index) => `|VX${index}=${x}mil|VY${index}=${y}mil`,
          ),
          ...hole.map(
            ([x, y], index) =>
              `|HOLE0VX${index}=${x}mil|HOLE0VY${index}=${y}mil`,
          ),
        ].join("")
        const componentBody = parseAltiumAscii(sourceRecord)[0]
        if (!(componentBody instanceof AltiumComponentBodyRecord))
          throw new Error("Expected a ComponentBody")
        const plan = createPrimitiveBodyPlan({
          componentBody,
          componentPosition: { x: 30.48, y: 54.61 },
          layer,
        })
        expect(plan).toBeDefined()
        const mesh = loadJscadPlan(plan)
        // 400 x 300 mil exterior minus a 100 x 100 mil through-hole,
        // extruded from 20 mil standoff to 100 mil overall height.
        expect(getSignedMeshVolume(mesh)).toBeCloseTo(
          -(10.16 * 7.62 - 2.54 ** 2) * 2.032,
          2,
        )
        expectHoleWallNormalsIntoCavity(mesh)
        expect(mesh.boundingBox.min.y).toBeCloseTo(
          layer === "top" ? 0.508 : -2.54,
          8,
        )
        expect(mesh.boundingBox.max.y).toBeCloseTo(
          layer === "top" ? 2.54 : -0.508,
          8,
        )
        expect(componentBody.getString()).toBe(sourceRecord)
      }
    }
  }
})

function expectHoleWallNormalsIntoCavity(mesh: STLMesh): void {
  // Hole planes in the loader's Y-up mm frame after the component offset.
  const walls = [
    ["x", -2.54, 1],
    ["x", 0, -1],
    ["z", -1.27, 1],
    ["z", 1.27, -1],
  ] as const
  for (const [axis, coordinate, expectedNormal] of walls) {
    const triangles = mesh.triangles.filter(({ vertices }) =>
      vertices.every((vertex) => Math.abs(vertex[axis] - coordinate) < 0.0001),
    )
    expect(triangles.length).toBeGreaterThan(0)
    for (const { normal } of triangles) {
      expect(normal[axis]).toBeCloseTo(expectedNormal, 8)
      expect(normal.y).toBeCloseTo(0, 8)
    }
  }
}
