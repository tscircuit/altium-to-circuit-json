import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToAssemblySvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("BeaglePlay U11 retains its owned-text designator in assembly output", async () => {
  const document = parseAltiumPcbDoc(
    await Bun.file(
      new URL(
        "../fixtures/beagleplay-u11-owned-designator.PcbDoc",
        import.meta.url,
      ),
    ).text(),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document, {
      layers: ["BOTTOM", "BOTTOMOVERLAY"],
      layerDrawingOrder: ["BOTTOMOVERLAY", "BOTTOM"],
      width: 600,
      height: 600,
    }),
    circuitJsonSvg: convertCircuitJsonToAssemblySvg([...circuitJson], {
      width: 600,
      height: 600,
      includeVersion: false,
    }),
    label: "BeaglePlay U11 native footprint and imported assembly designator",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)

  expect(
    circuitJson.filter((element) => element.type === "source_component"),
  ).toMatchObject([{ name: "U11", display_name: "U11" }])
  expect(
    circuitJson.filter((element) => element.type === "source_port"),
  ).toHaveLength(8)
  expect(
    circuitJson.filter((element) => element.type === "pcb_smtpad"),
  ).toHaveLength(8)
})
