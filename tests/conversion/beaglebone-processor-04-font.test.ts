import { expect, test } from "bun:test"
import { createBeagleboneProcessorFontComparison } from "../helpers/create-beaglebone-processor-font-comparison"
import { getSvgPinLabelBounds } from "../helpers/get-svg-pin-label-bounds"

test("separates the opposing labels on BeagleBone's second processor unit", async () => {
  const { ports, comparisonSvg, circuitJsonSvg } =
    await createBeagleboneProcessorFontComparison({
      sheet: "04",
      sourceViewBox: { x: 510, y: 750, width: 1190, height: 640 },
    })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  expect(ports).toHaveLength(86)
  expect(
    ports.find((port) => port.display_pin_label?.startsWith("LCD_DATA2/")),
  ).toMatchObject({
    center: { x: 16.8, y: 11.1 },
    source_port_id: "source_port_altium_920",
    is_connected: true,
  })
  const leftLabel = getSvgPinLabelBounds({
    svg: circuitJsonSvg,
    labelPrefix: "UART0_RXD/",
  })
  const rightLabel = getSvgPinLabelBounds({
    svg: circuitJsonSvg,
    labelPrefix: "LCD_DATA2/",
  })
  expect(leftLabel.maxX).toBeLessThan(rightLabel.minX)
  expect(
    ports.some((port) => Object.hasOwn(port, "display_pin_label_font_family")),
  ).toBe(false)
})
