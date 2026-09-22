import type { AltiumPcbDocument } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import { ConverterStage } from "../converter-stage"
import { convertPcbBoard } from "../pcb/convert-pcb-board"
import { convertPcbComponents } from "../pcb/convert-pcb-components"
import { convertPcbCopperAreas } from "../pcb/convert-pcb-copper-areas-stage"
import { convertPcbRecords } from "../pcb/convert-pcb-records"
import { addPcbNets } from "../pcb/create-pcb-net-context"
import type { PcbConversionContext } from "../pcb/types"

abstract class PcbConverterStage extends ConverterStage<
  AltiumPcbDocument,
  AnyCircuitElement[]
> {
  protected get pcbContext(): PcbConversionContext {
    const context = this.context.pcb
    if (!context) throw new Error("PCB conversion context is not initialized")
    return context
  }

  getOutput(): AnyCircuitElement[] {
    if (!this.finished)
      throw new Error(`${this.constructor.name} is unfinished`)
    return this.context.elements
  }
}

export class AddPcbNetsStage extends PcbConverterStage {
  _step(): void {
    addPcbNets(this.pcbContext)
    this.finished = true
  }
}

export class ConvertPcbBoardStage extends PcbConverterStage {
  _step(): void {
    convertPcbBoard(this.pcbContext)
    this.finished = true
  }
}

export class ConvertPcbComponentsStage extends PcbConverterStage {
  _step(): void {
    convertPcbComponents(this.pcbContext)
    this.finished = true
  }
}

export class ConvertPcbCopperAreasStage extends PcbConverterStage {
  _step(): void {
    convertPcbCopperAreas(this.pcbContext)
    this.finished = true
  }
}

export class ConvertPcbRecordsStage extends PcbConverterStage {
  _step(): void {
    convertPcbRecords(this.pcbContext)
    this.finished = true
  }
}
