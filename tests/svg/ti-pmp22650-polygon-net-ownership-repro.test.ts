import { expect, test } from "bun:test"
import {
  AltiumFillRecord,
  AltiumPolygonRecord,
  AltiumRegionRecord,
  parseAltiumBinaryPcbDoc,
} from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { createRealBoardDiagnosticSvg } from "../helpers/create-real-board-diagnostic-svg"
import { readReferenceBytes } from "../helpers/read-reference"

const filename = "ti-pmp22650-main.PcbDoc"

test(
  "repro: PMP22650 polygon child copper loses its native net ownership",
  async () => {
    const document = parseAltiumBinaryPcbDoc(await readReferenceBytes(filename))
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    const convertedCopperAreaById = new Map(
      circuitJson
        .filter((element) => element.type === "pcb_copper_pour")
        .map((element) => [element.pcb_copper_pour_id, element]),
    )
    let expectedNetOwnedCopperAreaCount = 0
    let convertedNetOwnedCopperAreaCount = 0

    for (const [recordIndex, record] of document.records.entries()) {
      const copperAreaId =
        record instanceof AltiumRegionRecord
          ? `pcb_copper_pour_altium_region_${recordIndex}`
          : record instanceof AltiumFillRecord
            ? `pcb_copper_pour_altium_fill_${recordIndex}`
            : record instanceof AltiumPolygonRecord
              ? `pcb_copper_pour_altium_polygon_${document.polygons.indexOf(record)}`
              : undefined
      if (!copperAreaId) continue
      const convertedCopperArea = convertedCopperAreaById.get(copperAreaId)
      if (!convertedCopperArea) continue
      const parentPolygon = document.getPolygonForRecord(record)
      const sourceNet =
        document.getNetForRecord(record) ??
        (parentPolygon ? document.getNetForRecord(parentPolygon) : undefined)
      if (!sourceNet) continue
      expectedNetOwnedCopperAreaCount++
      if (convertedCopperArea.source_net_id) {
        convertedNetOwnedCopperAreaCount++
      }
    }

    const { comparisonSvg } = await createOpenSourcePcbComparison({
      filename,
      focusOnBoard: true,
      pcbName: "TI PMP22650",
    })
    const diagnosticSvg = createRealBoardDiagnosticSvg({
      boardComparisonSvg: comparisonSvg,
      boardName: "PMP22650 main board",
      title: "Polygon-child net ownership",
      rows: [
        {
          actual: `${convertedNetOwnedCopperAreaCount} owned copper areas`,
          expected: `${expectedNetOwnedCopperAreaCount} owned copper areas`,
          label: "Converted copper areas with the Altium parent net",
          matches:
            convertedNetOwnedCopperAreaCount ===
            expectedNetOwnedCopperAreaCount,
          ratio:
            convertedNetOwnedCopperAreaCount / expectedNetOwnedCopperAreaCount,
        },
      ],
    })

    expect(expectedNetOwnedCopperAreaCount).toBe(401)
    expect(convertedNetOwnedCopperAreaCount).toBe(6)
    await expect(diagnosticSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
