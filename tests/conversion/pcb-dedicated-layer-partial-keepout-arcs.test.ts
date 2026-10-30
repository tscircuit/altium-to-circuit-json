import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const board =
  "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil|LAYER_V8_0NAME=Top Layer|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=MidLayer1|LAYER_V8_1LAYERID=16777218|LAYER_V8_2NAME=MidLayer2|LAYER_V8_2LAYERID=16777219|LAYER_V8_3NAME=Bottom Layer|LAYER_V8_3LAYERID=16842751"

test("preserves partial keepout sweeps, widths and physical layers", () => {
  for (const layer of ["KEEPOUT", "TOP", "BOTTOM"]) {
    for (const [start, end] of [
      [0, 90],
      [315, 45],
      [315, 405],
    ]) {
      const document = parseAltiumPcbDoc(
        `${board}\n|RECORD=Arc|LAYER=${layer}${layer === "KEEPOUT" ? "" : "|KEEPOUT=TRUE"}|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=100mil|STARTANGLE=${start}|ENDANGLE=${end}|WIDTH=12mil`,
      )
      const circuitJson = convertAltiumPcbDocToCircuitJson(document)
      const keepouts = circuitJson.filter((e) => e.type === "pcb_keepout")
      expect(keepouts).toHaveLength(1)
      const keepout = keepouts[0]
      expect(keepout?.shape).toBe("outline")
      if (keepout?.shape !== "outline") throw new Error("Expected arc outline")
      expect(keepout.layers).toEqual(
        layer === "KEEPOUT"
          ? ["top", "inner1", "inner2", "bottom"]
          : [layer.toLowerCase()],
      )
      expect(keepout.stroke_width).toBeCloseTo(0.3048, 8)

      const first = keepout.outline[0]
      const last = keepout.outline.at(-1)
      const diagonal = Math.SQRT1_2 * 2.54
      expect(first?.x).toBeCloseTo(start === 0 ? 8.89 : 6.35 + diagonal, 8)
      expect(first?.y).toBeCloseTo(start === 0 ? 6.35 : 6.35 - diagonal, 8)
      expect(last?.x).toBeCloseTo(start === 0 ? 6.35 : 6.35 + diagonal, 8)
      expect(last?.y).toBeCloseTo(start === 0 ? 8.89 : 6.35 + diagonal, 8)
      expect(keepout.outline.length).toBeGreaterThan(2)
      for (const point of keepout.outline) {
        expect(Math.hypot(point.x - 6.35, point.y - 6.35)).toBeCloseTo(2.54, 8)
        // Wrapped arcs take the short sweep through +X, not the opposite 270°.
        expect(point.x).toBeGreaterThanOrEqual(
          start === 0 ? 6.35 - 1e-8 : 6.35 + diagonal - 1e-8,
        )
      }
      expect(circuitJson.some((e) => e.type === "pcb_trace")).toBe(false)
      expect(
        circuitJson.every((e) => any_circuit_element.safeParse(e).success),
      ).toBe(true)
      expect(
        convertAltiumPcbDocToCircuitJson(document, {
          includeKeepouts: false,
        }).some((e) => e.type === "pcb_keepout" || e.type === "pcb_trace"),
      ).toBe(false)
    }
  }
})
