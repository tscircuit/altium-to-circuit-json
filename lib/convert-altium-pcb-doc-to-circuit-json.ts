import type { AltiumPcbDocument } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import { AltiumToCircuitJsonConverter } from "./altium-to-circuit-json-converter"
import type { ConvertAltiumPcbDocOptions } from "./pcb/types"

export type { ConvertAltiumPcbDocOptions } from "./pcb/types"

export function convertAltiumPcbDocToCircuitJson(
  document: AltiumPcbDocument,
  options: ConvertAltiumPcbDocOptions = {},
): AnyCircuitElement[] {
  const converter = new AltiumToCircuitJsonConverter(document, { pcb: options })
  converter.runUntilFinished()
  return converter.getOutput()
}
