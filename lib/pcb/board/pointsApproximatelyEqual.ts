import type { AltiumPoint } from "altiumts"
import { MAX_ENDPOINT_GAP_MILS } from "./constants"

export function pointsApproximatelyEqual(
  left: AltiumPoint,
  right: AltiumPoint,
): boolean {
  return (
    Math.abs(left.x - right.x) <= MAX_ENDPOINT_GAP_MILS &&
    Math.abs(left.y - right.y) <= MAX_ENDPOINT_GAP_MILS
  )
}
