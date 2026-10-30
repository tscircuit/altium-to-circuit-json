import type { BRepShape, Point } from "circuit-json"

export function createCircularKeepoutBrep({
  center,
  innerRadius,
  outerRadius,
}: {
  center: Point
  innerRadius: number
  outerRadius: number
}): BRepShape {
  if (
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    !Number.isFinite(innerRadius) ||
    !Number.isFinite(outerRadius) ||
    innerRadius < 0 ||
    outerRadius <= innerRadius
  ) {
    throw new Error(
      "Circular keepout geometry must be finite with 0 <= inner < outer",
    )
  }

  return {
    outer_ring: {
      vertices: [
        { x: center.x + outerRadius, y: center.y, bulge: -1 },
        { x: center.x - outerRadius, y: center.y, bulge: -1 },
      ],
    },
    inner_rings:
      innerRadius > 0
        ? [
            {
              vertices: [
                { x: center.x + innerRadius, y: center.y, bulge: 1 },
                { x: center.x - innerRadius, y: center.y, bulge: 1 },
              ],
            },
          ]
        : [],
  }
}
