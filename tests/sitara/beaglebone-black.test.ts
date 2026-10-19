import { test } from "bun:test"
import { expectSitaraBoardSnapshots } from "../helpers/expect-sitara-board-snapshots"

test(
  "BeagleBone Black: Altium beside Circuit JSON for both PCB layers and every schematic sheet",
  async () => {
    await expectSitaraBoardSnapshots({
      boardId: "beaglebone-black",
      testPath: import.meta.path,
    })
  },
  { timeout: 600_000 },
)
