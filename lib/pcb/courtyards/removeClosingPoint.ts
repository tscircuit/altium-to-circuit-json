import type { AltiumPoint } from "altiumts"
import { altiumPointsApproximatelyEqual } from "./altiumPointsApproximatelyEqual"

export function removeClosingPoint(points: AltiumPoint[]): AltiumPoint[] {
  const first = points[0]
  const last = points.at(-1)
  return first && last && altiumPointsApproximatelyEqual(first, last)
    ? points.slice(0, -1)
    : points
}
