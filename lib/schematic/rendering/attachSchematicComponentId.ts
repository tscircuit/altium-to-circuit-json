import type { AnyCircuitElement } from "circuit-json"

export function attachSchematicComponentId({
  element,
  schematicComponentId,
}: {
  element: AnyCircuitElement
  schematicComponentId: string
}): void {
  switch (element.type) {
    case "schematic_arc":
    case "schematic_circle":
    case "schematic_line":
    case "schematic_path":
    case "schematic_rect":
    case "schematic_text":
      element.schematic_component_id = schematicComponentId
  }
}
