import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbKeepoutBrep } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const circularKeepoutPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Arc|LAYER=KEEPOUT|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=75mil|STARTANGLE=0|ENDANGLE=0|WIDTH=20mil",
  ].join("\n"),
)

test("preserves the empty center of full-circle Altium keepout arcs", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(circularKeepoutPcbDoc)
  const keepout = circuitJson.find(
    (element): element is PcbKeepoutBrep =>
      element.type === "pcb_keepout" && element.shape === "brep",
  )

  expect(keepout).toMatchObject({
    shape: "brep",
    layers: ["top", "bottom"],
  })
  if (!keepout) throw new Error("Expected an annular keepout")
  expect(keepout.brep_shape.inner_rings).toHaveLength(1)
  expect(keepout.brep_shape.outer_ring.vertices).toEqual([
    { x: 8.509, y: 6.35, bulge: -1 },
    { x: 4.191, y: 6.35, bulge: -1 },
  ])
  expect(
    convertAltiumPcbDocToCircuitJson(circularKeepoutPcbDoc, {
      includeKeepouts: false,
    }).some((element) => element.type === "pcb_keepout"),
  ).toBe(false)

  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(circularKeepoutPcbDoc),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson),
    label: "Annular PCB keepout preserves its empty center",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
