import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { getPcbBoardViewport } from "../helpers/filter-pcb-layer"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Arc|LAYER=TOP|KEEPOUT=TRUE|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=80mil|STARTANGLE=0|ENDANGLE=360|WIDTH=30mil",
  ].join("\n"),
)

test("snapshot: top-layer keepout arc is not rendered as copper", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document, {
      width: 500,
      height: 500,
      layers: ["TOP"],
      viewBox: { x: 0, y: 0, width: 500, height: 500 },
    }),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson, {
      width: 500,
      height: 500,
      layer: "top",
      viewport: getPcbBoardViewport(circuitJson),
      matchBoardAspectRatio: true,
    }),
    label: "Top-layer circular keepout preserved as BREP",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("converts the full-circle arc to a layer-specific BREP keepout", () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  )

  expect(
    circuitJson.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(0)
  expect(keepouts).toHaveLength(1)
  expect(keepouts[0]).toMatchObject({
    shape: "brep",
    layers: ["top"],
  })
  const keepout = keepouts[0]
  if (keepout?.shape !== "brep") {
    throw new Error("Expected a BREP keepout")
  }
  expect(keepout.brep_shape.inner_rings).toHaveLength(1)
  for (const [index, ring] of [
    keepout.brep_shape.outer_ring,
    ...keepout.brep_shape.inner_rings,
  ].entries()) {
    expect(ring.vertices).toHaveLength(2)
    for (const point of ring.vertices) {
      expect(point.bulge).toBe(index === 0 ? -1 : 1)
      expect(Math.hypot(point.x - 6.35, point.y - 6.35)).toBeCloseTo(
        index === 0 ? 2.413 : 1.651,
        8,
      )
    }
  }

  const withoutKeepouts = convertAltiumPcbDocToCircuitJson(document, {
    includeKeepouts: false,
  })
  expect(
    withoutKeepouts.some(
      (element) =>
        element.type === "pcb_keepout" || element.type === "pcb_trace",
    ),
  ).toBe(false)
})
