export function getPowerPortPoint({
  across = 0,
  along,
  direction,
  location,
  perpendicular,
}: {
  across?: number
  along: number
  direction: { x: number; y: number }
  location: { x: number; y: number }
  perpendicular: { x: number; y: number }
}): { x: number; y: number } {
  return {
    x: location.x + direction.x * along + perpendicular.x * across,
    y: location.y + direction.y * along + perpendicular.y * across,
  }
}
