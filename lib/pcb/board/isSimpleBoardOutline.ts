import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type { AltiumPoint } from "altiumts"
import { pointsApproximatelyEqual, removeClosingPoint } from "../geometry"

export function isSimpleBoardOutline(outline: AltiumPoint[]): boolean {
  const distinctPoints = outline.filter(
    (point, index) =>
      index === 0 ||
      !pointsApproximatelyEqual({
        left: outline[index - 1]!,
        right: point,
        maxEndpointGapMils: 0.0001,
      }),
  )
  const points = removeClosingPoint({
    points: distinctPoints,
    maxEndpointGapMils: 0.0001,
  })
  if (points.length < 3) return false

  for (const [index, start] of points.entries()) {
    const end = points[(index + 1) % points.length]!
    for (let nextIndex = index + 2; nextIndex < points.length; nextIndex++) {
      if (index === 0 && nextIndex === points.length - 1) continue
      if (
        doesLineIntersectLine(
          [start, end],
          [points[nextIndex]!, points[(nextIndex + 1) % points.length]!],
        )
      ) {
        return false
      }
    }
  }
  return true
}
