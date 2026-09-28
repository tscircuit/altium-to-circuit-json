import type {
  AltiumComponentRecord,
  AltiumPcbDocument,
  AltiumRecord,
} from "altiumts"
import type { AnyCircuitElement, SourceNet, SourceTrace } from "circuit-json"
import type { PcbCopperLayerMap } from "../layers"

export interface ConvertAltiumPcbDocOptions {
  includeBoardOutline?: boolean
  includeComponents?: boolean
  includeCopperAreas?: boolean
  includeCourtyards?: boolean
  includeDimensions?: boolean
  includeKeepouts?: boolean
  includePads?: boolean
  includeSilkscreen?: boolean
  includeTraces?: boolean
  includeVias?: boolean
}

export interface PcbNetContext {
  connectSourcePort: (record: AltiumRecord, sourcePortId: string) => void
  getElements: () => Array<SourceNet | SourceTrace>
  getSourceNetId: (record: AltiumRecord) => string | undefined
  getSourceTraceId: (record: AltiumRecord) => string | undefined
}

export interface PcbComponentContext {
  elements: Array<Extract<AnyCircuitElement, { type: "source_component" }>>
  getComponentIndex: (record: AltiumRecord) => number | undefined
  getPcbComponentId: (record: AltiumRecord) => string | undefined
  getSourceComponentId: (record: AltiumRecord) => string | undefined
  getSourceComponentIdForComponent: (component: AltiumComponentRecord) => string
}

export interface PcbConversionContext {
  componentContext: PcbComponentContext
  document: AltiumPcbDocument
  elements: AnyCircuitElement[]
  layerMap: PcbCopperLayerMap
  netContext: PcbNetContext
  options: ConvertAltiumPcbDocOptions
}
