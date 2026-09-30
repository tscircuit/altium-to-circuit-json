import type { ProjectTextReplacement } from "./types"
import { escapeRegularExpression } from "./escapeRegularExpression"

export function replaceMatchingSpecialString({
  isQuoted,
  replacement,
  text,
}: {
  isQuoted: boolean
  replacement: ProjectTextReplacement
  text: string
}): string {
  const escapedName = escapeRegularExpression(replacement.name)
  const quotedExpression = new RegExp(`'\\.${escapedName}'`, "giu")
  const unquotedExpression = new RegExp(
    `(^|[^\\p{L}\\p{N}_])\\.${escapedName}(?!['\\p{L}\\p{N}_-])`,
    "giu",
  )
  if (isQuoted) {
    return text.replace(quotedExpression, () => replacement.text)
  }
  return text.replace(
    unquotedExpression,
    (_matchedText, prefix: string) => `${prefix}${replacement.text}`,
  )
}
