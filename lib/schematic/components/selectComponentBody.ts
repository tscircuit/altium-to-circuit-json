import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { Bounds } from "../geometry"
import type { ConvertedPort } from "../model"
import { selectCircuitJsonSymbol } from "../symbols"
import { convertMarkedCapacitorBody } from "./convertMarkedCapacitorBody"
import { convertOwnedComponentBody } from "./convertOwnedComponentBody"
import { convertOwnedSingleInputGateBody } from "./convertOwnedSingleInputGateBody"
import { getCapacitorPositivePort } from "./getCapacitorPositivePort"
import { getNativeResistorScale } from "./getNativeResistorScale"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function selectComponentBody(
  {
    identity,
    pins,
    records,
    componentPorts,
    visibleSymbolLabels,
    bodyBounds,
  }: {
    identity: ComponentIdentity
    pins: AltiumSchPinRecord[]
    records: AltiumRecord[]
    componentPorts: ConvertedPort[]
    visibleSymbolLabels: Set<string>
    bodyBounds: Bounds
  },
  context: ComponentConversionContext,
) {
  let symbolSelection = selectCircuitJsonSymbol({
    ...identity,
    ports: componentPorts,
    positiveCapacitorPort: getCapacitorPositivePort({
      ports: componentPorts,
      records,
      libraryReference: identity.libraryReference,
    }),
  })
  const polarizedCapacitorBody = convertMarkedCapacitorBody(
    { identity, records, symbolSelection },
    context,
  )
  if (polarizedCapacitorBody) symbolSelection = undefined
  const singleInputGateBody = symbolSelection
    ? undefined
    : convertOwnedSingleInputGateBody(
        { identity, records, componentPorts },
        context,
      )
  const ownedComponentBody =
    polarizedCapacitorBody ??
    singleInputGateBody ??
    (symbolSelection
      ? undefined
      : convertOwnedComponentBody(
          { identity, pins, records, visibleSymbolLabels },
          context,
        ))
  if (symbolSelection)
    symbolSelection.geometryScale = getNativeResistorScale({
      bodyBounds,
      scale: context.options.scale,
      selection: symbolSelection,
      records,
    })
  return { symbolSelection, ownedComponentBody, singleInputGateBody }
}
