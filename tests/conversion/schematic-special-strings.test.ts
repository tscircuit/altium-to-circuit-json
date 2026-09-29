import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("NodeMCU schematic resolves document special strings", async () => {
  const source = await readReferenceBytes("nodemcu-esp12.SchDoc")
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const textById = new Map(
    circuitJson
      .filter(
        (element): element is SchematicText =>
          element.type === "schematic_text",
      )
      .map((element) => [element.schematic_text_id, element.text]),
  )

  expect(textById.get("schematic_text_altium_27")).toBe("NODE MCU ESP12")
  expect(textById.get("schematic_text_altium_578")).toBe("WWW.NODEMCU.COM")
  expect(textById.get("schematic_text_altium_853")).toBe("20/11/2014")
})
