import type { AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import { ConverterStage } from "../converter-stage"
import {
  addSchematicSheet,
  convertRemainingSchematicRecords,
  convertSchematicSemantics,
  finalizeSchematicConversion,
  type SchematicConversionContext,
} from "../schematic/schematic-conversion-context"

abstract class SchematicConverterStage extends ConverterStage<
  AltiumSchDoc,
  AnyCircuitElement[]
> {
  protected get schematicContext(): SchematicConversionContext {
    const context = this.context.schematic
    if (!context) {
      throw new Error("Schematic conversion context is not initialized")
    }
    return context
  }

  getOutput(): AnyCircuitElement[] {
    if (!this.finished)
      throw new Error(`${this.constructor.name} is unfinished`)
    return this.context.elements
  }
}

export class AddSchematicSheetStage extends SchematicConverterStage {
  _step(): void {
    addSchematicSheet(this.schematicContext)
    this.finished = true
  }
}

export class ConvertSchematicSemanticsStage extends SchematicConverterStage {
  _step(): void {
    convertSchematicSemantics(this.schematicContext)
    this.finished = true
  }
}

export class ConvertRemainingSchematicRecordsStage extends SchematicConverterStage {
  _step(): void {
    convertRemainingSchematicRecords(this.schematicContext)
    this.finished = true
  }
}

export class FinalizeSchematicConversionStage extends SchematicConverterStage {
  _step(): void {
    finalizeSchematicConversion(this.schematicContext)
    this.context.elements = this.schematicContext.elements
    this.finished = true
  }
}
