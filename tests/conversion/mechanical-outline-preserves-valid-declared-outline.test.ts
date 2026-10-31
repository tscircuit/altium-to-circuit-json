import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { getPreferredPcbBoardOutline } from "../../lib/pcb/board/getPreferredPcbBoardOutline"

test("preserves a valid concave board even when a mechanical rectangle matches its bounds", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VX0=0mil|VY0=0mil|VX1=1000mil|VY1=0mil|VX2=1000mil|VY2=800mil|VX3=500mil|VY3=400mil|VX4=0mil|VY4=800mil|VX5=0mil|VY5=0mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=0mil|Y1=0mil|X2=1000mil|Y2=0mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=1000mil|Y1=0mil|X2=1000mil|Y2=800mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=1000mil|Y1=800mil|X2=0mil|Y2=800mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=0mil|Y1=800mil|X2=0mil|Y2=0mil",
    ].join("\n"),
  )
  expect(getPreferredPcbBoardOutline(document)).toEqual(
    document.boardGeometry.outline.points,
  )
})
