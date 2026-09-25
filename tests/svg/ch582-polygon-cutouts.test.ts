import { expect, test } from "bun:test"
import {
  AltiumRegionRecord,
  getPcbRecordPolygonIndex,
  getPcbRegionGeometry,
  parseAltiumPcbDoc,
  serializeAltiumPcbLayerToSvg,
} from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { readReferenceText } from "../helpers/read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("CH582 PCB polygon cutouts", async () => {
  const document = parseAltiumPcbDoc(await readReferenceText("ch582.PcbDoc"))
  const bottomCutouts = document.records.filter(
    (region) =>
      region instanceof AltiumRegionRecord &&
      region.regionKind === "POLYGON_CUTOUT" &&
      region.layer === "BOTTOM",
  )
  expect(bottomCutouts).toHaveLength(2)
  expect(
    bottomCutouts.every(
      (cutout) => getPcbRecordPolygonIndex(document, cutout) === undefined,
    ),
  ).toBe(true)

  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const bottomPolygon = circuitJson
    .filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
    )
    .find(
      (pour) => pour.pcb_copper_pour_id === "pcb_copper_pour_altium_polygon_0",
    )
  expect(bottomPolygon?.shape).toBe("polygon")

  const cutoutPoints = bottomCutouts.flatMap(
    (cutout) => getPcbRegionGeometry(cutout).outline.points,
  )
  const minX = Math.min(...cutoutPoints.map((point) => point.x))
  const maxX = Math.max(...cutoutPoints.map((point) => point.x))
  const minY = Math.min(...cutoutPoints.map((point) => point.y))
  const maxY = Math.max(...cutoutPoints.map((point) => point.y))
  const padding = Math.max(maxX - minX, maxY - minY) * 0.05
  const viewBox = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  }
  const altiumSvg = serializeAltiumPcbLayerToSvg(document, "BOTTOM", {
    height: 400,
    showText: false,
    viewBox,
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 400,
    layer: "bottom",
    viewport: {
      minX: milsToMillimeters(viewBox.x),
      minY: milsToMillimeters(viewBox.y),
      maxX: milsToMillimeters(viewBox.x + viewBox.width),
      maxY: milsToMillimeters(viewBox.y + viewBox.height),
    },
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "CH582 PCB bottom polygon cutouts",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
