import { expect, test } from "bun:test"
import {
  getPcbContour,
  parseAltiumPcbDoc,
  serializeAltiumPcbToSvg,
} from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("BeagleBone's named power polygons retain all six copper layers", async () => {
  const document = parseAltiumPcbDoc(
    await Bun.file(
      new URL(
        "../fixtures/beaglebone-black-named-copper-stack.PcbDoc",
        import.meta.url,
      ),
    ).text(),
  )
  const originalSource = document.getString()
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const layers = [
    { sourceLayer: "TOP", layer: "top" },
    { sourceLayer: "LYR2_GND", layer: "inner1" },
    { sourceLayer: "LYR3", layer: "inner2" },
    { sourceLayer: "LYR4", layer: "inner3" },
    { sourceLayer: "LYR5_PWR", layer: "inner4" },
    { sourceLayer: "BOTTOM", layer: "bottom" },
  ] as const

  for (const { sourceLayer, layer } of layers) {
    const polygon = document.polygons.find(
      (polygon) => polygon.layer === sourceLayer,
    )
    if (!polygon) throw new Error(`Missing source polygon on ${sourceLayer}`)
    const bounds = getPcbContour(polygon).bounds
    if (!bounds)
      throw new Error(`Missing source polygon bounds on ${sourceLayer}`)
    const minX = bounds.minX - 40
    const minY = bounds.minY - 40
    const maxX = bounds.maxX + 40
    const maxY = bounds.maxY + 40
    const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
      altiumSvg: serializeAltiumPcbToSvg(document, {
        layers: [sourceLayer],
        viewBox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        width: 600,
        height: 600,
      }),
      circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson, {
        layer,
        viewport: {
          minX: milsToMillimeters(minX),
          minY: milsToMillimeters(minY),
          maxX: milsToMillimeters(maxX),
          maxY: milsToMillimeters(maxY),
        },
        width: 600,
        height: 600,
        matchBoardAspectRatio: true,
      }),
      label: `BeagleBone Black ${sourceLayer} power polygon`,
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, layer)
  }

  expect(
    circuitJson.find((element) => element.type === "pcb_board")?.num_layers,
  ).toBe(6)
  expect(
    circuitJson
      .filter((element) => element.type === "pcb_copper_pour")
      .map((pour) => pour.layer),
  ).toEqual(layers.map(({ layer }) => layer))
  expect(
    circuitJson.filter((element) => element.type === "pcb_via"),
  ).toHaveLength(3)
  expect(document.getString()).toBe(originalSource)
})
