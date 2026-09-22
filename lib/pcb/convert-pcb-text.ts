import type { AltiumPcbDocument, AltiumTextRecord } from "altiumts"
import type { PcbCopperText, PcbFabricationNoteText } from "circuit-json"

import { FABRICATION_NOTE_COLOR } from "./constants"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import { getPcbComponentId, getPcbComponentIdForRecord } from "./ids"
import { mapAltiumCopperLayer } from "./map-altium-copper-layer"
import { mapFabricationTextAnchor, mapTextAnchor } from "./text"

export function convertPcbCopperText({
  record,
  recordIndex,
}: {
  record: AltiumTextRecord
  recordIndex: number
}): PcbCopperText | undefined {
  if (!record.position || !record.text) return undefined
  const layer = mapAltiumCopperLayer(record.layer)
  if (!layer) return undefined
  return {
    type: "pcb_copper_text",
    pcb_copper_text_id: `pcb_copper_text_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    text: record.text,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapTextAnchor(record.justification),
    ccw_rotation: record.rotation,
    layer,
    is_mirrored: record.mirrored,
  }
}

export function convertPcbMechanicalText({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumTextRecord
  recordIndex: number
}): PcbFabricationNoteText | undefined {
  const componentIndex = record.componentIndex
  const component = document.getComponentForRecord(record)
  if (
    !record.position ||
    componentIndex === undefined ||
    !component ||
    !record.text
  ) {
    return undefined
  }

  const normalizedText = record.text.trim().toUpperCase()
  const isDesignator = normalizedText === ".DESIGNATOR"
  const isComment = normalizedText === ".COMMENT"
  if (isDesignator && component.getBoolean("NAMEON") === false) return undefined
  if (isComment && component.getBoolean("COMMENTON") === false) return undefined

  const text = isDesignator
    ? component.designator
    : isComment
      ? component.comment
      : record.text
  if (!text) return undefined

  return {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: `pcb_fabrication_note_text_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentId(componentIndex),
    text,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapFabricationTextAnchor(record.justification),
    ccw_rotation: record.rotation,
    layer: component.side === "bottom" ? "bottom" : "top",
    color: FABRICATION_NOTE_COLOR,
  }
}
