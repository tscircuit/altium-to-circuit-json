export type ComponentId = string
export type ComponentDesignator = string
export type NetName = string
export type PointKey = string
export type SegmentKey = string
export type SourceNetId = string

export function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function sanitizeId(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
  return sanitized || "unnamed"
}

export function segmentKey(
  start: { x: number; y: number },
  end: { x: number; y: number },
): string {
  const startKey = `${start.x.toFixed(6)},${start.y.toFixed(6)}`
  const endKey = `${end.x.toFixed(6)},${end.y.toFixed(6)}`
  return startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
}

export function isGroundNet(name: string): boolean {
  return /(?:^|[_+-])(?:[adp]?gnd|ground)(?:$|[_+\d-])/iu.test(name)
}

export function isPowerNet(name: string): boolean {
  return (
    isGroundNet(name) ||
    /(?:^|[_+-])(?:vcc|vdd|vss)(?:$|[a-z0-9_+-])/iu.test(name) ||
    /(?:^|[_+-])(?:vin|vout|pwr|power)(?:$|[_+\d-])/iu.test(name)
  )
}
