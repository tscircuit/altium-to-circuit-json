import {
  type AltiumRecord,
  AltiumSchEllipseRecord,
  AltiumSchEllipticalArcRecord,
  AltiumSchPolygonRecord,
  AltiumSchPolylineRecord,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertSchematicArcToPath } from "../rendering/convertSchematicArcToPath"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedCustomComponentBody(
  {
    identity,
    records,
  }: {
    identity: ComponentIdentity
    records: AltiumRecord[]
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  const hasEllipse = records.some(
    (record) => record instanceof AltiumSchEllipseRecord,
  )
  const hasEllipticalArc = records.some(
    (record) => record instanceof AltiumSchEllipticalArcRecord,
  )
  const hasPolygon = records.some(
    (record) =>
      record instanceof AltiumSchPolygonRecord ||
      record instanceof AltiumSchPolylineRecord,
  )
  if (!hasEllipse || !hasEllipticalArc || !hasPolygon) return undefined

  const ownedElements = convertOwnedComponentRecords(
    {
      ownedRecords: records,
      schematicComponentId: identity.schematicComponentId,
    },
    context,
  )
  return ownedElements
    .map((element) =>
      element.type === "schematic_arc"
        ? convertSchematicArcToPath(element)
        : element,
    )
    .sort((left, right) => {
      const leftIsFilled =
        "is_filled" in left && left.is_filled === true ? 1 : 0
      const rightIsFilled =
        "is_filled" in right && right.is_filled === true ? 1 : 0
      return rightIsFilled - leftIsFilled
    })
}
