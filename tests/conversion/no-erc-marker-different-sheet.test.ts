import { expect, test } from "bun:test"
import type { AnyCircuitElement, SchematicLine } from "circuit-json"
import { associateNoErcMarkerWithPortAtAnchor } from "../../lib/schematic/rendering/associateNoErcMarkerWithPortAtAnchor"

test("does not assign a no-ERC marker to a port on another sheet", () => {
  const markerElements = [
    {
      type: "schematic_line",
      schematic_line_id: "schematic_line_no_erc_a",
      schematic_sheet_id: "schematic_sheet_a",
      x1: -4,
      y1: -4,
      x2: 4,
      y2: 4,
      color: "#ff0000",
      is_dashed: false,
    } satisfies SchematicLine,
  ]
  const circuitJson = [
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_other_sheet",
      source_port_id: "source_port_other_sheet",
      schematic_component_id: "schematic_component_other_sheet",
      schematic_sheet_id: "schematic_sheet_b",
      center: { x: 0, y: 0 },
    },
  ] satisfies AnyCircuitElement[]

  expect(
    associateNoErcMarkerWithPortAtAnchor({
      circuitJson,
      markerAnchor: { x: 0, y: 0 },
      markerElements,
    }),
  ).toEqual(markerElements)
})
