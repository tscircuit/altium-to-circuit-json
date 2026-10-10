import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { getCapacitorPolarityMarks } from "../../lib/schematic/components/getCapacitorPolarityMarks"

test("merging polarity strokes does not bridge gaps or turn T-junctions into plus marks", () => {
  const drawings = [
    [
      [
        [51, 58],
        [52, 58],
      ],
      [
        [54, 58],
        [55, 58],
      ],
      [
        [53, 56],
        [53, 58],
        [53, 60],
      ],
    ],
    [
      [
        [51, 58],
        [53, 58],
        [55, 58],
      ],
      [
        [53, 56],
        [53, 57],
        [53, 58],
      ],
    ],
    [
      [
        [51, 58],
        [53, 58],
      ],
      [
        [53, 59],
        [55, 59],
      ],
      [
        [53, 56],
        [53, 58],
        [53, 60],
      ],
    ],
  ] as const
  for (const strokes of drawings) {
    const records = strokes.map(
      (points) =>
        `|RECORD=6|LocationCount=${points.length}|${points.map(([x, y], index) => `X${index + 1}=${x}|Y${index + 1}=${y}`).join("|")}`,
    )
    expect(
      getCapacitorPolarityMarks(
        parseAltiumSchDoc(["|RECORD=31", ...records].join("\n")).records,
      ),
    ).toEqual([])
  }
})
