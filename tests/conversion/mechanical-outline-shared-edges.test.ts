import { expect, test } from "bun:test"
import { type AltiumPoint, parseAltiumPcbDoc } from "altiumts"
import { getPreferredPcbBoardOutline } from "../../lib/pcb/board/getPreferredPcbBoardOutline"

function mechanicalTracks(points: AltiumPoint[]): string[] {
  return points.map((start, index) => {
    const end = points[(index + 1) % points.length]!
    return `|RECORD=Track|LAYER=MECHANICAL1|X1=${start.x}mil|Y1=${start.y}mil|X2=${end.x}mil|Y2=${end.y}mil`
  })
}

test("preserves the declared outline when competing mechanical contours share edges on one layer", () => {
  const declaredBoard =
    "|RECORD=Board|VX0=0mil|VY0=0mil|VX1=1000mil|VY1=1000mil|VX2=1000mil|VY2=0mil|VX3=0mil|VY3=1000mil|VX4=0mil|VY4=0mil"
  const rectangle = mechanicalTracks([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
    { x: 700, y: 1000 },
    { x: 300, y: 1000 },
    { x: 0, y: 1000 },
  ])
  const notched = mechanicalTracks([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
    { x: 700, y: 1000 },
    { x: 700, y: 700 },
    { x: 300, y: 700 },
    { x: 300, y: 1000 },
    { x: 0, y: 1000 },
  ])

  // Shared edges occur twice in the source and must be deduplicated without
  // hiding the two competing routes between the ends of the notch.
  const recordOrders = [
    [...rectangle, ...notched],
    [...notched, ...rectangle],
  ].flatMap((tracks) =>
    tracks.map((_, firstIndex) => [
      ...tracks.slice(firstIndex),
      ...tracks.slice(0, firstIndex),
    ]),
  )
  for (const tracks of recordOrders) {
    // A separate unambiguous layer must not hide this layer's ambiguity either.
    for (const additionalLayer of [
      [],
      rectangle.map((record) => record.replace("MECHANICAL1", "MECHANICAL2")),
    ]) {
      const document = parseAltiumPcbDoc(
        [declaredBoard, ...tracks, ...additionalLayer].join("\n"),
      )
      expect(getPreferredPcbBoardOutline(document)).toEqual(
        document.boardGeometry.outline.points,
      )
    }
  }
})
