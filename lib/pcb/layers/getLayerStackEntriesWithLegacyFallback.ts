import {
  AltiumBoardRecord,
  cloneAltiumNode,
  getPcbLayerStack,
  type AltiumPcbLayerStackEntry,
} from "altiumts"

export function getLayerStackEntriesWithLegacyFallback(
  board: AltiumBoardRecord,
): AltiumPcbLayerStackEntry[] {
  const entries = getPcbLayerStack(board).entries
  if (entries.some((entry) => entry.source === "legacy")) return entries

  // Some boards have modern mechanical layers but retain their copper stack
  // in legacy fields. Let the parser read that view too, without changing the
  // source board. The caller still prefers modern copper when it is present.
  const legacyBoard = new AltiumBoardRecord({
    items: board.fields
      .filter((field) => !/^(?:LAYER_V8_|LAYERV7_)/iu.test(field.key))
      .map((field) => cloneAltiumNode(field)),
  })
  return [
    ...entries,
    ...getPcbLayerStack(legacyBoard).entries.filter(
      (entry) => entry.source === "legacy",
    ),
  ]
}
