import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbBoard, PcbCopperPour } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("BeagleBone Black legacy copper layers survive modern mechanical-only stack records", async () => {
  // Board stack fields from BeagleBone_Black_RevB4.PcbDoc; simple polygons
  // exercise every copper layer without the rest of the evaluation board.
  const source = await Bun.file(
    new URL(
      "../fixtures/beaglebone-black-legacy-copper-stack.PcbDoc",
      import.meta.url,
    ),
  ).text()
  const document = parseAltiumPcbDoc(source)
  const originalSource = document.getString()
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  expect(
    circuitJson.find(
      (element): element is PcbBoard => element.type === "pcb_board",
    )?.num_layers,
  ).toBe(6)
  expect(
    circuitJson
      .filter(
        (element): element is PcbCopperPour =>
          element.type === "pcb_copper_pour",
      )
      .map((pour) => pour.layer),
  ).toEqual(["top", "inner1", "inner2", "inner3", "inner4", "bottom"])
  expect(document.getString()).toBe(originalSource)
})
