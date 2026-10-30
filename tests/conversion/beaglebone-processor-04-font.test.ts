import { expect, test } from "bun:test"
import { createBeagleboneProcessorFontComparison } from "../helpers/create-beaglebone-processor-font-comparison"

test("preserves the font of BeagleBone's second processor unit", async () => {
  const { ports, comparisonSvg } =
    await createBeagleboneProcessorFontComparison({
      sheet: "04",
      sourceViewBox: { x: 510, y: 750, width: 1190, height: 640 },
    })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  expect(ports).toHaveLength(86)
  const expectedPorts = ports.map((port) => ({
    ...port,
    display_pin_label_font_family: "Times New Roman",
  }))
  expect(ports).toEqual(expectedPorts)
})
