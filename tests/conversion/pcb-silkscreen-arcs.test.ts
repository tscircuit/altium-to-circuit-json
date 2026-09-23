import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("converts a wrapped silkscreen arc to the intended quarter circle", () => {
  const center = { x: 2.54, y: 5.08 }
  const coordinateToleranceMm = 1e-10
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VERSION=5.0",
      "|RECORD=Arc|LAYER=TOPOVERLAY|LOCATION.X=100mil|LOCATION.Y=200mil|RADIUS=50mil|STARTANGLE=270|ENDANGLE=0|WIDTH=8mil",
    ].join("\n"),
  )
  const silkscreenPath = convertAltiumPcbDocToCircuitJson(document).find(
    (element) => element.type === "pcb_silkscreen_path",
  )

  expect(silkscreenPath?.route).toHaveLength(13)
  for (const point of silkscreenPath?.route ?? []) {
    expect(point.x).toBeGreaterThanOrEqual(center.x - coordinateToleranceMm)
    expect(point.y).toBeLessThanOrEqual(center.y + coordinateToleranceMm)
  }
})
