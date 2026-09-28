import { expect, test } from "bun:test"
import {
  AltiumPadRecord,
  getPcbLayerStack,
  getPcbRecordComponent,
  parseAltiumBinaryPcbDoc,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { createRealBoardDiagnosticSvg } from "../helpers/create-real-board-diagnostic-svg"
import { readReferenceBytes } from "../helpers/read-reference"

const filename = "ti-pmp22650-main.PcbDoc"

test(
  "repro: PMP22650 physical stack metadata is flattened during conversion",
  async () => {
    const document = parseAltiumBinaryPcbDoc(await readReferenceBytes(filename))
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    const sourceThickness =
      getPcbLayerStack(document.board!)
        .entries.filter((entry) => entry.source === "v8")
        .reduce(
          (total, entry) =>
            total +
            (entry.copperThickness?.toMils() ?? 0) +
            (entry.dielectricHeight?.toMils() ?? 0),
          0,
        ) * 0.0254
    const board = circuitJson.find((element) => element.type === "pcb_board")
    const mp1RecordIndex = document.records.findIndex(
      (record) =>
        record instanceof AltiumPadRecord &&
        record.name === "1" &&
        getPcbRecordComponent(document, record)?.designator === "MP1",
    )
    const mp1Record = document.records[mp1RecordIndex]
    if (!(mp1Record instanceof AltiumPadRecord)) {
      throw new Error("PMP22650 MP1 pin 1 was not found")
    }
    const convertedMp1 = circuitJson.find(
      (element) =>
        element.type === "pcb_plated_hole" &&
        element.pcb_plated_hole_id ===
          `pcb_plated_hole_altium_${mp1RecordIndex}`,
    ) as
      | (Extract<AnyCircuitElement, { type: "pcb_plated_hole" }> & {
          pad_stack?: Array<{ layer: string; shape: string }>
        })
      | undefined
    const convertedPadStack = convertedMp1?.pad_stack ?? []
    const convertedInnerLayerCount = convertedPadStack.filter((pad) =>
      pad.layer.startsWith("inner"),
    ).length
    const expectedInnerLayerCount = 6
    const { comparisonSvg } = await createOpenSourcePcbComparison({
      filename,
      focusOnBoard: true,
      pcbName: "TI PMP22650",
    })
    const diagnosticSvg = createRealBoardDiagnosticSvg({
      boardComparisonSvg: comparisonSvg,
      boardName: "PMP22650 main board",
      title: "Physical stack metadata",
      rows: [
        {
          actual: `${board?.thickness.toFixed(4)} mm`,
          expected: `${sourceThickness.toFixed(4)} mm`,
          label: "Board thickness",
          matches: Math.abs((board?.thickness ?? 0) - sourceThickness) < 1e-6,
          ratio: (board?.thickness ?? 0) / sourceThickness,
        },
        {
          actual:
            convertedPadStack.length === 0
              ? "no per-layer pad stack"
              : `${convertedPadStack.length} copper layers`,
          expected: "8 copper layers",
          label: "MP1 pin 1 copper layers",
          matches: convertedPadStack.length === 8,
          ratio: convertedPadStack.length / 8,
        },
        {
          actual:
            convertedInnerLayerCount === 0
              ? "missing"
              : `${convertedInnerLayerCount} circular inner pads`,
          expected: `${expectedInnerLayerCount} circular inner pads`,
          label: "MP1 pin 1 inner-layer geometry",
          matches: convertedInnerLayerCount === expectedInnerLayerCount,
          ratio: convertedInnerLayerCount / expectedInnerLayerCount,
        },
      ],
    })

    expect(board?.thickness).toBeCloseTo(sourceThickness, 7)
    expect(convertedMp1?.pad_stack).toHaveLength(8)
    expect(convertedInnerLayerCount).toBe(expectedInnerLayerCount)
    await expect(diagnosticSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
