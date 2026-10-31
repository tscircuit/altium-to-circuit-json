import { expect, test } from "bun:test"
import { createBeagleboneProcessorFontComparison } from "../helpers/create-beaglebone-processor-font-comparison"
import { getSvgPinLabelBounds } from "../helpers/get-svg-pin-label-bounds"

test("separates the opposing labels on BeagleBone's first processor unit", async () => {
  const { ports, comparisonSvg, circuitJsonSvg } =
    await createBeagleboneProcessorFontComparison({
      sheet: "03",
      sourceViewBox: { x: 630, y: 480, width: 860, height: 780 },
    })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  expect(ports).toHaveLength(117)
  expect(
    ports.find((port) => port.display_pin_label === "DDR_A8"),
  ).toMatchObject({
    center: { x: 6.5, y: 10.1 },
    source_port_id: "source_port_altium_807",
    is_connected: true,
  })
  const leftLabel = getSvgPinLabelBounds({
    svg: circuitJsonSvg,
    labelPrefix: "DDR_A8",
  })
  const rightLabel = getSvgPinLabelBounds({
    svg: circuitJsonSvg,
    labelPrefix: "GPMC_CSN2/GPMC_BE1N/",
  })
  expect(leftLabel.maxX).toBeLessThan(rightLabel.minX)
  expect(
    ports.some((port) => Object.hasOwn(port, "display_pin_label_font_family")),
  ).toBe(false)
})
