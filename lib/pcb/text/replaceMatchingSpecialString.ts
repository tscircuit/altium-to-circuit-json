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
    `(^|[^\\p{L}\\p{N}_])\\.${escapedName}(?!['\\p{L}\\p{N}_\\s-])`,
    "giu",
  )
  if (isQuoted) {
    return text.replace(quotedExpression, () => replacement.text)
  }
  return text
    .split("'")
    .map((segment, index) =>
      index % 2 === 0
        ? segment.replace(
            unquotedExpression,
            (_matchedText, prefix: string) => `${prefix}${replacement.text}`,
          )
        : segment,
    )
    .join("'")
}
