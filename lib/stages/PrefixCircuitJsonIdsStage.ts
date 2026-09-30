import type { AnyCircuitElement } from "circuit-json"
import { ConverterStage } from "../converter/ConverterStage"
import type { SupportedAltiumDocument } from "../converter/types"

const prefixCircuitJsonNodeIds = (
  circuitJsonNode: unknown,
  idPrefix: string,
): void => {
  if (!circuitJsonNode || typeof circuitJsonNode !== "object") return

  for (const [fieldName, fieldEntry] of Object.entries(circuitJsonNode)) {
    if (fieldName.endsWith("_id") && typeof fieldEntry === "string") {
      Reflect.set(circuitJsonNode, fieldName, `${idPrefix}_${fieldEntry}`)
      continue
    }
    if (fieldName.endsWith("_ids") && Array.isArray(fieldEntry)) {
      Reflect.set(
        circuitJsonNode,
        fieldName,
        fieldEntry.map((id) =>
          typeof id === "string" ? `${idPrefix}_${id}` : id,
        ),
      )
      continue
    }
    prefixCircuitJsonNodeIds(fieldEntry, idPrefix)
  }
}

export class PrefixCircuitJsonIdsStage extends ConverterStage<
  SupportedAltiumDocument,
  AnyCircuitElement[]
> {
  _step(): void {
    const idPrefix = this.context.options.idPrefix
    if (!idPrefix) {
      this.finished = true
      return
    }
    for (const element of this.context.elements) {
      prefixCircuitJsonNodeIds(element, idPrefix)
    }
    this.finished = true
  }

  getOutput(): AnyCircuitElement[] {
    return this.context.elements
  }
}
