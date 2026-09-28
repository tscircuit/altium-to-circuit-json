import { stackSvgsVertically } from "stack-svgs"

export interface RealBoardDiagnosticRow {
  actual: string
  expected: string
  label: string
  matches: boolean
  ratio?: number
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function createDiagnosticPanelSvg({
  boardName,
  rows,
  title,
}: {
  boardName: string
  rows: RealBoardDiagnosticRow[]
  title: string
}): string {
  const width = 1624
  const rowHeight = 72
  const headerHeight = 82
  const height = headerHeight + rows.length * rowHeight + 24
  const rowMarkup = rows
    .map((row, index) => {
      const y = headerHeight + index * rowHeight
      const statusColor = row.matches ? "#2dd4bf" : "#fb7185"
      const statusText = row.matches ? "MATCH" : "MISMATCH"
      const ratio = Math.max(0, Math.min(1, row.ratio ?? (row.matches ? 1 : 0)))
      const barWidth = Math.max(4, 320 * ratio)

      return `<g transform="translate(0 ${y})">
  <rect x="24" y="8" width="1576" height="56" rx="8" fill="#202633" />
  <text x="48" y="31" fill="#f8fafc" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(row.label)}</text>
  <text x="650" y="31" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">Altium: ${escapeXml(row.expected)}</text>
  <text x="1050" y="31" fill="${statusColor}" font-family="Arial, sans-serif" font-size="16">Circuit JSON: ${escapeXml(row.actual)}</text>
  <rect x="650" y="43" width="320" height="7" rx="3.5" fill="#3b4352" />
  <rect x="650" y="43" width="${barWidth}" height="7" rx="3.5" fill="${statusColor}" />
  <text x="1510" y="31" fill="${statusColor}" font-family="Arial, sans-serif" font-size="14" font-weight="700" text-anchor="end">${statusText}</text>
</g>`
    })
    .join("\n")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#111827" />
  <text x="24" y="32" fill="#f8fafc" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(title)}</text>
  <text x="24" y="59" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16">Real TI source: ${escapeXml(boardName)}</text>
  ${rowMarkup}
</svg>`
}

export function createRealBoardDiagnosticSvg({
  boardComparisonSvg,
  boardName,
  rows,
  title,
}: {
  boardComparisonSvg: string
  boardName: string
  rows: RealBoardDiagnosticRow[]
  title: string
}): string {
  return stackSvgsVertically(
    [boardComparisonSvg, createDiagnosticPanelSvg({ boardName, rows, title })],
    {
      gap: 12,
      normalizeSize: false,
      rootAttributes: {
        "aria-label": `${boardName}: ${title}`,
        role: "img",
      },
    },
  )
}
