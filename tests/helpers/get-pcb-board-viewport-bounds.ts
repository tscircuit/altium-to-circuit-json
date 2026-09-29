import type { AnyCircuitElement } from "circuit-json"

type PcbBoard = Extract<AnyCircuitElement, { type: "pcb_board" }>

export interface PcbBoardViewportBounds {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

export function getPcbBoardViewportBounds(
  board: PcbBoard,
): PcbBoardViewportBounds {
  const outline = board.outline ?? []
  const rectangularBounds =
    board.width !== undefined && board.height !== undefined
      ? {
          maxX: board.center.x + board.width / 2,
          maxY: board.center.y + board.height / 2,
          minX: board.center.x - board.width / 2,
          minY: board.center.y - board.height / 2,
        }
      : undefined
  const bounds =
    outline.length >= 3
      ? {
          maxX: Math.max(...outline.map((point) => point.x)),
          maxY: Math.max(...outline.map((point) => point.y)),
          minX: Math.min(...outline.map((point) => point.x)),
          minY: Math.min(...outline.map((point) => point.y)),
        }
      : rectangularBounds
  if (!bounds) throw new Error("PCB board has no viewport geometry")
  const padding =
    Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.05
  return {
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
  }
}
