import type { AltiumRecord, AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement, SchematicGroup } from "circuit-json"

import type { ConvertAltiumSchDocOptions } from "../convert-altium-sch-doc-to-circuit-json"
import { convertSemanticSchematic } from "./convert-semantic-schematic"
import { convertSchematicRecord } from "./render-record"
import {
  createSheetBorder,
  getAltiumSheetDimensions,
  getPageFitScale,
  SCHEMATIC_SHEET_ID,
  type SchematicContext,
  type SheetDimensions,
  shouldRenderSchematicRecord,
  translateSchematicElement,
} from "./sheet-layout"

export interface SchematicConversionContext extends SchematicContext {
  elements: AnyCircuitElement[]
  handledRecords: Set<AltiumRecord>
  options: ConvertAltiumSchDocOptions
  sheetDimensions: SheetDimensions
}

export function createSchematicConversionContext({
  document,
  options,
}: {
  document: AltiumSchDoc
  options: ConvertAltiumSchDocOptions
}): SchematicConversionContext {
  const records = document.records
  const sheetRecord = records.find((record) => record.recordKind === "31")
  const sheetDimensions = getAltiumSheetDimensions(sheetRecord)
  const scale = options.schematicUnitScale ?? getPageFitScale(sheetDimensions)
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError("schematicUnitScale must be a positive finite number")
  }
  return {
    document,
    elements: [],
    handledRecords: new Set(),
    options,
    records,
    scale,
    sheetDimensions,
    sheetRecord,
  }
}

export function addSchematicSheet(context: SchematicConversionContext): void {
  context.elements.push({
    type: "schematic_sheet",
    schematic_sheet_id: SCHEMATIC_SHEET_ID,
    name: context.options.sheetName ?? "Altium schematic",
    outline_color: "#334155",
    sheet_index: 0,
  })
  if (context.options.includeSheetBorder === true) {
    context.elements.push(createSheetBorder(context.sheetRecord, context.scale))
  }
}

export function convertSchematicSemantics(
  context: SchematicConversionContext,
): void {
  const conversion = convertSemanticSchematic(context.document, {
    includeHidden: context.options.includeHidden,
    includeText: context.options.includeText,
    scale: context.scale,
    schematicSheetId: SCHEMATIC_SHEET_ID,
  })
  context.elements.push(...conversion.elements)
  for (const record of conversion.handledRecords) {
    context.handledRecords.add(record)
  }
}

export function convertRemainingSchematicRecords(
  context: SchematicConversionContext,
): void {
  for (const [recordIndex, record] of context.records.entries()) {
    if (context.handledRecords.has(record)) continue
    if (!shouldRenderSchematicRecord(record, context)) continue
    context.elements.push(
      ...convertSchematicRecord(record, recordIndex, context, context.options),
    )
  }
}

export function finalizeSchematicConversion(
  context: SchematicConversionContext,
): void {
  const schematicComponentIds = context.elements
    .filter(
      (
        element,
      ): element is Extract<
        AnyCircuitElement,
        { type: "schematic_component" }
      > => element.type === "schematic_component",
    )
    .map((element) => element.schematic_component_id)

  if (schematicComponentIds.length > 0) {
    context.elements.push({
      type: "schematic_group",
      schematic_group_id: "schematic_group_altium",
      source_group_id: "source_group_altium",
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      center: {
        x: (context.sheetDimensions.width * context.scale) / 2,
        y: (context.sheetDimensions.height * context.scale) / 2,
      },
      width: context.sheetDimensions.width * context.scale,
      height: context.sheetDimensions.height * context.scale,
      schematic_component_ids: schematicComponentIds,
      name: context.options.sheetName ?? "Altium schematic",
    } satisfies SchematicGroup)
  }

  if (context.options.centerOnSchematicSheet === false) return
  const offset = {
    x: (-context.sheetDimensions.width * context.scale) / 2,
    y: (-context.sheetDimensions.height * context.scale) / 2,
  }
  context.elements = context.elements.map((element) =>
    translateSchematicElement(element, offset),
  )
}
