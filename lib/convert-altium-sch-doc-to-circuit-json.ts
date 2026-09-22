import type { AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import { AltiumToCircuitJsonConverter } from "./altium-to-circuit-json-converter"
export interface ConvertAltiumSchDocOptions {
  centerOnSchematicSheet?: boolean
  includeHidden?: boolean
  includeSheetBorder?: boolean
  includeText?: boolean
  schematicUnitScale?: number
  sheetName?: string
}

export function convertAltiumSchDocToCircuitJson(
  document: AltiumSchDoc,
  options: ConvertAltiumSchDocOptions = {},
): AnyCircuitElement[] {
  const converter = new AltiumToCircuitJsonConverter(document, {
    schematic: options,
  })
  converter.runUntilFinished()
  return converter.getOutput()
}
