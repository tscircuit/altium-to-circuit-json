import { expect, test } from "bun:test"
import { AltiumSchComponentRecord, parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import {
  TI_TMDS62LEVM_FIXTURE_NAME,
  TI_TMDS62LEVM_SCHEMATIC_SHEET_NUMBERS,
} from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test(
  "preserves all 504 visible TI component rating labels",
  async () => {
    const counts = { voltage: 0, wattage: 0, tolerance: 0 }
    const voltageSheets = new Set<string>()
    const missing: string[] = []
    for (const sheet of TI_TMDS62LEVM_SCHEMATIC_SHEET_NUMBERS) {
      const document = parseAltiumSchDoc(
        await readReferenceBytes(
          `${TI_TMDS62LEVM_FIXTURE_NAME}/${sheet}.SchDoc`,
        ),
      )
      const circuitJson = convertAltiumSchDocToCircuitJson(document)
      const texts = circuitJson.filter(
        (element) => element.type === "schematic_text",
      )
      for (const component of document.records) {
        if (!(component instanceof AltiumSchComponentRecord)) continue
        const owned = document.index.getOwnedRecords(component)
        for (const record of owned) {
          if (
            record.recordKind !== "41" ||
            record.getBoolean("ISHIDDEN") === true
          )
            continue
          const part = record.getNumber("OWNERPARTID") ?? -1
          const mode = record.getNumber("OWNERPARTDISPLAYMODE") ?? 0
          if (
            (part > 0 && part !== (component.currentPartId ?? 1)) ||
            mode !== 0
          )
            continue
          const field = record.getDecoded("NAME")?.trim().toLowerCase()
          if (
            field !== "voltage" &&
            field !== "wattage" &&
            field !== "tolerance"
          )
            continue
          counts[field]++
          if (field === "voltage") voltageSheets.add(sheet)
          const index = document.records.indexOf(record)
          const labels = texts.filter(
            (text) =>
              text.schematic_text_id === `schematic_text_altium_${index}`,
          )
          if (
            labels.length !== 1 ||
            labels[0]?.text !== record.getDecoded("TEXT")
          ) {
            missing.push(
              `sheet ${sheet}: ${field} ${record.getDecoded("TEXT")} (record ${index})`,
            )
          }
        }
      }
    }
    expect(counts).toEqual({ voltage: 502, wattage: 1, tolerance: 1 })
    expect(voltageSheets.size).toBe(40)
    expect(missing).toEqual([])
  },
  { timeout: 60_000 },
)
