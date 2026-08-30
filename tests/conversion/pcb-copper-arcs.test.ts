import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbTrace } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgsVertically } from "../helpers/stack-svg-comparison"

const copperArcPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=-100mil|VY0=-100mil|KIND1=0|VX1=500mil|VY1=-100mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=-100mil|VY3=500mil|KIND4=0|VX4=-100mil|VY4=-100mil",
    "|RECORD=Arc|LAYER=TOP|LOCATION.X=200mil|LOCATION.Y=200mil|RADIUS=100mil|STARTANGLE=0|ENDANGLE=180|WIDTH=12mil",
  ].join("\n"),
)

test("imports copper arcs as PCB traces", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(copperArcPcbDoc)
  const copperArc = circuitJson.find(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )

  expect(copperArc).toBeDefined()
  expect(copperArc?.should_round_corners).toBe(false)
  expect(copperArc?.route).toHaveLength(25)
  const start = copperArc?.route[0]
  const end = copperArc?.route.at(-1)
  expect(start).toMatchObject({
    layer: "top",
    route_type: "wire",
    x: 7.62,
    y: 5.08,
  })
  expect(end).toMatchObject({
    layer: "top",
    route_type: "wire",
    x: 2.54,
    y: 5.08,
  })
  if (start?.route_type !== "wire" || end?.route_type !== "wire") {
    throw new Error("Expected copper arc endpoints to be wire route points")
  }
  expect(start.width).toBeCloseTo(0.3048, 6)
  expect(end.width).toBeCloseTo(0.3048, 6)

  const altiumSvg = serializeAltiumPcbToSvg(copperArcPcbDoc, {
    height: 800,
    title: "Altium copper arc source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 800,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgsVertically({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB copper arc",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
