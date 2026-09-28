import type { AltiumRecord } from "altiumts"
import { AltiumSchEllipseRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { classifyComponent } from "../symbols"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedTestpointBody(
  {
    identity,
    ownedRecords,
  }: {
    identity: ComponentIdentity
    ownedRecords: AltiumRecord[]
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  const isTestpoint =
    classifyComponent({
      designator: identity.designator,
      libraryReference: identity.libraryReference,
    }) === "testpoint"
  const hasCircle = ownedRecords.some(
    (record) => record instanceof AltiumSchEllipseRecord,
  )
  if (!isTestpoint || !hasCircle) return undefined

  return convertOwnedComponentRecords(
    {
      ownedRecords,
      schematicComponentId: identity.schematicComponentId,
    },
    context,
  )
}
