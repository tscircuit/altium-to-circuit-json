import {
  type AltiumRecord,
  AltiumSchComponentRecord,
  type AltiumSchDoc,
  AltiumSchLabelRecord,
  AltiumSchPinRecord,
} from "altiumts"
import type { AnyCircuitElement, SchematicComponent } from "circuit-json"
import { getBoundsCenter, scalePoint } from "../geometry"
import type {
  ConvertedPort,
  SemanticSchematicOptions,
  SourceComponentDesignator,
} from "../model"
import {
  applyNativeSymbolPortGeometry,
  selectCircuitJsonSymbol,
} from "../symbols"
import { convertComponentPin } from "./convertComponentPin"
import { createComponentText } from "./createComponentText"
import { createSourceComponent } from "./createSourceComponent"
import { findOwnedDesignator } from "./findOwnedDesignator"
import { findOwnedParameterText } from "./findOwnedParameterText"
import { getComponentBodyBounds } from "./getComponentBodyBounds"
import { isOwnedRecordVisible } from "./isOwnedRecordVisible"
import { isPinHidden } from "./isPinHidden"

export function convertComponents({
  convertedPorts,
  document,
  elements,
  handledRecords,
  options,
}: {
  convertedPorts: ConvertedPort[]
  document: AltiumSchDoc
  elements: AnyCircuitElement[]
  handledRecords: Set<AltiumRecord>
  options: SemanticSchematicOptions
}): void {
  const documentIndex = document.index
  const sourceComponentIdByDesignator = new Map<
    SourceComponentDesignator,
    string
  >()

  for (const [componentIndex, componentRecord] of document.records.entries()) {
    if (!(componentRecord instanceof AltiumSchComponentRecord)) continue
    handledRecords.add(componentRecord)

    const ownedRecords = documentIndex.getOwnedRecords(componentRecord)
    for (const ownedRecord of ownedRecords) handledRecords.add(ownedRecord)

    const currentPartId = componentRecord.currentPartId ?? 1
    const visibleOwnedRecords = ownedRecords.filter((record) =>
      isOwnedRecordVisible(record, currentPartId),
    )
    const pins = visibleOwnedRecords.filter(
      (record): record is AltiumSchPinRecord =>
        record instanceof AltiumSchPinRecord &&
        (!isPinHidden(record) || options.includeHidden === true),
    )
    if (pins.length === 0) continue
    const visibleSymbolLabels = new Set(
      visibleOwnedRecords
        .filter(
          (record): record is AltiumSchLabelRecord =>
            record instanceof AltiumSchLabelRecord,
        )
        .flatMap((record) => {
          const text = record.text?.trim().toUpperCase()
          return text ? [text] : []
        }),
    )

    const designator =
      findOwnedDesignator(ownedRecords) ??
      componentRecord.designator ??
      `U${componentIndex}`
    // Altium libraries commonly store the human-readable component value in
    // the named `Value` parameter, while `Comment` may contain a manufacturer
    // part number (or another library-specific description). Prefer the
    // explicit value field and retain the older fallbacks for simpler files.
    const componentValue =
      findOwnedParameterText(ownedRecords, "Value")?.trim() ||
      findOwnedParameterText(ownedRecords, "Comment")?.trim() ||
      componentRecord.comment?.trim() ||
      componentRecord.designItemId?.trim() ||
      componentRecord.libraryReference?.trim() ||
      ""
    const libraryReference =
      componentRecord.libraryReference ??
      componentRecord.designItemId ??
      designator
    const manufacturerPartNumber = findOwnedParameterText(
      ownedRecords,
      "Mfr_part_number",
    )
    const normalizedDesignator = designator
      .trim()
      .toUpperCase() as SourceComponentDesignator
    const existingSourceComponentId =
      sourceComponentIdByDesignator.get(normalizedDesignator)
    const sourceComponentId =
      existingSourceComponentId ?? `source_component_altium_${componentIndex}`
    const schematicComponentId = `schematic_component_altium_${componentIndex}`
    if (!existingSourceComponentId) {
      sourceComponentIdByDesignator.set(normalizedDesignator, sourceComponentId)
      elements.push(
        createSourceComponent({
          componentValue,
          designator,
          libraryReference,
          manufacturerPartNumber,
          pinCount: pins.length,
          sourceComponentId,
        }),
      )
    }

    const componentPorts = pins.map((pin, pinIndex) =>
      convertComponentPin({
        document,
        options,
        pin,
        pinIndex,
        schematicComponentId,
        sourceComponentId,
        visibleSymbolLabels,
      }),
    )
    const bodyBounds = getComponentBodyBounds(
      visibleOwnedRecords,
      componentPorts.map(({ point }) => point),
    )
    const symbolSelection = selectCircuitJsonSymbol({
      designator,
      libraryReference,
      ports: componentPorts,
    })
    const center = scalePoint(getBoundsCenter(bodyBounds), options.scale)
    const size = symbolSelection
      ? { ...symbolSelection.symbol.size }
      : {
          height: Math.max(
            (bodyBounds.maxY - bodyBounds.minY) * options.scale,
            0.4,
          ),
          width: Math.max(
            (bodyBounds.maxX - bodyBounds.minX) * options.scale,
            0.4,
          ),
        }
    if (symbolSelection) {
      applyNativeSymbolPortGeometry({
        center,
        selection: symbolSelection,
      })
    }
    convertedPorts.push(...componentPorts)
    elements.push(
      ...componentPorts.flatMap(
        ({ isSchematicVisible, sourcePort, schematicPort }) => [
          sourcePort,
          ...(isSchematicVisible ? [schematicPort] : []),
        ],
      ),
    )
    const schematicComponent: SchematicComponent = {
      type: "schematic_component",
      center,
      // circuit-to-svg uses this flag as the renderable component gate for
      // both generated boxes and components selected by symbol_name.
      is_box_with_pins: true,
      schematic_component_id: schematicComponentId,
      schematic_sheet_id: options.schematicSheetId,
      size,
      source_component_id: sourceComponentId,
      symbol_display_value: componentValue,
      ...(symbolSelection ? { symbol_name: symbolSelection.name } : {}),
    }
    elements.push(schematicComponent)

    if (!symbolSelection && options.includeText !== false) {
      elements.push(
        createComponentText({
          anchor: "bottom_left",
          component: schematicComponent,
          id: `schematic_component_designator_altium_${componentIndex}`,
          position: {
            x: center.x - size.width / 2,
            y: center.y + size.height / 2 + 0.13,
          },
          text: designator,
        }),
      )
      if (componentValue) {
        elements.push(
          createComponentText({
            anchor: "top_left",
            component: schematicComponent,
            id: `schematic_component_value_altium_${componentIndex}`,
            position: {
              x: center.x - size.width / 2,
              y: center.y - size.height / 2 - 0.13,
            },
            text: componentValue,
          }),
        )
      }
    }
  }
}
