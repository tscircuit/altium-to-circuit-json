import { expect, test } from "bun:test"
import { padPcbViewport } from "./filter-pcb-layer"

test("pads a PCB viewport equally using its longest side", () => {
  expect(
    padPcbViewport({
      paddingFraction: 0.05,
      viewport: { maxX: 100, maxY: 40, minX: 0, minY: 0 },
    }),
  ).toEqual({ maxX: 105, maxY: 45, minX: -5, minY: -5 })
})
