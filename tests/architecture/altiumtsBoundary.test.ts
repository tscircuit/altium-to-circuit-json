import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import ts from "typescript"

test("keeps Altium parsing and source rendering behind public boundaries", () => {
  const libraryDirectory = join(import.meta.dir, "../../lib")
  const pendingDirectories = [libraryDirectory]
  const sourcePaths: string[] = []
  while (pendingDirectories.length > 0) {
    const directory = pendingDirectories.pop()
    if (!directory) continue
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) pendingDirectories.push(entryPath)
      else if (entry.name.endsWith(".ts")) sourcePaths.push(entryPath)
    }
  }

  const parserBoundary = "converter/parseAltiumSource.ts"
  const upstreamOwnedFunctions = new Set([
    "altiumPointsEqual",
    "getSchematicConnectedEnd",
    "getSchematicConnectionSegments",
    "getSchematicCoordinate",
    "getSchematicPoint",
    "getSchematicPortDirection",
    "getSchematicRecordPoints",
  ])
  const findings: string[] = []

  for (const sourcePath of sourcePaths) {
    const sourceText = readFileSync(sourcePath, "utf8")
    const displayPath = relative(libraryDirectory, sourcePath)
    const sourceFile = ts.createSourceFile(
      sourcePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    )

    for (const statement of sourceFile.statements) {
      if (
        ts.isFunctionDeclaration(statement) &&
        statement.name &&
        upstreamOwnedFunctions.has(statement.name.text)
      ) {
        findings.push(
          `${displayPath}: reimplements altiumts ${statement.name.text}`,
        )
      }
      if (!ts.isImportDeclaration(statement)) continue
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
      const moduleName = statement.moduleSpecifier.text
      if (moduleName.startsWith("altiumts/") || moduleName === "altiumts/lib") {
        findings.push(`${displayPath}: deep-imports ${moduleName}`)
      }
      if (moduleName !== "altiumts") continue
      const imports = statement.importClause?.namedBindings
      if (!imports || !ts.isNamedImports(imports)) continue
      for (const element of imports.elements) {
        const importedName = element.propertyName?.text ?? element.name.text
        if (
          displayPath !== parserBoundary &&
          [
            "parseAltiumFile",
            "parseAltiumPcbDoc",
            "parseAltiumSchDoc",
          ].includes(importedName)
        ) {
          findings.push(
            `${displayPath}: parses Altium outside ${parserBoundary}`,
          )
        }
        if (importedName.startsWith("serializeAltium")) {
          findings.push(
            `${displayPath}: renders native Altium SVG in production`,
          )
        }
      }
    }
  }

  expect(findings).toEqual([])
})
