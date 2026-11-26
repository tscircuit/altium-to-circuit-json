import { expect, test } from "bun:test"
import {
  AltiumBinaryPcbDoc,
  AltiumPcbDoc,
  AltiumViaRecord,
  parseAltiumFile,
} from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test.failing("normalizes existing DRV8307EVM via tenting for the renderer schema", async () => {
  const source = await readReferenceBytes("ti-drv8307evm.PcbDoc")
  const document = parseAltiumFile(source).document
  if (
    !(document instanceof AltiumPcbDoc) &&
    !(document instanceof AltiumBinaryPcbDoc)
  ) {
    throw new Error("Expected the original DRV8307EVM PCB document")
  }
  const circuitJson = convertAltiumToCircuitJson(source, { sourceType: "pcb" })
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  expect(vias.length).toBeGreaterThan(0)
  for (const via of vias) {
    const index = Number(via.pcb_via_id.replace("pcb_via_altium_", ""))
    const original = document.records[index]
    expect(original).toBeInstanceOf(AltiumViaRecord)
    if (!(original instanceof AltiumViaRecord)) continue
    // Preserve the existing aggregate flag's meaning during schema migration.
    const isTented =
      original.tentedTop === true && original.tentedBottom === true
    expect(via).toMatchObject({
      tented_on_top: isTented,
      tented_on_bottom: isTented,
    })
    expect(via).not.toHaveProperty("is_tented")
  }
}, 120_000)
