export function uniqueStrings(strings: Array<string | undefined>): string[] {
  return [
    ...new Set(
      strings.filter((candidate): candidate is string => Boolean(candidate)),
    ),
  ]
}

export function sanitizeId(sourceText: string): string {
  const sanitized = sourceText
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
  return sanitized || "unnamed"
}

export type SchematicSegmentKey = string & {
  readonly __schematicSegmentKey: unique symbol
}

export function segmentKey(
  start: { x: number; y: number },
  end: { x: number; y: number },
): SchematicSegmentKey {
  const startKey = `${start.x.toFixed(6)},${start.y.toFixed(6)}`
  const endKey = `${end.x.toFixed(6)},${end.y.toFixed(6)}`
  return (
    startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
  ) as SchematicSegmentKey
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
