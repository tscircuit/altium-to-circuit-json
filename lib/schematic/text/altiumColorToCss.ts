import { toHex } from "./toHex"

export function altiumColorToCss(
  raw: string | undefined,
  fallback: string,
): string {
  if (raw === undefined) return fallback
  const colorValue = Number(raw)
  if (!Number.isInteger(colorValue) || colorValue < 0) return fallback
  const red = colorValue & 0xff
  const green = (colorValue >>> 8) & 0xff
  const blue = (colorValue >>> 16) & 0xff
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}
