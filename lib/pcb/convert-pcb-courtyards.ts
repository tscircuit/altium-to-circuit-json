import {
  AltiumArcRecord,
  type AltiumPcbDocument,
  type AltiumPoint,
  type AltiumRecord,
  AltiumRegionRecord,
  AltiumTrackRecord,
  approximateAltiumArc,
  getPcbRegionGeometry,
} from "altiumts"
import type { PcbCourtyardOutline } from "circuit-json"

import { toMillimeterPoint } from "./coordinates"
import { getPcbComponentId, type PcbComponentId } from "./ids"
import { getRecordLayer, isCourtyardLayer, mapCourtyardLayer } from "./layers"
import { stitchConnectedAltiumPaths } from "./stitch-connected-paths"

interface CourtyardPath {
  componentId: PcbComponentId
  layer: "top" | "bottom"
  points: AltiumPoint[]
  strokeWidthMils: number
}

export function convertPcbCourtyards(
  document: AltiumPcbDocument,
): PcbCourtyardOutline[] {
  const componentIds = new Map(
    document.components.flatMap((component, index) =>
      component.position
        ? [[component, getPcbComponentId(index)] as const]
        : [],
    ),
  )
  const paths: CourtyardPath[] = []

  for (const record of document.records) {
    const layer = getRecordLayer(record)
    if (!isCourtyardLayer(layer)) continue
    const component = document.getComponentForRecord(record)
    const componentId = component ? componentIds.get(component) : undefined
    if (!componentId) continue
    const points = getCourtyardRecordPoints(record)
    if (points.length < 2) continue
    paths.push({
      componentId,
      layer: mapCourtyardLayer(layer),
      points,
      strokeWidthMils:
        record instanceof AltiumTrackRecord || record instanceof AltiumArcRecord
          ? (record.widthMils ?? 4)
          : 0,
    })
  }

  const courtyards: PcbCourtyardOutline[] = []
  for (const path of stitchCourtyardPaths(paths)) {
    if (!isClosedAltiumPath(path.points)) continue
    const outline = removeClosingPoint(path.points).map(toMillimeterPoint)
    if (outline.length < 3) continue
    courtyards.push({
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: `pcb_courtyard_outline_altium_${courtyards.length}`,
      pcb_component_id: path.componentId,
      layer: path.layer,
      outline,
    })
  }
  return courtyards
}

function getCourtyardRecordPoints(record: AltiumRecord): AltiumPoint[] {
  if (record instanceof AltiumTrackRecord) {
    return record.start && record.end ? [record.start, record.end] : []
  }
  if (record instanceof AltiumArcRecord) {
    return record.center && record.radiusMils
      ? approximateAltiumArc({
          center: record.center,
          radius: record.radiusMils,
          startAngleDegrees: record.startAngle,
          endAngleDegrees: record.endAngle,
        })
      : []
  }
  if (record instanceof AltiumRegionRecord) {
    return getPcbRegionGeometry(record).outline.points
  }
  return []
}

function stitchCourtyardPaths(paths: CourtyardPath[]): CourtyardPath[] {
  const groups = new Map<PcbComponentId, CourtyardPath[]>()
  for (const path of deduplicateCourtyardPaths(paths)) {
    const group = groups.get(path.componentId) ?? []
    group.push(path)
    groups.set(path.componentId, group)
  }
  return [...groups.values()].flatMap((componentPaths) => {
    const layerGroups = new Map<"top" | "bottom", CourtyardPath[]>()
    for (const path of componentPaths) {
      const layerPaths = layerGroups.get(path.layer) ?? []
      layerPaths.push(path)
      layerGroups.set(path.layer, layerPaths)
    }
    return [...layerGroups.values()].flatMap((layerPaths) => {
      const widthGroups = new Map<number, CourtyardPath[]>()
      for (const path of layerPaths) {
        const strokeWidth = Number(path.strokeWidthMils.toFixed(4))
        const widthPaths = widthGroups.get(strokeWidth) ?? []
        widthPaths.push(path)
        widthGroups.set(strokeWidth, widthPaths)
      }
      return [...widthGroups.values()].flatMap(stitchCourtyardPathGroup)
    })
  })
}

function stitchCourtyardPathGroup(group: CourtyardPath[]): CourtyardPath[] {
  const first = group[0]
  if (!first) return []
  return stitchConnectedAltiumPaths({
    paths: group.map((path) => path.points),
    maxEndpointGapMils: 0.01,
  }).map((points) => ({ ...first, points }))
}

function deduplicateCourtyardPaths(paths: CourtyardPath[]): CourtyardPath[] {
  const signatures = new Set<string>()
  return paths.filter((path) => {
    const forwardPoints = path.points.map(formatAltiumPoint).join("|")
    const reversePoints = path.points
      .toReversed()
      .map(formatAltiumPoint)
      .join("|")
    const pointsSignature =
      forwardPoints < reversePoints ? forwardPoints : reversePoints
    const signature = [
      path.componentId,
      path.layer,
      path.strokeWidthMils.toFixed(4),
      pointsSignature,
    ].join("|")
    if (signatures.has(signature)) return false
    signatures.add(signature)
    return true
  })
}

function formatAltiumPoint(point: AltiumPoint): string {
  return `${point.x.toFixed(4)},${point.y.toFixed(4)}`
}

function isClosedAltiumPath(points: AltiumPoint[]): boolean {
  const first = points[0]
  const last = points.at(-1)
  return Boolean(first && last && altiumPointsApproximatelyEqual(first, last))
}

function removeClosingPoint(points: AltiumPoint[]): AltiumPoint[] {
  const first = points[0]
  const last = points.at(-1)
  return first && last && altiumPointsApproximatelyEqual(first, last)
    ? points.slice(0, -1)
    : points
}

function altiumPointsApproximatelyEqual(
  left: AltiumPoint,
  right: AltiumPoint,
): boolean {
  return (
    Math.abs(left.x - right.x) <= 0.01 && Math.abs(left.y - right.y) <= 0.01
  )
}
