import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import {
  getCoordinateOrFallback,
  getRectangle,
} from "../../lib/schematic/geometry"
import {
  estimateSchematicTextWidth,
  getFontFamily,
  getFontSize,
} from "../../lib/schematic/text"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("clips a TI FAQ URL to its sheet 04 text frame", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/04.SchDoc`,
  )
  const document = parseAltiumSchDoc(source)
  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  const faqLine = circuitJson.find(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_text_id === "schematic_text_frame_line_altium_79_0",
  )
  const frameRecord = document.records[79]
  if (!frameRecord) throw new Error("Missing TI sheet 04 FAQ text frame")
  const rectangle = getRectangle(frameRecord)
  if (!rectangle) throw new Error("Missing TI sheet 04 FAQ frame bounds")
  const context = {
    document,
    records: document.records,
    scale: 1,
    sheetRecord: document.records.find((record) => record.recordKind === "31"),
  }
  const margin = getCoordinateOrFallback({
    record: frameRecord,
    key: "TEXTMARGIN",
    fallback: 0,
  })
  const availableWidth = rectangle.maxX - rectangle.minX - margin * 2

  expect(faqLine).toBeDefined()
  expect(faqLine?.text).toStartWith("https://e2e.ti.com/")
  expect(faqLine?.text).not.toContain("custom-board-schematic-and-pcb-design")
  expect(
    estimateSchematicTextWidth({
      text: faqLine?.text ?? "",
      fontSize: getFontSize(frameRecord, context),
      fontFamily: getFontFamily(frameRecord, context),
    }),
  ).toBeLessThanOrEqual(availableWidth)
})
