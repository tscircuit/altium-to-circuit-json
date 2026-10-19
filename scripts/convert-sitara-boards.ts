import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { AltiumPrjPcb, parseAltiumFile } from "altiumts"
import { convertAltiumToCircuitJson } from "../lib"
import { readReferenceBytes } from "../tests/helpers/read-reference"
import { convertSitaraPcb } from "../tests/helpers/convert-sitara-pcb"
import { sitaraBoards } from "./references/sitara-references"

const outputDirectory = resolve(
  process.argv[2] ?? "artifacts/sitara-circuit-json",
)
await mkdir(outputDirectory, { recursive: true })

const requestedBoardIds = new Set(process.argv.slice(3))
for (const board of sitaraBoards.filter(
  ({ id }) => requestedBoardIds.size === 0 || requestedBoardIds.has(id),
)) {
  const project = parseAltiumFile(
    await readReferenceBytes(board.project),
  ).document
  if (!(project instanceof AltiumPrjPcb)) {
    throw new Error(`${board.project} is not an Altium project`)
  }
  const pcbCircuitJson = await convertSitaraPcb({ board, project })
  await Bun.write(
    resolve(outputDirectory, `${board.id}-pcb.circuit.json.gz`),
    gzipSync(JSON.stringify(pcbCircuitJson)),
  )
  for (const [sheetIndex, filename] of board.schematics.entries()) {
    const circuitJson = convertAltiumToCircuitJson(
      await readReferenceBytes(filename),
      {
        sourceType: "schematic",
        schematic: {
          documentName: filename,
          project,
          projectName: board.project,
          sheetName: `${board.name} sheet ${sheetIndex + 1}`,
        },
      },
    )
    const sheetNumber = String(sheetIndex + 1).padStart(2, "0")
    await Bun.write(
      resolve(
        outputDirectory,
        `${board.id}-schematic-${sheetNumber}.circuit.json.gz`,
      ),
      gzipSync(JSON.stringify(circuitJson)),
    )
  }
  console.log(
    `${board.name}: wrote PCB and ${board.schematics.length} schematic sheets`,
  )
}
