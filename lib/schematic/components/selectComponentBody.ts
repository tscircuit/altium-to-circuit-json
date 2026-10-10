import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { ConvertedPort } from "../model"
import { selectCircuitJsonSymbol } from "../symbols"
import { convertMarkedCapacitorBody } from "./convertMarkedCapacitorBody"
import { convertOwnedComponentBody } from "./convertOwnedComponentBody"
import { convertOwnedSingleInputGateBody } from "./convertOwnedSingleInputGateBody"
import { convertRotatedResistorBody } from "./convertRotatedResistorBody"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function selectComponentBody(
  {
    identity,
    pins,
    records,
    componentPorts,
    visibleSymbolLabels,
  }: {
    identity: ComponentIdentity
    pins: AltiumSchPinRecord[]
    records: AltiumRecord[]
    componentPorts: ConvertedPort[]
    visibleSymbolLabels: Set<string>
  },
  context: ComponentConversionContext,
) {
  // Prefer catalog symbols to source artwork. The existing compatibility
  // exceptions below retain capacitor polarity and tightly spaced rotated
  // labels until those cases can be represented faithfully by native symbols.
  // All owned graphics pass through the component palette normalization.
  let symbolSelection = selectCircuitJsonSymbol({
    ...identity,
    ports: componentPorts,
  })
  const polarizedCapacitorBody = convertMarkedCapacitorBody(
    { identity, records, symbolSelection },
    context,
  )
  if (polarizedCapacitorBody) symbolSelection = undefined
  const rotatedResistorBody = convertRotatedResistorBody(
    { identity, pins, records, symbolSelection },
    context,
  )
  if (rotatedResistorBody) symbolSelection = undefined
  const singleInputGateBody = symbolSelection
    ? undefined
    : convertOwnedSingleInputGateBody(
        { identity, records, componentPorts },
        context,
      )
  const ownedComponentBody =
    polarizedCapacitorBody ??
    rotatedResistorBody ??
    singleInputGateBody ??
    (symbolSelection
      ? undefined
      : convertOwnedComponentBody(
          { identity, pins, records, visibleSymbolLabels },
          context,
        ))
  return { symbolSelection, ownedComponentBody, singleInputGateBody }
}
