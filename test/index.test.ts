const ts = require('typescript')
const fs = require('fs')
const path = require('path')
const prettier = require('prettier')

const transformerFactory = require('../src')
const transformer = transformerFactory()
const printer = ts.createPrinter()
const formatOption = { semi: false, parser: 'babylon', singleQuote: true }
const format = (code: string) => prettier.format(code, formatOption)

describe('default', () => {
  const fixturesDir = path.join(__dirname, 'fixtures')

  fs.readdirSync(fixturesDir).map((caseName: string) => {
    it(caseName.split('-').join(' '), () => {
      const fixtureDir = path.join(fixturesDir, caseName)
      const actualPath = path.join(fixtureDir, 'actual.ts')
      const sourceCode = fs.readFileSync(actualPath, 'utf-8')
      const source = ts.createSourceFile('', sourceCode, ts.ScriptTarget.ES2016, true)
      const result = ts.transform(source, [transformer])
      const transformedSourceFile = result.transformed[0]
      const resultCode = printer.printFile(transformedSourceFile)

      const expected = fs.readFileSync(path.join(fixtureDir, 'expected.ts')).toString()
      expect(format(resultCode)).toEqual(format(expected))

      result.dispose()
    })
  })
})
