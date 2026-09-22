import {
  type AltiumPoint,
  type AltiumRecord,
  type AltiumSchDoc,
  AltiumSchLabelRecord,
  AltiumSchNetLabelRecord,
  AltiumSchPortRecord,
  AltiumSchPowerPortRecord,
  getSchematicRecordPoints,
} from "altiumts"
import type {
  AnyCircuitElement,
  SchematicNetLabel,
  SchematicText,
} from "circuit-json"

import { getOrCreateSourceNet } from "./convert-connectivity"
import {
  type CardinalDirection,
  getLocation,
  pointsEqual,
  scalePoint,
} from "./geometry"
import { isPowerNet } from "./ids"
import {
  directionToOppositeSide,
  getPortConnectionGeometry,
  getRecordDirection,
  getWireSegments,
  isPointOnSegment,
} from "./semantic-geometry"
import type {
  ConnectivityConversion,
  SemanticNetGraph,
  SemanticSchematicOptions,
} from "./semantic-types"

const INLINE_NET_LABEL_COLOR = "rgb(132, 0, 0)"
const DEFAULT_INLINE_NET_LABEL_FONT_SIZE = 0.18
const MIN_INLINE_NET_LABEL_FONT_SIZE = 0.1
const INLINE_NET_LABEL_CHARACTER_WIDTH = 0.12
const INLINE_NET_LABEL_HORIZONTAL_PADDING = 0.12

export function convertNetLabels({
  connectivity,
  document,
  elements,
  handledRecords,
  options,
  semanticNetGraph: graph,
}: {
  connectivity: ConnectivityConversion
  document: AltiumSchDoc
  elements: AnyCircuitElement[]
  handledRecords: Set<AltiumRecord>
  options: SemanticSchematicOptions
  semanticNetGraph: SemanticNetGraph
}): void {
  const allWireSegments = getWireSegments(document.wires)

  for (const [recordIndex, record] of document.records.entries()) {
    if (!isElectricalLabelRecord(record)) continue
    if (record.getBoolean("ISHIDDEN") && options.includeHidden !== true) {
      handledRecords.add(record)
      continue
    }
    const name = getElectricalLabelName(record)
    const portConnection =
      record instanceof AltiumSchPortRecord
        ? getPortConnectionGeometry(record, allWireSegments)
        : undefined
    const location = portConnection?.anchor ?? getLocation(record)
    if (!name || !location) continue
    const connectedWires = graph.getConnectedWiresForRecord(record)
    const wire = connectedWires[0]
    // Altium's generic label record is also used for page titles and notes.
    // It is only an electrical net label when it touches a wire.
    if (record instanceof AltiumSchLabelRecord && !wire) continue
    const sourceTraceId = connectivity.sourceTraceIdByRecord.get(record)
    const shouldRenderInline =
      Boolean(sourceTraceId) &&
      (record instanceof AltiumSchNetLabelRecord ||
        (record instanceof AltiumSchPortRecord &&
          (record.getNumber("IOTYPE") ?? 0) === 0 &&
          connectivity.sourcePortCountByRecord.get(record) === 2 &&
          !isPowerNet(name)))
    if (shouldRenderInline && sourceTraceId) {
      handledRecords.add(record)
      elements.push(
        createInlineNetLabelText({
          connectedWires,
          document,
          location,
          name,
          options,
          record,
          recordIndex,
          sourceTraceId,
        }),
      )
      continue
    }
    handledRecords.add(record)

    const sourceNetId =
      connectivity.sourceNetIdByRecord.get(record) ??
      getOrCreateSourceNet({
        elements,
        name,
        sourceNetIdByName: connectivity.sourceNetIdByName,
      })
    const schematicTraceId = wire
      ? connectivity.schematicTraceIdByRecord.get(wire)
      : undefined
    const direction = getRecordDirection(record)
    const symbolName =
      record instanceof AltiumSchPowerPortRecord
        ? getPowerPortSymbolName(record, direction)
        : undefined
    const schematicNetLabel: SchematicNetLabel = {
      type: "schematic_net_label",
      anchor_position: scalePoint(location, options.scale),
      anchor_side: directionToOppositeSide(
        portConnection?.bodyDirection ?? direction,
      ),
      center: scalePoint(location, options.scale),
      schematic_net_label_id: `schematic_net_label_altium_${recordIndex}`,
      schematic_sheet_id: options.schematicSheetId,
      source_net_id: sourceNetId,
      text: name,
      ...(schematicTraceId ? { schematic_trace_id: schematicTraceId } : {}),
      ...(symbolName ? { symbol_name: symbolName } : {}),
    }
    elements.push(schematicNetLabel)
  }
}

function createInlineNetLabelText({
  connectedWires,
  document,
  location,
  name,
  options,
  record,
  recordIndex,
  sourceTraceId,
}: {
  connectedWires: AltiumRecord[]
  document: AltiumSchDoc
  location: AltiumPoint
  name: string
  options: SemanticSchematicOptions
  record: AltiumRecord
  recordIndex: number
  sourceTraceId: string
}): SchematicText {
  const direction = getInlineNetLabelDirection(record, location, connectedWires)
  const scaledLocation = scalePoint(location, options.scale)
  const fontSize = getInlineNetLabelFontSize(record, document, options.scale)
  const fontScale = fontSize / DEFAULT_INLINE_NET_LABEL_FONT_SIZE
  const textWidth =
    (name.length * INLINE_NET_LABEL_CHARACTER_WIDTH +
      INLINE_NET_LABEL_HORIZONTAL_PADDING) *
    fontScale
  const isVertical = direction === "up" || direction === "down"
  const directionSign = direction === "left" || direction === "down" ? -1 : 1
  const isTerminalPort = record instanceof AltiumSchPortRecord
  const anchor: SchematicText["anchor"] = isTerminalPort
    ? directionSign > 0
      ? "left"
      : "right"
    : "center"
  const position = isTerminalPort
    ? isVertical
      ? {
          x: scaledLocation.x - fontSize / 2,
          y: scaledLocation.y,
        }
      : {
          x: scaledLocation.x,
          y: scaledLocation.y + fontSize / 2,
        }
    : isVertical
      ? {
          x: scaledLocation.x - fontSize / 2,
          y: scaledLocation.y + (directionSign * textWidth) / 2,
        }
      : {
          x: scaledLocation.x + (directionSign * textWidth) / 2,
          y: scaledLocation.y + fontSize / 2,
        }

  return {
    type: "schematic_text",
    anchor,
    color: INLINE_NET_LABEL_COLOR,
    font_size: fontSize,
    position,
    rotation: isVertical ? -90 : 0,
    schematic_sheet_id: options.schematicSheetId,
    schematic_text_id: `schematic_inline_net_label_altium_${recordIndex}`,
    source_trace_id: sourceTraceId,
    text: name,
  }
}

function getInlineNetLabelFontSize(
  record: AltiumRecord,
  document: AltiumSchDoc,
  scale: number,
): number {
  const fontId = Math.max(
    Math.round(Number(record.getCaseInsensitive("FONTID") ?? 1)),
    1,
  )
  const sheetRecord = document.records.find(
    (candidate) => candidate.recordKind === "31",
  )
  const sourceFontSize = Number(
    sheetRecord?.getCaseInsensitive(`SIZE${fontId}`) ??
      DEFAULT_INLINE_NET_LABEL_FONT_SIZE / scale,
  )
  return Math.min(
    DEFAULT_INLINE_NET_LABEL_FONT_SIZE,
    Math.max(MIN_INLINE_NET_LABEL_FONT_SIZE, sourceFontSize * scale),
  )
}

function getInlineNetLabelDirection(
  record: AltiumRecord,
  location: AltiumPoint,
  connectedWires: AltiumRecord[],
): CardinalDirection {
  if (!(record instanceof AltiumSchPortRecord)) {
    return getRecordDirection(record)
  }

  for (const wire of connectedWires) {
    const points = getSchematicRecordPoints(wire)
    for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
      const start = points[pointIndex - 1]
      const end = points[pointIndex]
      if (!start || !end || !isPointOnSegment(location, start, end)) continue
      const other = pointsEqual(location, start)
        ? end
        : pointsEqual(location, end)
          ? start
          : undefined
      if (!other) continue
      // Place the inline text away from the wire interior, matching the side
      // on which Altium drew the port body instead of covering the circuit.
      const dx = location.x - other.x
      const dy = location.y - other.y
      if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right"
      return dy < 0 ? "down" : "up"
    }
  }

  return getRecordDirection(record)
}

function getPowerPortSymbolName(
  record: AltiumSchPowerPortRecord,
  direction: CardinalDirection,
): string {
  const style = Math.round(record.getNumber("STYLE") ?? 2)
  if (style === 4 || style === 5) return `ground_${direction}`
  if (style === 6) return `tilted_ground_${direction}`
  return `vcc_${direction}`
}

type ElectricalLabelRecord =
  | AltiumSchLabelRecord
  | AltiumSchNetLabelRecord
  | AltiumSchPortRecord
  | AltiumSchPowerPortRecord

function isElectricalLabelRecord(
  record: AltiumRecord,
): record is ElectricalLabelRecord {
  return (
    record instanceof AltiumSchLabelRecord ||
    record instanceof AltiumSchNetLabelRecord ||
    record instanceof AltiumSchPortRecord ||
    record instanceof AltiumSchPowerPortRecord
  )
}

function getElectricalLabelName(
  record: ElectricalLabelRecord,
): string | undefined {
  return record instanceof AltiumSchPortRecord ? record.name : record.text
}
