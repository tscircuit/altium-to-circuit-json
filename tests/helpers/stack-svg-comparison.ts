import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

export function stackAltiumAndCircuitJsonSvgs({
  altiumSvg,
  circuitJsonSvg,
  label,
}: {
  altiumSvg: string
  circuitJsonSvg: string
  label: string
}): string {
  return stackSvgsHorizontally([altiumSvg, circuitJsonSvg], {
    gap: 24,
    normalizeSize: true,
    targetSize: 800,
    rootAttributes: {
      "aria-label": `${label}: altiumts source on left, Circuit JSON on right`,
      role: "img",
    },
  })
}

export function stackAltiumAndCircuitJsonSvgsVertically({
  altiumSvg,
  circuitJsonSvg,
  label,
}: {
  altiumSvg: string
  circuitJsonSvg: string
  label: string
}): string {
  return stackSvgsVertically([altiumSvg, circuitJsonSvg], {
    gap: 24,
    normalizeSize: true,
    targetSize: 800,
    rootAttributes: {
      "aria-label": `${label}: altiumts source above, Circuit JSON below`,
      role: "img",
    },
  })
}
