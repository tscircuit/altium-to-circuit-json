import { expect, test } from "bun:test"
import type {
  SchematicCircle,
  SchematicPath,
  SchematicRect,
} from "circuit-json"
import { normalizeSchematicComponentElement } from "../../lib/schematic/components/normalizeSchematicComponentElement"

test("component fills follow explicit roles regardless of source RGB colors", () => {
  const primitives: (SchematicCircle | SchematicPath | SchematicRect)[] = [
    {
      type: "schematic_circle",
      schematic_circle_id: "circle",
      color: "#000000",
      center: { x: 0, y: 0 },
      radius: 1,
      is_filled: true,
      is_dashed: false,
    },
    {
      type: "schematic_rect",
      schematic_rect_id: "rect",
      color: "#000000",
      center: { x: 0, y: 0 },
      width: 2,
      height: 1,
      rotation: 0,
      is_filled: true,
      is_dashed: false,
    },
    {
      type: "schematic_path",
      schematic_path_id: "path",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
      ],
      stroke_width: 0.01,
      is_filled: true,
      is_dashed: false,
    },
  ]
  for (const primitive of primitives) {
    for (const fill of ["#ffffff", "#ffffb0", "#000000", "#0000ff"]) {
      for (const stroke of [fill, "#123456"]) {
        const filled = {
          ...primitive,
          fill_color: fill,
          ...(primitive.type === "schematic_path"
            ? { stroke_color: stroke }
            : { color: stroke }),
        }
        expect(normalizeSchematicComponentElement(filled).fill_color).toBe(
          "#840000",
        )
        expect(
          normalizeSchematicComponentElement(filled, { fillRole: "body" })
            .fill_color,
        ).toBe("#ffffc2")
        expect(
          normalizeSchematicComponentElement(filled, { fillRole: "solid" })
            .fill_color,
        ).toBe("#840000")
        expect(
          normalizeSchematicComponentElement({ ...filled, is_filled: false })
            .is_filled,
        ).toBe(false)
      }
    }
  }
})
