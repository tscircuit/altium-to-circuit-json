import { AltiumBinaryPcbDoc, AltiumPcbDoc, AltiumSchDoc } from "altiumts"
import {
  AltiumToCircuitJsonConverter,
  type ConvertedCircuitElement,
  type ConvertAltiumToCircuitJsonOptions,
} from "../converter"

export function convertAltiumDocumentToCircuitJson(
  document: unknown,
  options: ConvertAltiumToCircuitJsonOptions = {},
): ConvertedCircuitElement[] {
  if (
    document instanceof AltiumSchDoc ||
    document instanceof AltiumPcbDoc ||
    document instanceof AltiumBinaryPcbDoc
  ) {
    const converter = new AltiumToCircuitJsonConverter(document, options)
    converter.runUntilFinished()
    return converter.getOutput()
  }
  const type =
    typeof document === "object" && document !== null && "type" in document
      ? String(document.type)
      : typeof document
  throw new TypeError(`Unsupported Altium document type: ${type}`)
}
