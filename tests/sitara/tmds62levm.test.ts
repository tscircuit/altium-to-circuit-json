import { test } from "bun:test"
import { expectSitaraBoardSnapshots } from "../helpers/expect-sitara-board-snapshots"

test(
  "TMDS62LEVM: Altium beside Circuit JSON for both PCB layers and every schematic sheet",
  async () => {
    await expectSitaraBoardSnapshots({
      boardId: "tmds62levm",
      testPath: import.meta.path,
    })
  },
  { timeout: 600_000 },
)
