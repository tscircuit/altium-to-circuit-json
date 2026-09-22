import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|SHEETWIDTH=800mil|SHEETHEIGHT=400mil",
    "|RECORD=Pad|LAYER=MULTILAYER|X=100mil|Y=200mil|XSIZE=100mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=ROUND|ROTATION=90|LAYER0HOLEXOFFSET=30mil|LAYER0HOLEYOFFSET=10mil|PLATED=TRUE",
    "|RECORD=Pad|LAYER=MIDLAYER2|X=300mil|Y=200mil|PADMODE=2|XSIZE=200mil|YSIZE=200mil|SHAPE=ROUND|LAYER2XSIZE=140mil|LAYER2YSIZE=80mil|LAYER2SHAPE=RECTANGLE|HOLESIZE=40mil|LAYER2HOLEXOFFSET=20mil|LAYER2HOLEYOFFSET=-5mil|PLATED=TRUE",
    "|RECORD=Pad|LAYER=MULTILAYER|X=500mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|SHAPE=OVAL|HOLESIZE=40mil|HOLETYPE=2|SLOTLENGTH=100mil|PADXOFFSET0=-15mil|PADYOFFSET0=25mil|PLATED=TRUE",
  ].join("\n"),
)

test("preserves plated-hole offsets and full-stack layer geometry", () => {
  const platedHoles = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_plated_hole",
  )

  expect(platedHoles).toHaveLength(3)
  expect(platedHoles[0]).toEqual(
    expect.objectContaining({
      shape: "circular_hole_with_rect_pad",
      rect_pad_width: 2.54,
      rect_pad_height: 2.54,
      hole_offset_x: expect.closeTo(-0.254),
      hole_offset_y: expect.closeTo(0.762),
    }),
  )
  expect(platedHoles[1]).toEqual(
    expect.objectContaining({
      shape: "circular_hole_with_rect_pad",
      rect_pad_width: 3.556,
      rect_pad_height: 2.032,
      hole_offset_x: expect.closeTo(0.508),
      hole_offset_y: expect.closeTo(-0.127),
    }),
  )
  expect(platedHoles[2]).toEqual(
    expect.objectContaining({
      shape: "pill_hole_with_rect_pad",
      rect_pad_width: 4.572,
      rect_pad_height: 2.54,
      hole_offset_x: expect.closeTo(-0.381),
      hole_offset_y: expect.closeTo(0.635),
    }),
  )
})
