import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { findDetachedSymbolPortIds } from "../helpers/find-detached-symbol-ports"
import { readReferenceBytes } from "../helpers/read-reference"

test(
  "TI connector bodies, contacts and diode marks retain their primitive fill roles",
  async () => {
    for (const filename of [
      "ti-lm251772evm-pd.SchDoc",
      "ti-tmds62levm-rev-b/15.SchDoc",
      "ti-tmds62levm-rev-b/35.SchDoc",
    ]) {
      const elements = convertAltiumSchDocToCircuitJson(
        parseAltiumSchDoc(await readReferenceBytes(filename)),
      )
      const shapes = elements.filter(
        (e) =>
          "schematic_component_id" in e &&
          e.schematic_component_id &&
          "is_filled" in e &&
          e.is_filled,
      )
      const bodies = shapes.filter((e) => e.type === "schematic_rect")
      expect(bodies.length).toBeGreaterThan(0)
      expect(bodies.some((e) => e.fill_color === "#ffffc2")).toBe(true)
      const contacts = shapes.filter((e) => e.type === "schematic_circle")
      expect(contacts.length).toBeGreaterThan(0)
      expect(contacts.every((e) => e.fill_color === "#840000")).toBe(true)
      if (filename.endsWith("35.SchDoc")) {
        const marks = shapes.filter((e) => e.type === "schematic_path")
        expect(marks.length).toBeGreaterThan(0)
        expect(marks.every((e) => e.fill_color === "#840000")).toBe(true)
      }
      expect(findDetachedSymbolPortIds(elements)).toEqual([])
    }
  },
  { timeout: 45_000 },
)
