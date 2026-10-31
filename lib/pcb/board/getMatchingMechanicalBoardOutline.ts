import {
  AltiumArcRecord,
  type AltiumBounds,
  type AltiumPcbDocument,
  type AltiumPoint,
  AltiumTrackRecord,
  getAltiumBounds,
} from "altiumts"
import { removeClosingPoint, stitchConnectedAltiumPaths } from "../geometry"
import { isMechanicalLayer } from "../layers"
import { boundsContainWithTolerance } from "./boundsContainWithTolerance"
import { MAX_ENDPOINT_GAP_MILS } from "./constants"
import { getArcPoints } from "./getArcPoints"
import { isClosedPath } from "./isClosedPath"
import { isSimpleBoardOutline } from "./isSimpleBoardOutline"

type MechanicalLayerName = string
type OutlinePathKey = string

export function getMatchingMechanicalBoardOutline({
  document,
  declaredBounds,
}: {
  document: AltiumPcbDocument
  declaredBounds: AltiumBounds
}): AltiumPoint[] | undefined {
  const pathsByLayer = new Map<MechanicalLayerName, AltiumPoint[][]>()
  const pathKeysByLayer = new Map<MechanicalLayerName, Set<OutlinePathKey>>()
  for (const record of document.records) {
    const layer = record.getDecoded("LAYER")?.toUpperCase()
    if (!layer || !isMechanicalLayer(layer)) continue
    if (document.getComponentForRecord(record)) continue

    let path: AltiumPoint[]
    if (record instanceof AltiumTrackRecord && record.start && record.end) {
      path = [record.start, record.end]
    } else if (record instanceof AltiumArcRecord) {
      path = getArcPoints(record)
    } else {
      continue
    }
    const bounds = getAltiumBounds(path)
    if (
      !bounds ||
      !boundsContainWithTolerance({
        container: declaredBounds,
        contained: bounds,
        tolerance: MAX_ENDPOINT_GAP_MILS,
      })
    )
      continue

    // Duplicate drawing tracks must not create a backtracking perimeter.
    const forwardKey = JSON.stringify(path)
    const reverseKey = JSON.stringify(path.toReversed())
    const pathKey = forwardKey < reverseKey ? forwardKey : reverseKey
    const pathKeys = pathKeysByLayer.get(layer) ?? new Set<OutlinePathKey>()
    if (pathKeys.has(pathKey)) continue
    pathKeys.add(pathKey)
    pathKeysByLayer.set(layer, pathKeys)
    const paths = pathsByLayer.get(layer) ?? []
    paths.push(path)
    pathsByLayer.set(layer, paths)
  }

  const candidates: AltiumPoint[][] = []
  for (const paths of pathsByLayer.values()) {
    for (const path of stitchConnectedAltiumPaths({
      paths,
      maxEndpointGapMils: MAX_ENDPOINT_GAP_MILS,
    })) {
      if (!isClosedPath(path) || !isSimpleBoardOutline(path)) continue
      const bounds = getAltiumBounds(path)
      if (
        !bounds ||
        !boundsContainWithTolerance({
          container: bounds,
          contained: declaredBounds,
          tolerance: MAX_ENDPOINT_GAP_MILS,
        })
      )
        continue
      candidates.push(
        removeClosingPoint({
          points: path,
          maxEndpointGapMils: MAX_ENDPOINT_GAP_MILS,
        }),
      )
    }
  }
  // Fabrication drawings can contain several contours. Do not guess between them.
  return candidates.length === 1 ? candidates[0] : undefined
}
