import type { AltiumPoint } from "altiumts"
import { pointsApproximatelyEqual } from "../geometry"

export function hasBranchingOutlinePaths({
  paths,
  maxEndpointGapMils,
}: {
  paths: AltiumPoint[][]
  maxEndpointGapMils: number
}): boolean {
  const endpoints = paths.flatMap((path) => {
    const start = path[0]
    const end = path.at(-1)
    return start && end ? [start, end] : []
  })

  // Each endpoint must have at most one possible continuation for stitching
  // to be independent of record order.
  for (const [endpointIndex, endpoint] of endpoints.entries()) {
    let matchingEndpointCount = 0
    for (const [candidateIndex, candidate] of endpoints.entries()) {
      if (candidateIndex === endpointIndex) continue
      if (
        !pointsApproximatelyEqual({
          left: endpoint,
          right: candidate,
          maxEndpointGapMils,
        })
      )
        continue
      matchingEndpointCount++
      if (matchingEndpointCount > 1) return true
    }
  }
  return false
}
