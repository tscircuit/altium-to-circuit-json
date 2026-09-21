import { expect, test } from "bun:test"
import {
  AltiumBinaryPcbDoc,
  parseAltiumBinaryPcbDoc,
  parseAltiumPcbDoc,
  serializeAltiumPcbDocToBinary,
  serializeAltiumPcbToSvg,
} from "altiumts"
import type { PcbSilkscreenGraphic } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const silkscreenRegionPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Region|LAYER=TOPOVERLAY|REGIONKIND=COPPER|HOLECOUNT=1|KIND0=0|VX0=75mil|VY0=75mil|KIND1=0|VX1=625mil|VY1=75mil|KIND2=0|VX2=625mil|VY2=425mil|KIND3=0|VX3=75mil|VY3=425mil|KIND4=0|VX4=75mil|VY4=75mil|HOLE0COUNT=4|HOLE0VX0=275mil|HOLE0VY0=175mil|HOLE0VX1=425mil|HOLE0VY1=175mil|HOLE0VX2=425mil|HOLE0VY2=325mil|HOLE0VX3=275mil|HOLE0VY3=325mil",
  ].join("\n"),
)

test("imports filled Altium silkscreen regions with holes", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(silkscreenRegionPcbDoc)
  const graphic = circuitJson.find(
    (element): element is PcbSilkscreenGraphic =>
      element.type === "pcb_silkscreen_graphic",
  )

  expect(graphic).toMatchObject({
    shape: "brep",
    layer: "top",
  })
  expect(graphic?.brep_shape.inner_rings).toHaveLength(1)
  expect(
    convertAltiumPcbDocToCircuitJson(silkscreenRegionPcbDoc, {
      includeSilkscreen: false,
    }).some((element) => element.type === "pcb_silkscreen_graphic"),
  ).toBe(false)

  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(silkscreenRegionPcbDoc),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson),
    label: "Filled PCB silkscreen region",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

function createBinarySilkscreenDocument({
  layer,
  includeShapeBasedRegions,
}: {
  layer: "TOPOVERLAY" | "BOTTOMOVERLAY"
  includeShapeBasedRegions: boolean
}): AltiumBinaryPcbDoc {
  const regionSource = silkscreenRegionPcbDoc
    .getRecordsByKind("Region")[0]!
    .getString()
    .replace("TOPOVERLAY", layer)
  const source = [
    silkscreenRegionPcbDoc.board!.getString(),
    `${regionSource}|COMPONENT=0`,
    `${regionSource}|COMPONENT=1`,
    `|RECORD=Fill|LAYER=${layer}|X1=10mil|Y1=10mil|X2=40mil|Y2=40mil`,
  ].join("\n")
  const document = parseAltiumBinaryPcbDoc(
    serializeAltiumPcbDocToBinary(source),
  )
  const primitiveRecords = new Map(document.primitiveRecords)
  const cachedRegions = parseAltiumPcbDoc(
    [
      silkscreenRegionPcbDoc.board!.getString(),
      ...[`${regionSource}|COMPONENT=0`, `${regionSource}|COMPONENT=1`].map(
        (record) => record.replace("RECORD=Region|", "RECORD=RegionFill|"),
      ),
    ].join("\n"),
  ).getRecordsByKind("RegionFill")
  primitiveRecords.set("Regions6", cachedRegions)
  if (!includeShapeBasedRegions) primitiveRecords.delete("ShapeBasedRegions6")

  return new AltiumBinaryPcbDoc({
    compoundFile: document.compoundFile,
    primitiveRecords,
    propertyRecords: new Map(document.propertyRecords),
    streamSummaries: document.streamSummaries,
  })
}

test.each(["TOPOVERLAY", "BOTTOMOVERLAY"] as const)(
  "imports %s regions once when cached fills also exist",
  (layer) => {
    const document = createBinarySilkscreenDocument({
      layer,
      includeShapeBasedRegions: true,
    })
    expect(document.getRecordsByKind("Region")).toHaveLength(2)
    expect(document.getRecordsByKind("RegionFill")).toHaveLength(2)

    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    const graphics = circuitJson.filter(
      (element) => element.type === "pcb_silkscreen_graphic",
    )
    expect(graphics).toHaveLength(2)
    expect(graphics.map((graphic) => graphic.pcb_component_id)).toEqual([
      "pcb_component_altium_0",
      "pcb_component_altium_1",
    ])
    for (const graphic of graphics) {
      expect(graphic.layer).toBe(layer === "TOPOVERLAY" ? "top" : "bottom")
      expect(graphic.brep_shape.inner_rings).toHaveLength(1)
    }
    expect(
      circuitJson.filter((element) => element.type === "pcb_silkscreen_rect"),
    ).toHaveLength(1)
    expect(
      convertAltiumPcbDocToCircuitJson(document, {
        includeSilkscreen: false,
      }).filter((element) => element.type.startsWith("pcb_silkscreen_")),
    ).toHaveLength(0)
  },
)

test("preserves cached silkscreen regions when no shape-based stream exists", () => {
  const document = createBinarySilkscreenDocument({
    layer: "TOPOVERLAY",
    includeShapeBasedRegions: false,
  })
  const graphics = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_silkscreen_graphic",
  )

  expect(graphics).toHaveLength(2)
  for (const graphic of graphics) {
    expect(graphic.brep_shape.inner_rings).toHaveLength(1)
  }
})
