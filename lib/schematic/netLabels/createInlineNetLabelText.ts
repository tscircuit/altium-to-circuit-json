import type { AltiumPoint, AltiumRecord, AltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { scalePoint } from "../geometry"
import type { SemanticSchematicOptions } from "../model"
import { INLINE_NET_LABEL_COLOR } from "./constants"
import { getInlineNetLabelDirection } from "./getInlineNetLabelDirection"
import { getInlineNetLabelFontSize } from "./getInlineNetLabelFontSize"

export function createInlineNetLabelText({
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
  const direction = getInlineNetLabelDirection({
    record,
    location,
    connectedWires,
  })
  const fontSize = getInlineNetLabelFontSize({
    record,
    document,
    altiumUnitsToMillimetersScale: options.scale,
  })
  const isVertical = direction === "up" || direction === "down"

  return {
    type: "schematic_text",
    anchor:
      direction === "left" || direction === "down"
        ? "bottom_right"
        : "bottom_left",
    color: INLINE_NET_LABEL_COLOR,
    font_size: fontSize,
    position: scalePoint(location, options.scale),
    rotation: isVertical ? -90 : 0,
    schematic_sheet_id: options.schematicSheetId,
    schematic_text_id: `schematic_inline_net_label_altium_${recordIndex}`,
    source_trace_id: sourceTraceId,
    text: name,
  }
}
