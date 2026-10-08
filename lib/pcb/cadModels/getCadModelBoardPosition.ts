import type { AltiumComponentBodyRecord, AltiumPoint } from "altiumts"
import type { PcbBoard } from "circuit-json"
import { toMillimeterPoint } from "../geometry"

export function getCadModelBoardPosition({
  body,
  componentPosition,
  pcbBoard,
}: {
  body: AltiumComponentBodyRecord
  componentPosition: AltiumPoint | undefined
  pcbBoard: PcbBoard | undefined
}): { x: number; y: number } | undefined {
  const modelPosition = body.modelPosition
  if (!modelPosition) return undefined

  const modelPositionMillimeters = toMillimeterPoint(modelPosition)
  if (
    !componentPosition ||
    !pcbBoard ||
    pcbBoard.width === undefined ||
    pcbBoard.height === undefined
  ) {
    return modelPositionMillimeters
  }

  const componentPositionMillimeters = toMillimeterPoint(componentPosition)
  const distanceFromComponent = Math.hypot(
    modelPositionMillimeters.x - componentPositionMillimeters.x,
    modelPositionMillimeters.y - componentPositionMillimeters.y,
  )
  const boardDiagonal = Math.hypot(pcbBoard.width, pcbBoard.height)

  // Some Altium files retain a stale MODEL.2D anchor. Preserve ordinary model
  // origin offsets, but reject an anchor farther from its owner than the board.
  return distanceFromComponent > boardDiagonal
    ? componentPositionMillimeters
    : modelPositionMillimeters
}
