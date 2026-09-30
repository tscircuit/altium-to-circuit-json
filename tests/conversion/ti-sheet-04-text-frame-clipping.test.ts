import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import {
  getCoordinateOrFallback,
  getRectangle,
} from "../../lib/schematic/geometry"
import {
  clipSchematicTextLine,
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

test("center clipping preserves proportional glyph positions", () => {
  const clipped = clipSchematicTextLine({
    text: "WWWWiiii",
    maximumWidth: 25,
    fontSize: 10,
    fontFamily: "Arial",
    horizontalAnchor: "center",
  })

  expect(clipped.text).toBe("WW")
  expect(clipped.horizontalOffset).toBeCloseTo(3)
})

test("vertical clipping emits only complete text-frame lines", () => {
  const document = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      "|RECORD=28|LOCATION.X=0|LOCATION.Y=0|CORNER.X=100|CORNER.Y=12|FONTID=1|TEXT=first~1second|WORDWRAP=F|CLIPTORECT=T",
    ].join("\n"),
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    schematicUnitScale: 1,
  })
  const frameLines = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_text_id.startsWith("schematic_text_frame_line_"),
  )

  expect(frameLines.map((line) => line.text)).toEqual(["first"])
})
