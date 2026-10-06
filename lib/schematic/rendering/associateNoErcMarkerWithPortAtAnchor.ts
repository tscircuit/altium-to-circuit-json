import type { AltiumPoint } from "altiumts"
import type {
  AnyCircuitElement,
  SchematicLine,
  SchematicPort,
} from "circuit-json"
import { pointsEqual } from "../geometry"

export function associateNoErcMarkerWithPortAtAnchor({
  circuitJson,
  markerAnchor,
  markerElements,
}: {
  circuitJson: AnyCircuitElement[]
  markerAnchor: AltiumPoint
  markerElements: AnyCircuitElement[]
}): AnyCircuitElement[] {
  const markerLine = markerElements.find(
    (element): element is SchematicLine => element.type === "schematic_line",
  )
  if (!markerLine) return markerElements

  const matchingPort = circuitJson.find(
    (element): element is SchematicPort =>
      element.type === "schematic_port" &&
      element.schematic_component_id !== undefined &&
      element.schematic_sheet_id === markerLine.schematic_sheet_id &&
      pointsEqual(element.center, markerAnchor),
  )
  if (!matchingPort) return markerElements

  const schematicComponentId = matchingPort.schematic_component_id
  return markerElements.map((element) =>
    element.type === "schematic_line"
      ? { ...element, schematic_component_id: schematicComponentId }
      : element,
  )
}
