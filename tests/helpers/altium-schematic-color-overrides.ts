import type { AltiumRecord, AltiumSchDoc } from "altiumts"
import type { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { altiumColorToCss } from "../../lib/schematic/render-text"

type SchematicColorOverrides = NonNullable<
  NonNullable<
    Parameters<typeof convertCircuitJsonToSchematicSvg>[1]
  >["colorOverrides"]
>["schematic"]

const COMPONENT_GRAPHIC_KINDS = new Set([
  "6",
  "7",
  "8",
  "10",
  "11",
  "12",
  "13",
  "14",
])

export function getAltiumSchematicColorOverrides({
  document,
}: {
  document: AltiumSchDoc
}): SchematicColorOverrides {
  const componentGraphics = document.records.filter(
    (record) =>
      COMPONENT_GRAPHIC_KINDS.has(record.recordKind ?? "") &&
      hasComponentAncestor({ document, record }),
  )
  const pinColor = getDominantRecordColor({
    fallback: "#1f2937",
    records: document.records.filter((record) => record.recordKind === "2"),
  })

  return {
    background: "#fffef8",
    component_body: getDominantRecordColor({
      fallback: "#ffffb0",
      fieldName: "AREACOLOR",
      records: componentGraphics.filter(
        (record) => record.getBoolean("ISSOLID") === true,
      ),
    }),
    component_outline: getDominantRecordColor({
      fallback: "#1f2937",
      records: componentGraphics,
    }),
    junction: getDominantRecordColor({
      fallback: "#800000",
      records: document.records.filter((record) => record.recordKind === "29"),
    }),
    label_background: "transparent",
    label_global: getDominantRecordColor({
      fallback: "#0000ff",
      records: document.records.filter((record) => record.recordKind === "18"),
    }),
    net_name: "#334155",
    no_connect: getDominantRecordColor({
      fallback: "#ff0000",
      records: document.records.filter((record) => record.recordKind === "22"),
    }),
    pin: pinColor,
    pin_name: pinColor,
    pin_number: pinColor,
    reference: getDominantRecordColor({
      fallback: "#000080",
      records: document.records.filter((record) => record.recordKind === "34"),
    }),
    sheet: "#334155",
    sheet_label: "#000080",
    value: getDominantRecordColor({
      fallback: "#000080",
      records: document.records.filter(
        (record) =>
          record.recordKind === "41" &&
          ["comment", "value"].includes(
            record.getDecoded("NAME")?.toLowerCase() ?? "",
          ),
      ),
    }),
    wire: getDominantRecordColor({
      fallback: "#008000",
      records: document.records.filter((record) => record.recordKind === "27"),
    }),
  }
}

function getDominantRecordColor({
  fallback,
  fieldName = "COLOR",
  records,
}: {
  fallback: string
  fieldName?: string
  records: AltiumRecord[]
}): string {
  const counts = new Map<string, number>()
  for (const record of records) {
    const color = altiumColorToCss(
      record.getCaseInsensitive(fieldName),
      fallback,
    )
    counts.set(color, (counts.get(color) ?? 0) + 1)
  }

  let dominantColor = fallback
  let dominantCount = 0
  for (const [color, count] of counts) {
    if (count > dominantCount) {
      dominantColor = color
      dominantCount = count
    }
  }
  return dominantColor
}

function hasComponentAncestor({
  document,
  record,
}: {
  document: AltiumSchDoc
  record: AltiumRecord
}): boolean {
  let parent = document.getParent(record)
  const visited = new Set<AltiumRecord>()
  while (parent && !visited.has(parent)) {
    if (parent.recordKind === "1") return true
    visited.add(parent)
    parent = document.getParent(parent)
  }
  return false
}
