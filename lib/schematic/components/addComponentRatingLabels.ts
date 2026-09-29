import type { AltiumRecord } from "altiumts"
import type { SchematicComponent } from "circuit-json"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import type { ComponentConversionContext } from "./types"

export function addComponentRatingLabels(
  {
    records,
    schematicComponent,
  }: {
    records: AltiumRecord[]
    schematicComponent: SchematicComponent
  },
  context: ComponentConversionContext,
): void {
  const schematicComponentId = schematicComponent.schematic_component_id
  const ratingLabels = convertOwnedComponentRecords(
    {
      ownedRecords: records.filter(
        (record) =>
          record.recordKind === "41" &&
          ["voltage", "wattage", "tolerance"].includes(
            record.getDecoded("NAME")?.trim().toLowerCase() ?? "",
          ),
      ),
      schematicComponentId,
    },
    context,
  )
  if (ratingLabels.length === 0) return
  context.elements.push(...ratingLabels)

  // Automatic value labels can overlap the restored rating (e.g. C165's
  // 0.1uF and 16V). Use the original primary label's position when available.
  const primaryRecord = ["value", "comment"]
    .map((name) =>
      records.find(
        (record) =>
          record.recordKind === "41" &&
          record.getDecoded("NAME")?.toLowerCase() === name,
      ),
    )
    .find(
      (record) =>
        record?.getDecoded("TEXT")?.trim() ===
        schematicComponent.symbol_display_value,
    )
  if (!primaryRecord) return
  const primaryLabels = convertOwnedComponentRecords(
    { ownedRecords: [primaryRecord], schematicComponentId },
    context,
  )
  if (primaryLabels.length === 0) return
  context.elements.push(...primaryLabels)
  schematicComponent.symbol_display_value = ""
}
