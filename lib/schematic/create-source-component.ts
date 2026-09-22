import {
  type AnyCircuitElement,
  type SourceComponentBase,
  source_simple_capacitor,
  source_simple_crystal,
  source_simple_inductor,
  source_simple_mosfet,
  source_simple_resistor,
} from "circuit-json"
import { type BaseTscircuitUnit, parseAndConvertSiUnit } from "format-si-unit"

import {
  classifyComponent,
  getMosfetVariant,
  getPrimaryComponentValue,
} from "./symbols"

export function createSourceComponent({
  componentValue,
  designator,
  libraryReference,
  manufacturerPartNumber,
  pinCount,
  sourceComponentId,
}: {
  componentValue: string
  designator: string
  libraryReference: string
  manufacturerPartNumber?: string
  pinCount: number
  sourceComponentId: string
}): AnyCircuitElement {
  const classification = classifyComponent({ designator, libraryReference })
  const primaryValue = getPrimaryComponentValue(componentValue)
  const common = {
    type: "source_component" as const,
    display_name: designator,
    display_value: componentValue || undefined,
    manufacturer_part_number: manufacturerPartNumber,
    name: designator,
    source_component_id: sourceComponentId,
  }

  if (classification === "resistor") {
    const resistance = parseFiniteComponentValue({
      componentUnit: "Ω",
      componentValue: primaryValue,
    })
    if (resistance !== undefined) {
      const parsed = source_simple_resistor.safeParse({
        ...common,
        display_resistance: componentValue || undefined,
        ftype: "simple_resistor",
        resistance,
      })
      if (parsed.success) return parsed.data
    }
  }
  if (classification === "capacitor") {
    const capacitance = parseFiniteComponentValue({
      componentUnit: "F",
      componentValue: primaryValue,
    })
    if (capacitance !== undefined) {
      const parsed = source_simple_capacitor.safeParse({
        ...common,
        display_capacitance: componentValue || undefined,
        ftype: "simple_capacitor",
        capacitance,
      })
      if (parsed.success) return parsed.data
    }
  }
  if (classification === "inductor") {
    const inductance = parseFiniteComponentValue({
      componentUnit: "H",
      componentValue: primaryValue,
    })
    if (inductance !== undefined) {
      const parsed = source_simple_inductor.safeParse({
        ...common,
        display_inductance: componentValue || undefined,
        ftype: "simple_inductor",
        inductance,
      })
      if (parsed.success) return parsed.data
    }
  }
  if (classification === "crystal" && (pinCount === 2 || pinCount === 4)) {
    const frequency = parseFiniteComponentValue({
      componentUnit: "Hz",
      componentValue,
    })
    if (frequency !== undefined) {
      const parsed = source_simple_crystal.safeParse({
        ...common,
        frequency,
        ftype: "simple_crystal",
        pin_variant: pinCount === 4 ? "four_pin" : "two_pin",
      })
      if (parsed.success) return parsed.data
    }
  }
  if (classification === "mosfet" && pinCount >= 3) {
    const parsed = source_simple_mosfet.safeParse({
      ...common,
      ...getMosfetVariant(libraryReference),
      ftype: "simple_mosfet",
    })
    if (parsed.success) return parsed.data
  }

  const ftype:
    | "simple_chip"
    | "simple_diode"
    | "simple_led"
    | "simple_test_point" =
    classification === "diode"
      ? "simple_diode"
      : classification === "led"
        ? "simple_led"
        : classification === "testpoint"
          ? "simple_test_point"
          : "simple_chip"
  return {
    ...common,
    ftype,
  } satisfies SourceComponentBase
}

function parseFiniteComponentValue({
  componentUnit,
  componentValue,
}: {
  componentUnit: BaseTscircuitUnit
  componentValue: string
}): number | undefined {
  const parsedComponentValue = parseAndConvertSiUnit(
    componentValue,
    componentUnit,
  ).value
  if (
    typeof parsedComponentValue !== "number" ||
    !Number.isFinite(parsedComponentValue)
  ) {
    return undefined
  }
  return parsedComponentValue
}
