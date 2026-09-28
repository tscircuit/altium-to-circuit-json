import type {
  AltiumSource,
  ConvertedCircuitElement,
  ConvertAltiumToCircuitJsonOptions,
} from "../converter"
import { AltiumToCircuitJsonConverter } from "../converter"

export function convertAltiumToCircuitJson(
  source: AltiumSource,
  options: ConvertAltiumToCircuitJsonOptions = {},
): ConvertedCircuitElement[] {
  const converter = new AltiumToCircuitJsonConverter(source, options)
  converter.runUntilFinished()
  return converter.getOutput()
}
