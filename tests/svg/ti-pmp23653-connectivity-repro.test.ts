import { expect, test } from "bun:test"
import { AltiumPadRecord, parseAltiumBinaryPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { createRealBoardDiagnosticSvg } from "../helpers/create-real-board-diagnostic-svg"
import { readReferenceBytes } from "../helpers/read-reference"

const filename = "ti-pmp23653-planar-transformer.PcbDoc"

test(
  "repro: PMP23653 planar-transformer pads have no component or port graph",
  async () => {
    const document = parseAltiumBinaryPcbDoc(await readReferenceBytes(filename))
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    const expectedElectricalPadCount = document.records.filter(
      (record) =>
        record instanceof AltiumPadRecord &&
        !(record.plated === false && (record.holeSizeMils ?? 0) > 0),
    ).length
    const sourceComponentCount = circuitJson.filter(
      (element) => element.type === "source_component",
    ).length
    const sourcePortCount = circuitJson.filter(
      (element) => element.type === "source_port",
    ).length
    const pcbPortCount = circuitJson.filter(
      (element) => element.type === "pcb_port",
    ).length
    const sourceTracesWithPorts = circuitJson
      .filter((element) => element.type === "source_trace")
      .filter((trace) => trace.connected_source_port_ids.length > 0).length
    const { comparisonSvg } = await createOpenSourcePcbComparison({
      filename,
      focusOnBoard: true,
      pcbName: "TI PMP23653 planar transformer",
    })
    const diagnosticSvg = createRealBoardDiagnosticSvg({
      boardComparisonSvg: comparisonSvg,
      boardName: "PMP23653 planar-transformer board",
      title: "Native component, pad, port, and net graph",
      rows: [
        {
          actual: `${sourceComponentCount} source components`,
          expected: `${document.components.length} source components`,
          label: "Altium components represented in Circuit JSON",
          matches: sourceComponentCount === document.components.length,
          ratio: sourceComponentCount / document.components.length,
        },
        {
          actual: `${sourcePortCount} source / ${pcbPortCount} PCB ports`,
          expected: `${expectedElectricalPadCount} source / ${expectedElectricalPadCount} PCB ports`,
          label: "Electrical pads represented as connected ports",
          matches:
            sourcePortCount === expectedElectricalPadCount &&
            pcbPortCount === expectedElectricalPadCount,
          ratio:
            Math.min(sourcePortCount, pcbPortCount) /
            expectedElectricalPadCount,
        },
        {
          actual: `${sourceTracesWithPorts} traces with endpoints`,
          expected: `${document.nets.length} traces with endpoints`,
          label: "Native Altium nets carrying converted pad endpoints",
          matches: sourceTracesWithPorts === document.nets.length,
          ratio: sourceTracesWithPorts / document.nets.length,
        },
      ],
    })

    expect(sourceComponentCount).toBe(0)
    expect(sourcePortCount).toBe(0)
    expect(pcbPortCount).toBe(0)
    expect(sourceTracesWithPorts).toBe(0)
    await expect(diagnosticSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
