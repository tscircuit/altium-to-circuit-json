import { expect, test } from "bun:test"
import {
  AltiumFillRecord,
  AltiumRegionRecord,
  parseAltiumPcbDoc,
  serializeAltiumPcbToSvg,
} from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { getPcbBoardViewport } from "../helpers/filter-pcb-layer"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("BeaglePlay LED1's pad keepout does not become conductive copper", async () => {
  const document = parseAltiumPcbDoc(
    await Bun.file(
      new URL(
        "../fixtures/beagleplay-led1-pad-keepout.PcbDoc",
        import.meta.url,
      ),
    ).text(),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document, {
      layers: ["TOP", "TOPOVERLAY", "MECHANICAL16"],
      width: 600,
      height: 600,
    }),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson, {
      layer: "top",
      width: 600,
      height: 600,
      viewport: getPcbBoardViewport(circuitJson),
      matchBoardAspectRatio: true,
    }),
    label: "BeaglePlay LED1 pad keepout and imported copper",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)

  const keepouts = document.records.filter(
    (record) =>
      (record instanceof AltiumRegionRecord ||
        record instanceof AltiumFillRecord) &&
      record.getBoolean("KEEPOUT"),
  )
  expect(keepouts).toHaveLength(2)
  expect(
    circuitJson.filter((element) => element.type === "pcb_smtpad"),
  ).toHaveLength(2)
  expect(
    circuitJson.filter((element) => element.type === "pcb_copper_pour"),
  ).toEqual([])
})
