import { type AltiumSchDoc, getSchematicConnectionSegments } from "altiumts"
import type { ConvertAltiumSchDocOptions } from "../../api"
import { getAltiumSheetDimensions } from "./getAltiumSheetDimensions"
import { getPageFitScale } from "./getPageFitScale"
import { shouldRenderSchematicRecord } from "./shouldRenderSchematicRecord"
import type { SchematicConversionContext } from "./types"

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
  const renderingContext = { document, records, scale, sheetRecord }
  const schematicConnectionSegments = getSchematicConnectionSegments(
    records.filter((record) =>
      shouldRenderSchematicRecord(record, renderingContext),
    ),
  )
  return {
    ...renderingContext,
    elements: [],
    handledRecords: new Set(),
    options,
    schematicConnectionSegments,
    sheetDimensions,
  }
}
