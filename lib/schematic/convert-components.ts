import {
  type AltiumRecord,
  AltiumSchComponentRecord,
  type AltiumSchDoc,
  AltiumSchLabelRecord,
  AltiumSchPinRecord,
} from "altiumts"
import type {
  AnyCircuitElement,
  SchematicComponent,
  SchematicPort,
  SourcePort,
} from "circuit-json"

import {
  createComponentText,
  getComponentBodyBounds,
} from "./component-geometry"
import {
  findOwnedDesignator,
  findOwnedParameterText,
  isOwnedRecordVisible,
  isPinHidden,
  parsePinNumber,
} from "./component-records"
import { createSourceComponent } from "./create-source-component"
import { getBoundsCenter, getLocation, scalePoint } from "./geometry"
import { uniqueStrings } from "./ids"
import {
  DIRECTION_BY_ORIENTATION,
  directionToSide,
  VECTOR_BY_DIRECTION,
} from "./semantic-geometry"
import {
  applyNativeSymbolPortGeometry,
  selectCircuitJsonSymbol,
} from "./semantic-symbols"
import type {
  ConvertedPort,
  SemanticSchematicOptions,
  SourceComponentDesignator,
} from "./semantic-types"

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

function convertComponentPin({
  document,
  options,
  pin,
  pinIndex,
  schematicComponentId,
  sourceComponentId,
  visibleSymbolLabels,
}: {
  document: AltiumSchDoc
  options: SemanticSchematicOptions
  pin: AltiumSchPinRecord
  pinIndex: number
  schematicComponentId: string
  sourceComponentId: string
  visibleSymbolLabels: Set<string>
}): ConvertedPort {
  const recordIndex = document.records.indexOf(pin)
  const pinConglomerate = pin.pinConglomerate
  const orientation = (pinConglomerate ?? pin.orientationQuarterTurns ?? 0) & 3
  const direction = DIRECTION_BY_ORIENTATION[orientation] ?? "right"
  const directionVector = VECTOR_BY_DIRECTION[direction]
  const location = getLocation(pin) ?? { x: 0, y: 0 }
  const pinLength = Math.max(pin.pinLengthSchematicUnits ?? 10, 0)
  const terminalPoint = {
    x: location.x + directionVector.x * pinLength,
    y: location.y + directionVector.y * pinLength,
  }
  const designator = pin.designator ?? `${pinIndex + 1}`
  const pinNumber = parsePinNumber(designator)
  const name = pin.name ?? designator
  const sourcePortId = `source_port_altium_${recordIndex}`
  const schematicPortId = `schematic_port_altium_${recordIndex}`
  const sourcePort: SourcePort = {
    type: "source_port",
    name,
    port_hints: uniqueStrings([
      designator,
      name,
      pinNumber === undefined ? undefined : `pin${pinNumber}`,
    ]),
    source_component_id: sourceComponentId,
    source_port_id: sourcePortId,
    ...(pinNumber === undefined ? {} : { pin_number: pinNumber }),
  }
  const electricalType = pin.electricalType
  const normalizedName = name.trim().toUpperCase()
  const functionalName = normalizedName.replace(/\d+$/u, "")
  const showName =
    pinConglomerate === undefined ||
    (pinConglomerate & 0x08) !== 0 ||
    visibleSymbolLabels.has(normalizedName) ||
    visibleSymbolLabels.has(functionalName)
  const schematicPort: SchematicPort = {
    type: "schematic_port",
    center: scalePoint(terminalPoint, options.scale),
    ...(showName && name ? { display_pin_label: name } : {}),
    distance_from_component_edge: pinLength * options.scale,
    facing_direction: direction,
    is_connected: false,
    schematic_component_id: schematicComponentId,
    schematic_port_id: schematicPortId,
    schematic_sheet_id: options.schematicSheetId,
    side_of_component: directionToSide(direction),
    source_port_id: sourcePortId,
    true_ccw_index: pinIndex,
    ...(pinNumber === undefined ? {} : { pin_number: pinNumber }),
    ...(electricalType === 0 || electricalType === 1
      ? { has_input_arrow: true }
      : {}),
    ...(electricalType === 1 || electricalType === 2
      ? { has_output_arrow: true }
      : {}),
  }
  return {
    isSchematicVisible: true,
    point: terminalPoint,
    record: pin,
    schematicPort,
    sourcePort,
  }
}
