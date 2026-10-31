import { expect, test } from "bun:test"
import { brep_shape } from "circuit-json"
import { createCircularKeepoutBrep } from "../../lib/pcb/geometry/createCircularKeepoutBrep"

test("preserves circular BREP radii, opposite winding and narrow holes", () => {
  for (const example of [
    { center: { x: 10, y: -20 }, innerRadius: 1, outerRadius: 2 },
    { center: { x: 10, y: -20 }, innerRadius: 0, outerRadius: 2 },
    { center: { x: 10, y: -20 }, innerRadius: 0.0001, outerRadius: 2 },
    { center: { x: 0, y: 0 }, innerRadius: Number.EPSILON / 2, outerRadius: 2 },
    {
      center: { x: 10, y: -20 },
      innerRadius: 1.60049972,
      outerRadius: 2.23549972,
    },
  ] as const) {
    const geometry = createCircularKeepoutBrep(example)
    expect(brep_shape.safeParse(geometry).success).toBe(true)
    expect(geometry.inner_rings).toHaveLength(example.innerRadius > 0 ? 1 : 0)
    for (const [index, ring] of [
      geometry.outer_ring,
      ...geometry.inner_rings,
    ].entries()) {
      expect(ring.vertices).toHaveLength(2)
      const start = ring.vertices[0]
      const end = ring.vertices[1]
      if (!start || !end) throw new Error("Expected semicircle endpoints")
      expect(start.bulge).toBe(index === 0 ? -1 : 1)
      expect(end.bulge).toBe(start.bulge)
      const chord = Math.hypot(end.x - start.x, end.y - start.y)
      expect(chord).toBeGreaterThan(0)
      // For a unit bulge the arc is a semicircle, so its radius is half its chord.
      expect(chord / 2).toBeCloseTo(
        index === 0 ? example.outerRadius : example.innerRadius,
        12,
      )
      expect((start.x + end.x) / 2).toBeCloseTo(example.center.x, 12)
      expect((start.y + end.y) / 2).toBeCloseTo(example.center.y, 12)
    }
  }

  for (const [innerRadius, outerRadius] of [
    [-1, 2],
    [1, 1],
    [2, 1],
    [0, 0],
    [Number.NaN, 2],
    [0, Number.POSITIVE_INFINITY],
  ] as const) {
    expect(() =>
      createCircularKeepoutBrep({
        center: { x: 0, y: 0 },
        innerRadius,
        outerRadius,
      }),
    ).toThrow()
  }
})
