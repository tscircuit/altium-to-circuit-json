import {
  type AltiumRecord,
  AltiumSchDesignatorRecord,
  AltiumSchParameterRecord,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { SymbolSelection } from "../model"
import { getCapacitorPolarityMarks } from "./getCapacitorPolarityMarks"
import { convertOwnedCustomComponentBody } from "./convertOwnedCustomComponentBody"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertMarkedCapacitorBody(
  {
    identity,
    records,
    symbolSelection,
  }: {
    identity: ComponentIdentity
    records: AltiumRecord[]
    symbolSelection: SymbolSelection | undefined
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  if (
    !symbolSelection?.name.startsWith("capacitor_") ||
    symbolSelection.name.startsWith("capacitor_polarized_") ||
    getCapacitorPolarityMarks(records).length === 0
  )
    return undefined

  // When polarity cannot be mapped confidently to a native terminal, keep
  // the complete source body and its original terminals instead of guessing.
  const body = convertOwnedCustomComponentBody({ identity, records }, context)
  if (!body) return undefined
  const componentLabelIds = new Set(
    records.flatMap((record) => {
      if (
        !(record instanceof AltiumSchDesignatorRecord) &&
        !(
          record instanceof AltiumSchParameterRecord &&
          ["comment", "value"].includes(record.name?.toLowerCase() ?? "")
        )
      ) {
        return []
      }
      const index = context.document.records.indexOf(record)
      return index >= 0 ? [`schematic_text_altium_${index}`] : []
    }),
  )
  return body.map((element) =>
    element.type === "schematic_text" &&
    componentLabelIds.has(element.schematic_text_id)
      ? { ...element, color: "#0f0f0f" }
      : element,
  )
}
