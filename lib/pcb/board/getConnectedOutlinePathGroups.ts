import type { AltiumPoint } from "altiumts"
import { pointsApproximatelyEqual } from "../geometry"

export function getConnectedOutlinePathGroups({
  paths,
  maxEndpointGapMils,
}: {
  paths: AltiumPoint[][]
  maxEndpointGapMils: number
}): AltiumPoint[][][] {
  const remaining = new Set(paths)
  const groups: AltiumPoint[][][] = []
  for (const path of remaining) {
    remaining.delete(path)
    const group = [path]
    for (const connectedPath of group) {
      const connectedEndpoints = [connectedPath[0], connectedPath.at(-1)]
      for (const candidate of remaining) {
        const candidateEndpoints = [candidate[0], candidate.at(-1)]
        const sharesEndpoint = connectedEndpoints.some(
          (connectedEndpoint) =>
            connectedEndpoint &&
            candidateEndpoints.some(
              (candidateEndpoint) =>
                candidateEndpoint &&
                pointsApproximatelyEqual({
                  left: connectedEndpoint,
                  right: candidateEndpoint,
                  maxEndpointGapMils,
                }),
            ),
        )
        if (!sharesEndpoint) continue
        remaining.delete(candidate)
        group.push(candidate)
      }
    }
    groups.push(group)
  }
  return groups
}
