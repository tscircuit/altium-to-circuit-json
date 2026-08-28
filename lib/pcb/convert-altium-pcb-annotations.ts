import {
  AltiumArcRecord,
  AltiumDimensionRecord,
  AltiumFillRecord,
  type AltiumPcbDocument,
  type AltiumRecord,
  AltiumRegionRecord,
  AltiumTextRecord,
  AltiumTrackRecord,
} from "altiumts"
import type {
  PcbFabricationNoteDimension,
  PcbFabricationNotePath,
  PcbFabricationNoteRect,
  PcbFabricationNoteText,
} from "circuit-json"
import { convertAltiumPcbAnnotationGraphic } from "./convert-altium-pcb-annotation-graphic"
import { convertAltiumPcbAnnotationText } from "./convert-altium-pcb-annotation-text"
import { convertAltiumPcbDimension } from "./convert-altium-pcb-dimension"
import {
  getPcbComponentIndex,
  isMechanicalOrDrillLayer,
  normalizePcbLayer,
} from "./pcb-annotation-properties"

type PcbAnnotation =
  | PcbFabricationNoteDimension
  | PcbFabricationNotePath
  | PcbFabricationNoteRect
  | PcbFabricationNoteText

export function convertAltiumPcbAnnotations({
  document,
}: {
  document: AltiumPcbDocument
}): PcbAnnotation[] {
  return document.records.flatMap((record, recordIndex) => {
    if (!isAnnotationRecord(record)) return []
    if (isComponentCourtyardPrimitive(record)) return []

    const annotation = convertAnnotationRecord({
      document,
      record,
      recordIndex,
    })
    return annotation ? [annotation] : []
  })
}

function convertAnnotationRecord({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumRecord
  recordIndex: number
}): PcbAnnotation | undefined {
  if (record instanceof AltiumDimensionRecord) {
    return convertAltiumPcbDimension({ document, record, recordIndex })
  }
  if (record instanceof AltiumTextRecord) {
    return convertAltiumPcbAnnotationText({ document, record, recordIndex })
  }
  return convertAltiumPcbAnnotationGraphic({ document, record, recordIndex })
}

function isAnnotationRecord(record: AltiumRecord): boolean {
  if (record instanceof AltiumDimensionRecord) return true
  const layer = normalizePcbLayer(record.getDecoded("LAYER"))
  if (!isMechanicalOrDrillLayer(layer)) return false
  return (
    record instanceof AltiumArcRecord ||
    record instanceof AltiumFillRecord ||
    record instanceof AltiumRegionRecord ||
    record instanceof AltiumTextRecord ||
    record instanceof AltiumTrackRecord
  )
}

function isComponentCourtyardPrimitive(record: AltiumRecord): boolean {
  const layer = normalizePcbLayer(record.getDecoded("LAYER"))
  return (
    (layer === "MECHANICAL15" || layer === "MECHANICAL16") &&
    getPcbComponentIndex(record) !== undefined &&
    !(record instanceof AltiumTextRecord) &&
    !(record instanceof AltiumDimensionRecord)
  )
}
