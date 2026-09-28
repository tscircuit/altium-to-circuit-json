import type { AltiumPcbDocument, AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { ConvertAltiumSchDocOptions } from "../api"
import type {
  ConvertAltiumPcbDocOptions,
  PcbConversionContext,
} from "../pcb/model"
import type { SchematicConversionContext } from "../schematic/document"
import type { ConvertedPcbPlatedHole } from "../pcb/pads"

export type ConvertedCircuitElement =
  | Exclude<AnyCircuitElement, { type: "pcb_plated_hole" }>
  | ConvertedPcbPlatedHole

export type AltiumSource = ArrayBuffer | Uint8Array | string

export type AltiumSourceType = "auto" | "pcb" | "schematic"

export type SupportedAltiumDocument = AltiumPcbDocument | AltiumSchDoc

export interface ConvertAltiumToCircuitJsonOptions {
  pcb?: ConvertAltiumPcbDocOptions
  schematic?: ConvertAltiumSchDocOptions
  sourceType?: AltiumSourceType
}

export interface AltiumToCircuitJsonConverterContext {
  document: SupportedAltiumDocument
  elements: AnyCircuitElement[]
  options: ConvertAltiumToCircuitJsonOptions
  pcb?: PcbConversionContext
  schematic?: SchematicConversionContext
}
