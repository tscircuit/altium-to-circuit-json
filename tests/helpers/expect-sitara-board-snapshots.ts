import { expect } from "bun:test"
import {
  AltiumPrjPcb,
  parseAltiumFile,
  parseAltiumBinaryPcbDoc,
  serializeAltiumPcbToSvg,
} from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg-sitara"
import { sitaraBoards } from "../../scripts/references/sitara-references"
import { createOpenSourceSchematicComparison } from "./create-open-source-schematic-comparison"
import { readReferenceBytes } from "./read-reference"
import { convertSitaraPcb } from "./convert-sitara-pcb"
import { stackAltiumAndCircuitJsonSvgs } from "./stack-svg-comparison"

type SitaraBoardId = (typeof sitaraBoards)[number]["id"]

export async function expectSitaraBoardSnapshots({
  boardId,
  testPath,
}: {
  boardId: SitaraBoardId
  testPath: string
}): Promise<void> {
  const board = sitaraBoards.find(({ id }) => id === boardId)
  if (!board) throw new Error(`Unknown Sitara board: ${boardId}`)
  const project = parseAltiumFile(
    await readReferenceBytes(board.project),
  ).document
  if (!(project instanceof AltiumPrjPcb)) {
    throw new Error(`${board.project} is not an Altium project`)
  }
  const pcbBytes = await readReferenceBytes(board.pcb)
  const document = parseAltiumBinaryPcbDoc(pcbBytes)
  const circuitJson = await convertSitaraPcb({ board, project })
  const pcbBoard = circuitJson.find((element) => element.type === "pcb_board")
  if (!pcbBoard) throw new Error(`${board.name} has no converted PCB board`)
  const bounds = document.boardGeometry.outline.bounds
  if (!bounds) throw new Error(`${board.name} has no Altium board outline`)
  const padding =
    Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.05

  expect({
    width: pcbBoard.width,
    height: pcbBoard.height,
    layerCount: pcbBoard.num_layers,
    components: circuitJson.filter(
      (element) => element.type === "pcb_component",
    ).length,
    pads: circuitJson.filter((element) => element.type === "pcb_smtpad").length,
    platedHoles: circuitJson.filter(
      (element) => element.type === "pcb_plated_hole",
    ).length,
    traces: circuitJson.filter((element) => element.type === "pcb_trace")
      .length,
    vias: circuitJson.filter((element) => element.type === "pcb_via").length,
    nets: circuitJson.filter((element) => element.type === "source_net").length,
  }).toMatchSnapshot("PCB conversion inventory")

  for (const layer of ["top", "bottom"] as const) {
    const altiumSvg = serializeAltiumPcbToSvg(document, {
      width: 800,
      height: 800,
      layers:
        layer === "top"
          ? ["TOP", "TOPOVERLAY", "MULTILAYER"]
          : ["BOTTOM", "BOTTOMOVERLAY", "MULTILAYER"],
      title: `${board.name} ${layer}: Altium source`,
      viewBox: {
        x: bounds.minX - padding,
        y: bounds.minY - padding,
        width: bounds.maxX - bounds.minX + 2 * padding,
        height: bounds.maxY - bounds.minY + 2 * padding,
      },
    })
    const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
      width: 800,
      height: 800,
      layer,
      matchBoardAspectRatio: true,
      viewportTarget: { pcb_board_id: pcbBoard.pcb_board_id },
    })
    expect(
      circuitJsonSvg.replace(/\b(?:href|src)="data:[^"]*"/gu, ""),
    ).not.toContain("NaN")
    await expect(
      stackAltiumAndCircuitJsonSvgs({
        altiumSvg,
        circuitJsonSvg,
        label: `${board.name} PCB ${layer}`,
      }),
    ).toMatchSvgSnapshot(testPath, `pcb-${layer}`)
  }

  for (const [sheetIndex, filename] of board.schematics.entries()) {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourceSchematicComparison({
        filename,
        projectFilename: board.project,
        schematicName: `${board.name} sheet ${sheetIndex + 1}`,
      })
    expect(
      circuitJson.some((element) => element.type === "schematic_sheet"),
    ).toBe(true)
    expect(
      circuitJsonSvg.replace(/\b(?:href|src)="data:[^"]*"/gu, ""),
    ).not.toContain("NaN")
    await expect(comparisonSvg).toMatchSvgSnapshot(
      testPath,
      `schematic-${String(sheetIndex + 1).padStart(2, "0")}`,
    )
  }
}
