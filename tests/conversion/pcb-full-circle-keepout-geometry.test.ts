import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const board =
  "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil|LAYER_V8_0NAME=Top Layer|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=MidLayer1|LAYER_V8_1LAYERID=16777218|LAYER_V8_2NAME=MidLayer2|LAYER_V8_2LAYERID=16777219|LAYER_V8_3NAME=Bottom Layer|LAYER_V8_3LAYERID=16842751"

test("preserves full-circle holes, filled centers, layer scope and visibility", () => {
  for (const example of [
    {
      layer: "TOP",
      radius: 75,
      width: 0,
      start: 0,
      end: 360,
      shape: "outline",
    },
    {
      layer: "MID-LAYER1",
      radius: 10,
      width: 40,
      start: 0,
      end: 360,
      shape: "circle",
    },
    {
      layer: "KEEPOUT",
      radius: 75,
      width: 20,
      start: 0,
      end: 0,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 103,
      width: 1,
      start: 0,
      end: 360,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 75,
      width: undefined,
      start: 90,
      end: 450,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 75,
      width: 20,
      start: 350,
      end: -10,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 75,
      width: 20,
      start: 0,
      end: 450,
      shape: "brep",
    },
    {
      layer: "MID-LAYER1",
      radius: 75,
      width: 20,
      start: 0,
      end: 450,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 10,
      width: 19.99,
      start: 0,
      end: 360,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 75,
      width: 20,
      start: 73.82,
      end: 73.82,
      shape: "brep",
    },
    {
      layer: "KEEPOUT",
      radius: 10,
      width: 20,
      start: 0,
      end: 360,
      shape: "circle",
    },
    {
      layer: "KEEPOUT",
      radius: 10,
      width: 40,
      start: 90,
      end: 450,
      shape: "circle",
    },
  ]) {
    const width = (example.width ?? 4) * 0.0254
    const radius = example.radius * 0.0254
    const document = parseAltiumPcbDoc(
      `${board}\n|RECORD=Arc|LAYER=${example.layer}|KEEPOUT=TRUE|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=${example.radius}mil|STARTANGLE=${example.start}|ENDANGLE=${example.end}${example.width === undefined ? "" : `|WIDTH=${example.width}mil`}`,
    )
    const circuit = convertAltiumPcbDocToCircuitJson(document)
    const keepouts = circuit.filter((e) => e.type === "pcb_keepout")
    expect(keepouts).toHaveLength(1)
    const keepout = keepouts[0]
    expect(keepout).toMatchObject({
      shape: example.shape,
      layers:
        example.layer === "KEEPOUT"
          ? ["top", "inner1", "inner2", "bottom"]
          : [example.layer === "TOP" ? "top" : "inner1"],
    })
    if (!keepout) throw new Error("Expected a full-circle keepout")
    if (keepout.shape === "brep") {
      expect(keepout.brep_shape.inner_rings).toHaveLength(1)
      for (const [index, ring] of [
        keepout.brep_shape.outer_ring,
        ...keepout.brep_shape.inner_rings,
      ].entries()) {
        expect(ring.vertices).toHaveLength(2)
        for (const point of ring.vertices) {
          expect(point.bulge).toBe(index === 0 ? -1 : 1)
          expect(Math.hypot(point.x - 6.35, point.y - 6.35)).toBeCloseTo(
            radius + (index === 0 ? width / 2 : -width / 2),
            8,
          )
        }
      }
    } else if (keepout.shape === "outline") {
      expect(keepout.stroke_width).toBe(0)
      expect(keepout.outline.at(-1)).toEqual(keepout.outline[0])
    } else if (keepout.shape === "circle") {
      expect(keepout.center).toEqual({ x: 6.35, y: 6.35 })
      expect(keepout.radius).toBeCloseTo(radius + width / 2, 8)
    }
    expect(circuit.every((e) => any_circuit_element.safeParse(e).success)).toBe(
      true,
    )
    expect(circuit.some((e) => e.type === "pcb_trace")).toBe(false)
    expect(
      convertAltiumPcbDocToCircuitJson(document, {
        includeKeepouts: false,
      }).some((e) => e.type === "pcb_keepout" || e.type === "pcb_trace"),
    ).toBe(false)
    expect(
      convertAltiumPcbDocToCircuitJson(document, {
        includeTraces: false,
      }).filter((e) => e.type === "pcb_keepout"),
    ).toHaveLength(1)
  }
})
