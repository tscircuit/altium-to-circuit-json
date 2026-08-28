import type { AltiumPcbDocument, AltiumTextRecord } from "altiumts"
import type { PcbFabricationNoteText } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import {
  getPcbAnnotationColor,
  getPcbAnnotationComponentId,
  getPcbAnnotationLayer,
} from "./pcb-annotation-properties"

export function convertAltiumPcbAnnotationText({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumTextRecord
  recordIndex: number
}): PcbFabricationNoteText | undefined {
  const text = normalizeAnnotationText(
    decodeAltiumWideString(record.getDecoded("WIDESTRING")) ||
      record.getDecoded("TEXT") ||
      record.text ||
      "",
  )
  if (!record.position || !text) return undefined

  return {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: `pcb_fabrication_note_text_altium_${recordIndex}`,
    pcb_component_id: getPcbAnnotationComponentId(record),
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    text,
    ccw_rotation: record.rotation,
    layer: getPcbAnnotationLayer({ document, record }),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapTextAnchor(record.justification),
    color: getPcbAnnotationColor(record),
  }
}

function decodeAltiumWideString(raw: string | undefined): string {
  if (!raw) return ""
  if (!/^\d+(?:,\d+)*$/u.test(raw)) return raw
  try {
    return String.fromCodePoint(...raw.split(",").map(Number))
  } catch {
    return raw
  }
}

function normalizeAnnotationText(text: string): string {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .join("\n")
}

function mapTextAnchor(
  justification: string | undefined,
): "center" | "top_left" | "top_right" | "bottom_left" | "bottom_right" {
  const normalized = justification?.replace(/[\s_-]+/gu, "").toUpperCase()
  if (normalized === "1" || normalized === "BOTTOMLEFT") return "bottom_left"
  if (normalized === "3" || normalized === "TOPLEFT") return "top_left"
  if (normalized === "7" || normalized === "BOTTOMRIGHT") {
    return "bottom_right"
  }
  if (normalized === "9" || normalized === "TOPRIGHT") return "top_right"
  return "center"
}
