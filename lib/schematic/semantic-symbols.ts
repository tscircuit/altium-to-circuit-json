import type { AltiumPoint } from "altiumts"
import type { SchSymbol } from "schematic-symbols"
import { symbols } from "schematic-symbols"

import {
  type CardinalDirection,
  getAveragePoint,
  getDirectionForVector,
  getPointDistance,
  getVectorDifference,
  subtractPoints,
} from "./geometry"
import { directionToSide, VECTOR_BY_DIRECTION } from "./semantic-geometry"
import type {
  ConvertedPort,
  SymbolPortAssignment,
  SymbolSelection,
} from "./semantic-types"
import {
  classifyComponent,
  getMosfetVariant,
  isPolarizedCapacitor,
} from "./symbols"

const CARDINAL_DIRECTIONS: readonly CardinalDirection[] = [
  "right",
  "up",
  "left",
  "down",
]
const SYMBOL_CATALOG = symbols as Record<string, SchSymbol | undefined>
const SYMBOL_NAMES = Object.keys(SYMBOL_CATALOG)

export function selectCircuitJsonSymbol({
  designator,
  libraryReference,
  ports,
}: {
  designator: string
  libraryReference: string
  ports: ConvertedPort[]
}): SymbolSelection | undefined {
  const classification = classifyComponent({ designator, libraryReference })
  let baseName: string | undefined
  let candidateNames: string[] = []
  if (classification === "testpoint" && ports.length === 1) {
    baseName = "testpoint"
  } else if (classification === "crystal" && ports.length === 2) {
    baseName = "crystal"
  } else if (classification === "crystal" && ports.length === 4) {
    baseName = "crystal_4pin"
  } else if (
    classification === "mosfet" &&
    ports.length >= 3 &&
    hasCompleteMosfetFunctionalGroups(ports)
  ) {
    const { channel_type, mosfet_mode } = getMosfetVariant(libraryReference)
    const channel = channel_type === "p" ? "p" : "n"
    const mode = mosfet_mode === "depletion" ? "d" : "e"
    const prefix = `${channel}_channel_${mode}_mosfet_transistor_gate_`
    candidateNames = SYMBOL_NAMES.filter((name) => name.startsWith(prefix))
  } else if (ports.length !== 2) {
    return undefined
  } else if (classification === "resistor") {
    baseName = "boxresistor"
  } else if (classification === "capacitor") {
    baseName = isPolarizedCapacitor(libraryReference)
      ? "capacitor_polarized"
      : "capacitor"
  } else if (classification === "ferrite_bead") {
    baseName = "ferrite_bead"
  } else if (classification === "inductor") {
    baseName = "inductor"
  } else if (classification === "led") {
    baseName = "led"
  }
  if (classification === "diode") {
    const lower = libraryReference.toLowerCase()
    baseName = lower.includes("schottky") ? "schottky_diode" : "diode"
  }
  if (baseName) {
    candidateNames = CARDINAL_DIRECTIONS.map(
      (direction) => `${baseName}_${direction}`,
    )
  }
  if (candidateNames.length === 0) return undefined

  const selections = candidateNames.flatMap((name) => {
    const symbol = SYMBOL_CATALOG[name]
    const supportsEquivalentMosfetPads =
      classification === "mosfet" && symbol?.ports.length === 3
    if (
      !symbol ||
      (!supportsEquivalentMosfetPads && symbol.ports.length !== ports.length)
    ) {
      return []
    }
    const assignments = assignConvertedPortsToSymbolPorts(ports, symbol, {
      allowFunctionalPortReuse: classification === "mosfet",
      geometryInterchangeableLabels:
        classification === "crystal" && ports.length === 4
          ? new Set(["2", "4"])
          : undefined,
    })
    return assignments.length === ports.length
      ? [{ assignments, name, symbol } satisfies SymbolSelection]
      : []
  })
  return selections.sort(
    (left, right) =>
      getSymbolDirectionScore(left) - getSymbolDirectionScore(right),
  )[0]
}

function hasCompleteMosfetFunctionalGroups(ports: ConvertedPort[]): boolean {
  const groups = ports.map((port) =>
    normalizeFunctionalPortLabel(port.sourcePort.name),
  )
  return (
    groups.every((group) => group !== undefined) && new Set(groups).size === 3
  )
}

function assignConvertedPortsToSymbolPorts(
  ports: ConvertedPort[],
  symbol: SchSymbol,
  options: {
    allowFunctionalPortReuse?: boolean
    geometryInterchangeableLabels?: Set<string>
  } = {},
): SymbolPortAssignment[] {
  const unusedSymbolPorts = new Set(symbol.ports)
  const orderedPorts = [...ports].sort(compareConvertedPorts)
  const assignments: SymbolPortAssignment[] = []
  const convertedCenter = getAveragePoint(ports.map(({ point }) => point))

  for (const [portIndex, convertedPort] of orderedPorts.entries()) {
    const rawHints = [
      convertedPort.schematicPort.pin_number?.toString(),
      convertedPort.sourcePort.name,
      ...(convertedPort.sourcePort.port_hints ?? []),
    ].filter((hint): hint is string => Boolean(hint))
    const functionalHints = new Set(
      rawHints.flatMap((hint) => {
        const normalized = normalizeFunctionalPortLabel(hint)
        return normalized ? [normalized] : []
      }),
    )
    const functionalPortCandidates = options.allowFunctionalPortReuse
      ? symbol.ports
      : [...unusedSymbolPorts]
    const functionalSymbolPort = functionalPortCandidates.find((symbolPort) =>
      symbolPort.labels.some((label) => {
        const normalized = normalizeFunctionalPortLabel(label)
        return normalized ? functionalHints.has(normalized) : false
      }),
    )
    const exactHints = new Set(rawHints.map((hint) => hint.toLowerCase()))
    const exactSymbolPort = [...unusedSymbolPorts].find((symbolPort) =>
      symbolPort.labels.some((label) => exactHints.has(label.toLowerCase())),
    )
    const interchangeableLabels = options.geometryInterchangeableLabels
    const isGeometryInterchangeable = rawHints.some((hint) =>
      interchangeableLabels?.has(hint.toLowerCase()),
    )
    const geometrySymbolPort = isGeometryInterchangeable
      ? [...unusedSymbolPorts]
          .filter((symbolPort) =>
            symbolPort.labels.some((label) =>
              interchangeableLabels?.has(label.toLowerCase()),
            ),
          )
          .sort(
            (left, right) =>
              getVectorDifference(
                subtractPoints(convertedPort.point, convertedCenter),
                subtractPoints(left, symbol.center),
              ) -
              getVectorDifference(
                subtractPoints(convertedPort.point, convertedCenter),
                subtractPoints(right, symbol.center),
              ),
          )[0]
      : undefined
    const symbolPort =
      functionalSymbolPort ??
      geometrySymbolPort ??
      exactSymbolPort ??
      symbol.ports[portIndex] ??
      [...unusedSymbolPorts][0]
    if (!symbolPort) continue
    if (!functionalSymbolPort || !options.allowFunctionalPortReuse) {
      unusedSymbolPorts.delete(symbolPort)
    }
    assignments.push({ convertedPort, symbolPort })
  }
  return assignments
}

function compareConvertedPorts(
  left: ConvertedPort,
  right: ConvertedPort,
): number {
  const leftPinNumber = left.schematicPort.pin_number
  const rightPinNumber = right.schematicPort.pin_number
  if (leftPinNumber !== undefined && rightPinNumber !== undefined) {
    return leftPinNumber - rightPinNumber
  }
  return (
    (left.schematicPort.true_ccw_index ?? 0) -
    (right.schematicPort.true_ccw_index ?? 0)
  )
}

function getSymbolDirectionScore(selection: SymbolSelection): number {
  const [first, second] = selection.assignments
  if (!first) return Number.POSITIVE_INFINITY
  if (!second) {
    const expectedDirection =
      VECTOR_BY_DIRECTION[
        first.convertedPort.schematicPort.facing_direction ?? "right"
      ]
    return getVectorDifference(
      expectedDirection,
      subtractPoints(first.symbolPort, selection.symbol.center),
    )
  }
  let difference = 0
  let comparisonCount = 0
  for (
    let firstIndex = 0;
    firstIndex < selection.assignments.length;
    firstIndex++
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < selection.assignments.length;
      secondIndex++
    ) {
      const firstAssignment = selection.assignments[firstIndex]
      const secondAssignment = selection.assignments[secondIndex]
      if (!firstAssignment || !secondAssignment) continue
      const pairDifference = getVectorDifference(
        subtractPoints(
          secondAssignment.convertedPort.point,
          firstAssignment.convertedPort.point,
        ),
        subtractPoints(secondAssignment.symbolPort, firstAssignment.symbolPort),
      )
      if (!Number.isFinite(pairDifference)) continue
      difference += pairDifference
      comparisonCount++
    }
  }
  return comparisonCount > 0
    ? difference / comparisonCount
    : Number.POSITIVE_INFINITY
}

function normalizeFunctionalPortLabel(portLabel: string): string | undefined {
  const normalized = portLabel.toLowerCase().replace(/[^a-z]/gu, "")
  if (normalized === "g" || normalized === "gate") return "gate"
  if (normalized === "d" || normalized === "drain") return "drain"
  if (normalized === "s" || normalized === "source") return "source"
  return undefined
}

export function applyNativeSymbolPortGeometry({
  center,
  selection,
}: {
  center: AltiumPoint
  selection: SymbolSelection
}): void {
  const assignmentsBySymbolPort = new Map<
    SchSymbol["ports"][number],
    SymbolPortAssignment[]
  >()
  for (const assignment of selection.assignments) {
    const assignments = assignmentsBySymbolPort.get(assignment.symbolPort)
    if (assignments) assignments.push(assignment)
    else assignmentsBySymbolPort.set(assignment.symbolPort, [assignment])
  }

  for (const [symbolPort, assignments] of assignmentsBySymbolPort) {
    const offset = subtractPoints(symbolPort, selection.symbol.center)
    const direction = getDirectionForVector(offset)
    const symbolPortCenter = {
      x: center.x + offset.x,
      y: center.y + offset.y,
    }
    const representative = assignments.sort(
      (left, right) =>
        getPointDistance(
          left.convertedPort.schematicPort.center,
          symbolPortCenter,
        ) -
        getPointDistance(
          right.convertedPort.schematicPort.center,
          symbolPortCenter,
        ),
    )[0]
    for (const { convertedPort } of assignments) {
      convertedPort.isSchematicVisible =
        convertedPort === representative?.convertedPort
      convertedPort.schematicPort.center = symbolPortCenter
      convertedPort.schematicPort.distance_from_component_edge = Math.hypot(
        offset.x,
        offset.y,
      )
      convertedPort.schematicPort.facing_direction = direction
      convertedPort.schematicPort.side_of_component = directionToSide(direction)
    }
  }
}
