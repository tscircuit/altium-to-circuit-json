import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { getPreferredPcbBoardOutline } from "../../lib/pcb/board/getPreferredPcbBoardOutline"

test("does not infer a board from open, mismatched or ambiguous mechanical paths", async () => {
  const source = await Bun.file(
    new URL("../fixtures/beagleplay-board-outline.PcbDoc", import.meta.url),
  ).text()
  const [board, ...mechanicalRecords] = source.trim().split("\n")
  const candidates = [
    // Removing a corner leaves an open path.
    [board, ...mechanicalRecords.slice(0, -1)].join("\n"),
    // An assembly envelope with different extents cannot replace the board.
    [
      board,
      "|RECORD=Track|LAYER=MECHANICAL1|X1=-13000mil|Y1=9200mil|X2=-9800mil|Y2=9200mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=-9800mil|Y1=9200mil|X2=-9800mil|Y2=12400mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=-9800mil|Y1=12400mil|X2=-13000mil|Y2=12400mil",
      "|RECORD=Track|LAYER=MECHANICAL1|X1=-13000mil|Y1=12400mil|X2=-13000mil|Y2=9200mil",
    ].join("\n"),
    // Two matching drawing layers are ambiguous, even at the same extents.
    [
      source,
      ...mechanicalRecords.map((record) =>
        record.replace("MECHANICAL1", "MECHANICAL2"),
      ),
    ].join("\n"),
  ]
  for (const candidate of candidates) {
    const document = parseAltiumPcbDoc(candidate)
    expect(getPreferredPcbBoardOutline(document)).toEqual(
      document.boardGeometry.outline.points,
    )
  }
})
