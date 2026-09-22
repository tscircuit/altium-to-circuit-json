export function createOctagonPoints({
  x,
  y,
  width,
  height,
  ccwRotationDegrees,
}: {
  x: number
  y: number
  width: number
  height: number
  ccwRotationDegrees: number
}): Array<{ x: number; y: number }> {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const chamfer = Math.min(width, height) / 4
  const points = [
    { x: -halfWidth + chamfer, y: -halfHeight },
    { x: halfWidth - chamfer, y: -halfHeight },
    { x: halfWidth, y: -halfHeight + chamfer },
    { x: halfWidth, y: halfHeight - chamfer },
    { x: halfWidth - chamfer, y: halfHeight },
    { x: -halfWidth + chamfer, y: halfHeight },
    { x: -halfWidth, y: halfHeight - chamfer },
    { x: -halfWidth, y: -halfHeight + chamfer },
  ]
  const radians = (ccwRotationDegrees * Math.PI) / 180
  return points.map((point) => ({
    x: x + point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: y + point.x * Math.sin(radians) + point.y * Math.cos(radians),
  }))
}
