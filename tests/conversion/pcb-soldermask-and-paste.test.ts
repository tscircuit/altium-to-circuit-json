import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const pcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Pad|LAYER=TOP|X=175mil|Y=250mil|XSIZE=120mil|YSIZE=80mil|SHAPE=RECTANGLE|PASTEMASKEXPANSION_MANUAL=3mil|SOLDERMASKEXPANSION_MANUAL=5mil|TENTEDTOP=FALSE",
    "|RECORD=Fill|LAYER=TOPPASTE|X1=125mil|Y1=210mil|X2=225mil|Y2=290mil|ROTATION=20",
    "|RECORD=Region|LAYER=TOPPASTE|HOLECOUNT=0|KIND0=0|VX0=300mil|VY0=175mil|KIND1=0|VX1=450mil|VY1=175mil|KIND2=0|VX2=400mil|VY2=250mil|KIND3=0|VX3=450mil|VY3=325mil|KIND4=0|VX4=300mil|VY4=325mil|KIND5=0|VX5=300mil|VY5=175mil",
    "|RECORD=Fill|LAYER=TOPSOLDER|X1=500mil|Y1=175mil|X2=600mil|Y2=325mil|ROTATION=0",
  ].join("\n"),
)

test("imports explicit solder paste and soldermask geometry", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(pcbDoc)
  const solderPaste = circuitJson.filter(
    (element) => element.type === "pcb_solder_paste",
  )
  const soldermaskOpenings = circuitJson.filter(
    (element) => element.type === "pcb_soldermask_opening",
  )
  const smtPad = circuitJson.find((element) => element.type === "pcb_smtpad")

  expect(solderPaste.map((element) => element.shape)).toEqual([
    "rotated_rect",
    "polygon",
  ])
  expect(soldermaskOpenings.map((element) => element.shape)).toEqual(["rect"])
  expect(smtPad?.is_covered_with_solder_mask).toBe(false)
  expect(smtPad?.soldermask_margin).toBeCloseTo(0.127)
  expect(smtPad?.solderpaste_margin).toBeCloseTo(0.0762)

  const altiumSvg = serializeAltiumPcbToSvg(pcbDoc, {
    height: 600,
    title: "Altium mask and paste source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 600,
    matchBoardAspectRatio: true,
    showSolderMask: true,
    showSolderPaste: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB solder mask and paste",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
