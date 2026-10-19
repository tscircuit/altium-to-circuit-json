import { test } from "bun:test"
import { expectSitaraBoardSnapshots } from "../helpers/expect-sitara-board-snapshots"

test(
  "BeaglePlay: Altium beside Circuit JSON for both PCB layers and every schematic sheet",
  async () => {
    await expectSitaraBoardSnapshots({
      boardId: "beagleplay",
      testPath: import.meta.path,
    })
  },
  { timeout: 600_000 },
)
