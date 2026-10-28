import { expect } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { renderGLTFToPNGFromGLB } from "poppygl"

export async function expectPrimitiveCadBodySnapshot({
  glb,
  testPath,
  viewName,
  camPos,
  lookAt,
}: {
  glb: ArrayBuffer
  testPath: string
  viewName: "bottom" | "top"
  camPos: [number, number, number]
  lookAt: [number, number, number]
}): Promise<void> {
  const renderedPng = await renderGLTFToPNGFromGLB(glb, {
    backgroundColor: "#ffffff",
    camPos,
    lookAt,
    up: "y+",
    fov: 45,
    height: 640,
    width: 960,
  })
  const snapshotPath = join(
    dirname(testPath),
    "__snapshots__",
    `${basename(testPath, ".test.ts")}-${viewName}.snap.png`,
  )
  if (
    process.env.BUN_UPDATE_SNAPSHOTS === "1" ||
    process.env.BUN_FORCE_UPDATE_SNAPSHOTS === "1"
  ) {
    await mkdir(dirname(snapshotPath), { recursive: true })
    await writeFile(snapshotPath, renderedPng)
  }
  expect(await Bun.file(snapshotPath).exists()).toBe(true)
  expect(renderedPng).toEqual(new Uint8Array(await readFile(snapshotPath)))
}
