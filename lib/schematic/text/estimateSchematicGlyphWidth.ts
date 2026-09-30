export function estimateSchematicGlyphWidth({
  character,
  fontSize,
  fontFamily,
}: {
  character: string
  fontSize: number
  fontFamily: string
}): number {
  if (/courier|mono/iu.test(fontFamily)) return fontSize * 0.6
  const isSerif = /times|cambria|serif/iu.test(fontFamily)
  const emWidth =
    character === " "
      ? isSerif
        ? 0.23
        : 0.28
      : /[ilI1.,:;!'`|]/u.test(character)
        ? isSerif
          ? 0.2
          : 0.24
        : /[mwMW@%]/u.test(character)
          ? isSerif
            ? 0.7
            : 0.78
          : /[A-Z0-9]/u.test(character)
            ? isSerif
              ? 0.5
              : 0.56
            : isSerif
              ? 0.4
              : 0.52
  return emWidth * fontSize
}
