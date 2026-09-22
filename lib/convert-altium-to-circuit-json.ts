import { AltiumBinaryPcbDoc, AltiumPcbDoc, AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { AltiumToCircuitJsonConverter } from "./altium-to-circuit-json-converter"
import type {
  AltiumSource,
  ConvertAltiumToCircuitJsonOptions,
} from "./converter-types"

export type {
  AltiumSource,
  AltiumSourceType,
  ConvertAltiumToCircuitJsonOptions,
  SupportedAltiumDocument,
} from "./converter-types"

export function convertAltiumToCircuitJson(
  source: AltiumSource,
  options: ConvertAltiumToCircuitJsonOptions = {},
): AnyCircuitElement[] {
  const converter = new AltiumToCircuitJsonConverter(source, options)
  converter.runUntilFinished()
  return converter.getOutput()
}

export function convertAltiumDocumentToCircuitJson(
  document: unknown,
  options: ConvertAltiumToCircuitJsonOptions = {},
): AnyCircuitElement[] {
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
