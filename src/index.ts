import ts from 'typescript'
import { convertToFlow, isActionCallExpression, isAsyncMethodDeclaration, isFunc } from './utils'

export interface Options {
  mstPackage: string
}

const flowFuncName = 'flow'

const defaultOptions: Options = {
  mstPackage: 'mobx-state-tree'
}

function createTransformer(_options: Partial<Options>) {
  const options = { ...defaultOptions, ..._options }
  const mstPackageName = options.mstPackage

  const transformer: ts.TransformerFactory<ts.SourceFile> = context => {
    const visitor: ts.Visitor = node => {
      if (ts.isSourceFile(node)) {
        return ts.visitEachChild(node, visitor, context)
      }

      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier.getText() === `'${mstPackageName}'`) {
          const flowImportDeclarationNode = ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(
              undefined,
              ts.createNamedImports([
                ts.createImportSpecifier(undefined, ts.createIdentifier(flowFuncName))
              ])
            ),
            ts.createLiteral(mstPackageName)
          )
          return [node, flowImportDeclarationNode]
        }
        return node
      }

      if (isActionCallExpression(node) && node.arguments && isFunc(node.arguments[0])) {
        const actionsDef = node.arguments[0]
        const funcBodyVisitor: ts.Visitor = n => {
          /*
           * **Example in:**
           * const o = {
           *   async getCount() {
           *     self.count = await api.getCount()
           *   }
           * }
           *
           * **Example out:**
           * const o = {
           *   getCount: flow(function* () {
           *     self.count = yield api.getCount()
           *   }
           * }
           */
          if (ts.isMethodDeclaration(n) && isAsyncMethodDeclaration(n)) {
            const methodName = (<ts.Identifier>n.name).text
            return ts.createPropertyAssignment(methodName, convertToFlow(n, context))
          }

          /*
           * **Example in:**
           * const o = {
           *   getCount: async function() {
           *     self.count = await api.getCount()
           *   }
           * }
           *
           * **Example out:**
           * const o = {
           *   getCount: flow(function* () {
           *     self.count = yield api.getCount()
           *   }
           * }
           */

          if (
            ts.isPropertyAssignment(n) &&
            ts.isFunctionExpression(n.initializer) &&
            n.initializer.modifiers &&
            n.initializer.modifiers[0].kind === ts.SyntaxKind.AsyncKeyword
          ) {
            const methodName = (<ts.Identifier>n.name).text
            return ts.createPropertyAssignment(methodName, convertToFlow(n.initializer, context))
          }

          /*
           * **Example in:**
           * const o = {
           *   getCount: async () => {
           *     self.count = await api.getCount()
           *   }
           * }
           *
           * **Example out:**
           * const o = {
           *   getCount: flow(function* () {
           *     self.count = yield api.getCount()
           *   }
           * }
           */

          if (
            ts.isPropertyAssignment(n) &&
            ts.isArrowFunction(n.initializer) &&
            n.initializer.modifiers &&
            n.initializer.modifiers[0].kind === ts.SyntaxKind.AsyncKeyword
          ) {
            const methodName = (<ts.Identifier>n.name).text
            return ts.createPropertyAssignment(methodName, convertToFlow(n.initializer, context))
          }

          return ts.visitEachChild(n, funcBodyVisitor, context)
        }

        const clonedNode = ts.getMutableClone(node)

        clonedNode.arguments = ts.createNodeArray([
          ts.visitEachChild(actionsDef, funcBodyVisitor, context)
        ])

        return clonedNode
      }

      return ts.visitEachChild(node, visitor, context)
    }
    return node => ts.visitEachChild(node, visitor, context)
  }

  return transformer
}

module.exports = createTransformer
