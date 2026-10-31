import { Resvg } from "@resvg/resvg-js"

export function getSvgPinLabelBounds({
  svg,
  labelPrefix,
}: {
  svg: string
  labelPrefix: string
}): { minX: number; maxX: number } {
  const labelMarkup = [
    ...svg.matchAll(
      /<text\b(?=[^>]*class="[^"]*\bsch-pin-label\b)[^>]*>[\s\S]*?<\/text>/gu,
    ),
  ].find(([markup]) =>
    markup.replace(/<[^>]*>/gu, "").startsWith(labelPrefix),
  )?.[0]
  if (!labelMarkup) throw new Error(`No rendered pin label: ${labelPrefix}`)
  const bounds = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800">${labelMarkup}</svg>`,
  ).getBBox()
  if (!bounds) throw new Error(`No rendered pin label bounds: ${labelPrefix}`)
  return { minX: bounds.x, maxX: bounds.x + bounds.width }
}
