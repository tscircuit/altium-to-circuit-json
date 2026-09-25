import { AltiumSchComponentRecord } from "altiumts"
import {
  attachSchematicComponentId,
  convertSchematicRecord,
} from "../rendering"
import { shouldRenderSchematicRecord } from "./shouldRenderSchematicRecord"
import type { SchematicConversionContext } from "./types"

export function convertRemainingSchematicRecords(
  context: SchematicConversionContext,
): void {
  const recordIndexByRecord = new Map(
    context.records.map((record, recordIndex) => [record, recordIndex]),
  )
  for (const [recordIndex, record] of context.records.entries()) {
    if (context.handledRecords.has(record)) continue
    if (!shouldRenderSchematicRecord(record, context)) continue
    const convertedElements = convertSchematicRecord(
      { record, index: recordIndex, options: context.options },
      context,
    )
    const parent = context.document.getParent(record)
    const componentIndex =
      parent instanceof AltiumSchComponentRecord
        ? recordIndexByRecord.get(parent)
        : undefined
    if (componentIndex !== undefined) {
      for (const element of convertedElements) {
        attachSchematicComponentId({
          element,
          schematicComponentId: `schematic_component_altium_${componentIndex}`,
        })
      }
    }
    context.elements.push(...convertedElements)
  }
}
