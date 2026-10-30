import { expect, test } from "bun:test"
import { createBeagleboneProcessorFontComparison } from "../helpers/create-beaglebone-processor-font-comparison"

test("preserves the font of BeagleBone's first processor unit", async () => {
  const { ports, comparisonSvg } =
    await createBeagleboneProcessorFontComparison({
      sheet: "03",
      sourceViewBox: { x: 630, y: 480, width: 860, height: 780 },
    })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  expect(ports).toHaveLength(117)
  const expectedPorts = ports.map((port) => ({
    ...port,
    display_pin_label_font_family: "Times New Roman",
  }))
  expect(ports).toEqual(expectedPorts)
})
