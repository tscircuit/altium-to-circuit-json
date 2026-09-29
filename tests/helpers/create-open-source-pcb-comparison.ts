import {
  AltiumBinaryPcbDoc,
  AltiumPcbDoc,
  type AltiumPcbDocument,
  parseAltiumFile,
  serializeAltiumPcbToSvg,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumToCircuitJson } from "../../lib"
import { MILS_TO_MILLIMETERS } from "../../lib/pcb/model/constants"
import { getPcbBoardViewportBounds } from "./get-pcb-board-viewport-bounds"
import { readReferenceBytes } from "./read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "./stack-svg-comparison"

interface OpenSourcePcbComparison {
  circuitJson: AnyCircuitElement[]
  circuitJsonSvg: string
  comparisonSvg: string
  document: AltiumPcbDocument
}

export async function createOpenSourcePcbComparison({
  filename,
  focusOnBoard = false,
  pcbName,
}: {
  filename: string
  focusOnBoard?: boolean
  pcbName: string
}): Promise<OpenSourcePcbComparison> {
  const source = await readReferenceBytes(filename)
  const document = parseAltiumFile(source).document
  if (
    !(document instanceof AltiumPcbDoc) &&
    !(document instanceof AltiumBinaryPcbDoc)
  ) {
    throw new Error(
      `Expected ${filename} to contain an Altium PCB document, got ${document.type}`,
    )
  }
  const circuitJson = convertAltiumToCircuitJson(source, { sourceType: "pcb" })
  const board = circuitJson.find((element) => element.type === "pcb_board")
  if (!board) throw new Error(`${filename} did not produce a PCB board`)

  const boardBounds = focusOnBoard
    ? getPcbBoardViewportBounds(board)
    : undefined
  const altiumSvg = serializeAltiumPcbToSvg(document, {
    height: 600,
    title: "altiumts source rendering",
    viewBox:
      focusOnBoard && boardBounds
        ? {
            height: (boardBounds.maxY - boardBounds.minY) / MILS_TO_MILLIMETERS,
            width: (boardBounds.maxX - boardBounds.minX) / MILS_TO_MILLIMETERS,
            x: boardBounds.minX / MILS_TO_MILLIMETERS,
            y: boardBounds.minY / MILS_TO_MILLIMETERS,
          }
        : undefined,
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 600,
    matchBoardAspectRatio: true,
    viewport: boardBounds,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: `${pcbName} PCB`,
  })

  return { circuitJson, circuitJsonSvg, comparisonSvg, document }
}
