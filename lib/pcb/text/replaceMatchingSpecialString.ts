import type { ProjectTextReplacement } from "./types"

export function replaceMatchingSpecialString({
  expression,
  replacement,
  text,
}: {
  expression: RegExp
  replacement: ProjectTextReplacement
  text: string
}): string {
  return text.replace(expression, (matchedText, name: string) =>
    name.toLowerCase() === replacement.name.toLowerCase()
      ? replacement.text
      : matchedText,
  )
}
