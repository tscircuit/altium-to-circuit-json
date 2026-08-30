import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbHole } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const nonPlatedSlotsPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=600mil|VY1=0mil|KIND2=0|VX2=600mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Pad|LAYER=MULTILAYER|ROTATION=0|NAME=NPTH1|HOLESIZE=40mil|PLATED=FALSE|HOLETYPE=2|HOLEWIDTH=100|HOLEROTATION=0|X=200mil|Y=200mil|SHAPE=ROUND|XSIZE=120mil|YSIZE=120mil",
    "|RECORD=Pad|LAYER=MULTILAYER|ROTATION=0|NAME=NPTH2|HOLESIZE=40mil|PLATED=FALSE|HOLETYPE=2|HOLEWIDTH=100|HOLEROTATION=45|X=400mil|Y=200mil|SHAPE=ROUND|XSIZE=120mil|YSIZE=120mil",
  ].join("\n"),
)

test("preserves non-plated slot hole geometry", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(nonPlatedSlotsPcbDoc)
  const holes = circuitJson.filter(
    (element): element is PcbHole => element.type === "pcb_hole",
  )

  expect(holes).toMatchObject([
    {
      hole_height: 1.016,
      hole_shape: "pill",
      hole_width: 2.54,
      x: 5.08,
      y: 5.08,
    },
    {
      ccw_rotation: 45,
      hole_height: 1.016,
      hole_shape: "rotated_pill",
      hole_width: 2.54,
      x: 10.16,
      y: 5.08,
    },
  ])

  const altiumSvg = serializeAltiumPcbToSvg(nonPlatedSlotsPcbDoc, {
    height: 800,
    title: "Altium non-plated slots source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 800,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "Non-plated PCB slots",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
