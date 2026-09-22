import {
  type AltiumPoint,
  type AltiumRecord,
  type AltiumSchDoc,
  AltiumSchJunctionRecord,
  AltiumSchLabelRecord,
  AltiumSchNetLabelRecord,
  AltiumSchPortRecord,
  AltiumSchPowerPortRecord,
  AltiumSchWireRecord,
  getSchematicRecordPoints,
} from "altiumts"
import { getLocation, pointKey, type SchematicPointKey } from "../geometry"
import type {
  ConvertedPort,
  SchematicSegment,
  SemanticNet,
  SemanticNetGraph,
} from "../model"
import { addGraphPoint } from "./addGraphPoint"
import { getElectricalRecordName } from "./getElectricalRecordName"
import { getOrCreateSemanticNetGroup } from "./getOrCreateSemanticNetGroup"
import { getPortConnectionGeometry } from "./getPortConnectionGeometry"
import { isPointOnSegment } from "./isPointOnSegment"
import { mergeSemanticNetGroup } from "./mergeSemanticNetGroup"
import { PointDisjointSet } from "./PointDisjointSet"
import type { MutableSemanticNet } from "./types"

/**
 * Altium permits labels and pin hot spots to land anywhere on a wire segment,
 * not only on declared polyline vertices. Build the electrical graph with
 * those geometric joins so Circuit JSON source traces carry the real ports and
 * net names. Mid-segment crossings remain disconnected unless one wire has a
 * vertex there or Altium emits an explicit junction record.
 */
export function buildSemanticNetGraph(
  document: AltiumSchDoc,
  convertedPorts: ConvertedPort[],
): SemanticNetGraph {
  const disjointSet = new PointDisjointSet()
  const pointValues = new Map<SchematicPointKey, AltiumPoint>()
  const wireRecords = document.wires
  const segments: SchematicSegment[] = []

  for (const wire of wireRecords) {
    const points = getSchematicRecordPoints(wire)
    for (const point of points) {
      addGraphPoint(disjointSet, pointValues, point)
    }
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1]
      const end = points[index]
      if (!start || !end) continue
      disjointSet.union(pointKey(start), pointKey(end))
      segments.push({ end, start })
    }
  }

  const positionedRecords = document.records.flatMap((record) => {
    if (
      !(record instanceof AltiumSchLabelRecord) &&
      !(record instanceof AltiumSchNetLabelRecord) &&
      !(record instanceof AltiumSchPortRecord) &&
      !(record instanceof AltiumSchPowerPortRecord) &&
      !(record instanceof AltiumSchJunctionRecord)
    ) {
      return []
    }
    const point =
      record instanceof AltiumSchPortRecord
        ? getPortConnectionGeometry(record, segments)?.anchor
        : getLocation(record)
    return point ? [{ point, record }] : []
  })
  const positionedPins = convertedPorts.map(({ point, record }) => ({
    point,
    record,
  }))
  const joinPoints = [
    ...new Map(
      wireRecords
        .flatMap((wire) => getSchematicRecordPoints(wire))
        .map((point) => [pointKey(point), point]),
    ).values(),
    ...positionedRecords.map(({ point }) => point),
    ...positionedPins.map(({ point }) => point),
  ]

  for (const point of joinPoints) {
    addGraphPoint(disjointSet, pointValues, point)
    for (const segment of segments) {
      if (isPointOnSegment(point, segment.start, segment.end)) {
        disjointSet.union(pointKey(point), pointKey(segment.start))
      }
    }
  }

  const groupedByRoot = new Map<SchematicPointKey, MutableSemanticNet>()

  for (const point of pointValues.values()) {
    getOrCreateSemanticNetGroup({
      disjointSet,
      groupedByRoot,
      point,
    }).points.set(pointKey(point), point)
  }
  for (const wire of wireRecords) {
    const firstPoint = getSchematicRecordPoints(wire)[0]
    if (firstPoint) {
      getOrCreateSemanticNetGroup({
        disjointSet,
        groupedByRoot,
        point: firstPoint,
      }).records.add(wire)
    }
  }
  for (const { point, record } of [...positionedRecords, ...positionedPins]) {
    const group = getOrCreateSemanticNetGroup({
      disjointSet,
      groupedByRoot,
      point,
    })
    group.records.add(record)
    const name = getElectricalRecordName(record)
    if (name) group.names.add(name)
  }

  const connectedWiresByRecord = new Map<AltiumRecord, AltiumRecord[]>()
  for (const group of groupedByRoot.values()) {
    const wires = [...group.records].filter(
      (record): record is AltiumSchWireRecord =>
        record instanceof AltiumSchWireRecord,
    )
    for (const record of group.records) {
      connectedWiresByRecord.set(record, wires)
    }
  }

  const mergedGroups: MutableSemanticNet[] = []
  for (const group of groupedByRoot.values()) {
    if (group.records.size === 0) continue
    const normalizedNames = new Set(
      [...group.names].map((name) => name.trim().toUpperCase()),
    )
    const matches = mergedGroups.filter((candidate) =>
      [...candidate.names].some((name) =>
        normalizedNames.has(name.trim().toUpperCase()),
      ),
    )
    if (matches.length === 0 || normalizedNames.size === 0) {
      mergedGroups.push(group)
      continue
    }
    const target = matches[0]
    if (!target) continue
    mergeSemanticNetGroup(target, group)
    for (const duplicate of matches.slice(1)) {
      mergeSemanticNetGroup(target, duplicate)
      const duplicateIndex = mergedGroups.indexOf(duplicate)
      if (duplicateIndex >= 0) mergedGroups.splice(duplicateIndex, 1)
    }
  }

  const nets: SemanticNet[] = mergedGroups.map((group) => ({
    id: group.id,
    names: [...group.names],
    points: [...group.points.values()],
    records: [...group.records],
  }))
  return {
    getConnectedWiresForRecord: (record) =>
      connectedWiresByRecord.get(record) ?? [],
    nets,
  }
}
