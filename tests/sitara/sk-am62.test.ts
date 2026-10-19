import { test } from "bun:test"
import { expectSitaraBoardSnapshots } from "../helpers/expect-sitara-board-snapshots"

test(
  "SK-AM62: Altium beside Circuit JSON for both PCB layers and every schematic sheet",
  async () => {
    await expectSitaraBoardSnapshots({
      boardId: "sk-am62",
      testPath: import.meta.path,
    })
  },
  { timeout: 600_000 },
)
