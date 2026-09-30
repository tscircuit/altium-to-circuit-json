import type { AltiumPcbDocument, AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { ConvertAltiumSchDocOptions } from "../api/types"
import type { ConvertAltiumPcbDocOptions } from "../pcb/model"

export interface AltiumProjectPcbDocument {
  document: AltiumPcbDocument
  options?: Omit<ConvertAltiumPcbDocOptions, "idPrefix">
}

export interface AltiumProjectSchematicDocument {
  document: AltiumSchDoc
  options?: Omit<ConvertAltiumSchDocOptions, "idPrefix">
}

export interface ConvertAltiumProjectInput {
  pcb?: AltiumProjectPcbDocument
  schematics: AltiumProjectSchematicDocument[]
}

export interface AltiumProjectConverterContext {
  elements: AnyCircuitElement[]
  pcbElements: AnyCircuitElement[]
  schematicElements: AnyCircuitElement[]
}
