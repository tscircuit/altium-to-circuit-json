import type { AltiumPrjPcb } from "altiumts"
import { getProjectTextReplacements } from "./getProjectTextReplacements"
import { replaceMatchingSpecialString } from "./replaceMatchingSpecialString"

const QUOTED_SPECIAL_STRING = /'\.([A-Za-z][A-Za-z0-9_]*)'/gu
const SPECIAL_STRING = /\.([A-Za-z][A-Za-z0-9_]*)/gu

export function resolvePcbProjectSpecialStrings({
  project,
  text,
}: {
  project?: AltiumPrjPcb
  text: string
}): string {
  if (!project || !text.includes(".")) return text
  let resolvedText = text
  for (const replacement of getProjectTextReplacements(project)) {
    resolvedText = replaceMatchingSpecialString({
      expression: QUOTED_SPECIAL_STRING,
      replacement,
      text: resolvedText,
    })
    resolvedText = replaceMatchingSpecialString({
      expression: SPECIAL_STRING,
      replacement,
      text: resolvedText,
    })
  }
  return resolvedText
}
