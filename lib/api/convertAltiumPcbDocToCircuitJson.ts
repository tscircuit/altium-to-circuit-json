import type { AltiumPcbDocument } from "altiumts"
import {
  AltiumToCircuitJsonConverter,
  type ConvertedCircuitElement,
} from "../converter"
import type { ConvertAltiumPcbDocOptions } from "../pcb/model"

export function convertAltiumPcbDocToCircuitJson(
  document: AltiumPcbDocument,
  options: ConvertAltiumPcbDocOptions = {},
): ConvertedCircuitElement[] {
  const converter = new AltiumToCircuitJsonConverter(document, { pcb: options })
  converter.runUntilFinished()
  return converter.getOutput()
}
