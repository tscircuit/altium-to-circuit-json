import { expect, test } from "bun:test"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { createComponentStyleDocument } from "../helpers/create-component-style-document"

test("dark body backgrounds and light interior marks keep their roles during conversion", () => {
  for (const color of [0, 16777215, 16711680]) {
    const document = createComponentStyleDocument()
    for (const record of document.records) {
      if (["14", "8", "7"].includes(record.recordKind ?? "")) {
        record.set("COLOR", String(color))
        record.set("AREACOLOR", String(color))
      }
    }
    const elements = convertAltiumSchDocToCircuitJson(document)
    expect(elements.find((e) => e.type === "schematic_rect")).toMatchObject({
      color: "#840000",
      fill_color: "#ffffc2",
      is_filled: true,
    })
    expect(elements.find((e) => e.type === "schematic_circle")).toMatchObject({
      color: "#840000",
      fill_color: "#840000",
      is_filled: true,
    })
    expect(elements.find((e) => e.type === "schematic_path")).toMatchObject({
      stroke_color: "#840000",
      fill_color: "#840000",
      is_filled: true,
    })
  }
})
