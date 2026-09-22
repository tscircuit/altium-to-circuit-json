import {
  AltiumBinaryPcbDoc,
  AltiumPcbDoc,
  AltiumSchDoc,
  parseAltiumFile,
  parseAltiumPcbDoc,
  parseAltiumSchDoc,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import type { ConverterStage } from "./converter-stage"
import type {
  AltiumSource,
  AltiumToCircuitJsonConverterContext,
  ConvertAltiumToCircuitJsonOptions,
  SupportedAltiumDocument,
} from "./converter-types"
import { createPcbConversionContext } from "./pcb/create-pcb-conversion-context"
import { createSchematicConversionContext } from "./schematic/schematic-conversion-context"
import {
  AddPcbNetsStage,
  ConvertPcbBoardStage,
  ConvertPcbComponentsStage,
  ConvertPcbCopperAreasStage,
  ConvertPcbRecordsStage,
} from "./stages/pcb-converter-stages"
import {
  AddSchematicSheetStage,
  ConvertRemainingSchematicRecordsStage,
  ConvertSchematicSemanticsStage,
  FinalizeSchematicConversionStage,
} from "./stages/schematic-converter-stages"

export class AltiumToCircuitJsonConverter {
  readonly context: AltiumToCircuitJsonConverterContext
  readonly pipeline: ConverterStage<SupportedAltiumDocument, unknown>[]
  currentStageIndex = 0
  finished = false

  constructor(
    source: AltiumSource | SupportedAltiumDocument,
    options: ConvertAltiumToCircuitJsonOptions = {},
  ) {
    const document = isSupportedAltiumDocument(source)
      ? source
      : parseAltiumSource(source, options.sourceType ?? "auto")
    this.context = { document, elements: [], options }

    if (document instanceof AltiumSchDoc) {
      const schematicContext = createSchematicConversionContext({
        document,
        options: options.schematic ?? {},
      })
      this.context.schematic = schematicContext
      this.context.elements = schematicContext.elements
      this.pipeline = [
        new AddSchematicSheetStage(document, this.context),
        new ConvertSchematicSemanticsStage(document, this.context),
        new ConvertRemainingSchematicRecordsStage(document, this.context),
        new FinalizeSchematicConversionStage(document, this.context),
      ]
      return
    }

    const pcbContext = createPcbConversionContext({
      document,
      options: options.pcb ?? {},
    })
    this.context.pcb = pcbContext
    this.context.elements = pcbContext.elements
    this.pipeline = [
      new AddPcbNetsStage(document, this.context),
      new ConvertPcbBoardStage(document, this.context),
      new ConvertPcbComponentsStage(document, this.context),
      new ConvertPcbCopperAreasStage(document, this.context),
      new ConvertPcbRecordsStage(document, this.context),
    ]
  }

  get currentStage():
    | ConverterStage<SupportedAltiumDocument, unknown>
    | undefined {
    return this.pipeline[this.currentStageIndex]
  }

  step(): void {
    const stage = this.currentStage
    if (!stage) {
      this.finished = true
      return
    }
    stage.step()
    if (stage.finished) {
      this.currentStageIndex++
      this.finished = this.currentStageIndex >= this.pipeline.length
    }
  }

  runUntilFinished(): void {
    while (!this.finished) this.step()
  }

  getOutput(): AnyCircuitElement[] {
    if (!this.finished) {
      throw new Error("Converter must finish before its output is read")
    }
    return this.context.elements
  }
}

function isSupportedAltiumDocument(
  source: unknown,
): source is SupportedAltiumDocument {
  return (
    source instanceof AltiumSchDoc ||
    source instanceof AltiumPcbDoc ||
    source instanceof AltiumBinaryPcbDoc
  )
}

function parseAltiumSource(
  source: AltiumSource,
  sourceType: "auto" | "pcb" | "schematic",
): SupportedAltiumDocument {
  if (sourceType === "pcb") {
    if (typeof source === "string") return parseAltiumPcbDoc(source)
    const { document } = parseAltiumFile(toUint8Array(source))
    if (
      document instanceof AltiumPcbDoc ||
      document instanceof AltiumBinaryPcbDoc
    ) {
      return document
    }
    throw new TypeError(`Expected an Altium PCB document, got ${document.type}`)
  }
  if (sourceType === "schematic") {
    return parseAltiumSchDoc(
      source instanceof ArrayBuffer ? new Uint8Array(source) : source,
    )
  }
  const { document } = parseAltiumFile(toUint8Array(source))
  if (isSupportedAltiumDocument(document)) return document
  throw new TypeError(`Unsupported Altium document type: ${document.type}`)
}

function toUint8Array(source: AltiumSource): Uint8Array {
  if (typeof source === "string") return new TextEncoder().encode(source)
  if (source instanceof Uint8Array) return source
  return new Uint8Array(source)
}
