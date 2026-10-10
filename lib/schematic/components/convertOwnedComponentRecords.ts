import {
  type AltiumRecord,
  AltiumSchEllipseRecord,
  AltiumSchImageRecord,
  AltiumSchPinRecord,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { SchematicContext } from "../document"
import { getLocation, pointsEqual, scaleLength } from "../geometry"
import { convertSchematicRecord } from "../rendering/convertSchematicRecord"
import { getComponentBodyBounds } from "./getComponentBodyBounds"
import { normalizeLogicGatePinName } from "./normalizeLogicGatePinName"
import { normalizeSchematicComponentElement } from "./normalizeSchematicComponentElement"
import type { ComponentConversionContext } from "./types"

export function convertOwnedComponentRecords(
  {
    ownedRecords,
    schematicComponentId,
    fillRole,
  }: {
    ownedRecords: AltiumRecord[]
    schematicComponentId: string
    fillRole?: "body" | "solid"
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] {
  const records = context.document.records
  const renderingContext: SchematicContext = {
    document: context.document,
    records,
    scale: context.options.scale,
    sheetRecord: records.find((record) => record.recordKind === "31"),
  }
  const bodyBounds = getComponentBodyBounds(ownedRecords, [])
  const pins = ownedRecords.filter(
    (record) => record instanceof AltiumSchPinRecord,
  )
  const pinNames = pins.map((pin) =>
    normalizeLogicGatePinName(pin.getDecoded("NAME")),
  )
  const hasLogicGatePins = pinNames.includes("A") && pinNames.includes("Y")

  return ownedRecords.flatMap((record) => {
    if (record instanceof AltiumSchImageRecord) return []
    const index = records.indexOf(record)
    if (index < 0) return []
    const primitiveBounds = getComponentBodyBounds([record], [])
    const isInversionBubble =
      hasLogicGatePins &&
      record instanceof AltiumSchEllipseRecord &&
      pins.some((pin) => {
        const center = getLocation(record)
        const pinLocation = getLocation(pin)
        return center && pinLocation && pointsEqual(center, pinLocation)
      })
    // The enclosing body uses background paint. Interior graphics are ink,
    // including rectangular contacts and circles nested inside fiducials.
    const primitiveFillRole =
      fillRole ??
      (isInversionBubble ||
      (primitiveBounds.minX === bodyBounds.minX &&
        primitiveBounds.minY === bodyBounds.minY &&
        primitiveBounds.maxX === bodyBounds.maxX &&
        primitiveBounds.maxY === bodyBounds.maxY)
        ? "body"
        : "solid")
    const elements = convertSchematicRecord(
      {
        index,
        options: {
          ...context.options,
          includeText:
            record instanceof AltiumSchPinRecord
              ? false
              : context.options.includeText,
        },
        record,
      },
      renderingContext,
    )
    return elements.map((element) => {
      const preparedElement =
        record instanceof AltiumSchPinRecord &&
        element.type === "schematic_line"
          ? {
              ...element,
              stroke_width: scaleLength(1, renderingContext.scale),
            }
          : element
      return {
        ...normalizeSchematicComponentElement(preparedElement, {
          fillRole: primitiveFillRole,
        }),
        schematic_component_id: schematicComponentId,
      }
    })
  })
}
