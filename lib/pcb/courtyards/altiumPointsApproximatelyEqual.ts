import type { AltiumPoint } from "altiumts"

export function altiumPointsApproximatelyEqual(
  left: AltiumPoint,
  right: AltiumPoint,
): boolean {
  return (
    Math.abs(left.x - right.x) <= 0.01 && Math.abs(left.y - right.y) <= 0.01
  )
}
