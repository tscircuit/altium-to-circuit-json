import {
  AltiumPrjPcb,
  parseAltiumBinaryPcbDoc,
  parseAltiumSchDoc,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import {
  convertAltiumPcbDocToCircuitJson,
  convertAltiumProjectToCircuitJson,
} from "../../lib"
import { sitaraBoards } from "../../scripts/references/sitara-references"
import { readReferenceBytes } from "./read-reference"

export async function convertSitaraPcb({
  board,
  project,
}: {
  board: (typeof sitaraBoards)[number]
  project: AltiumPrjPcb
}): Promise<AnyCircuitElement[]> {
  const document = parseAltiumBinaryPcbDoc(await readReferenceBytes(board.pcb))
  if (board.id !== "sk-am62")
    return convertAltiumPcbDocToCircuitJson(document, { project })
  // This SK-AM62 PCB export declares nets but does not assign its pads to them.
  // The project converter obtains those assignments from the native schematics.
  const schematicFilenames = board.schematics
  const schematics = await Promise.all(
    schematicFilenames.map(async (filename) => ({
      document: parseAltiumSchDoc(await readReferenceBytes(filename)),
      options: { project, documentName: filename, projectName: board.project },
    })),
  )
  return convertAltiumProjectToCircuitJson({
    pcb: { document, options: { project } },
    schematics,
  })
}
