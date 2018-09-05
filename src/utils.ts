import ts from 'typescript'

export function isAsyncMethodDeclaration(node: ts.Node) {
  return (
    ts.isMethodDeclaration(node) &&
    node.modifiers &&
    node.modifiers[0] &&
    node.modifiers[0].kind === ts.SyntaxKind.AsyncKeyword
  )
}

export function isAsyncArrowFunc(node: ts.Node) {
  return (
    ts.isArrowFunction(node) &&
    node.modifiers &&
    node.modifiers[0] &&
    node.modifiers[0].kind === ts.SyntaxKind.AsyncKeyword
  )
}

export type Func = ts.ArrowFunction | ts.FunctionDeclaration

export function isFunc(node: ts.Node): node is Func {
  return ts.isArrowFunction(node) || ts.isFunctionDeclaration(node)
}

/**
 * find `types.model(xxx).actions` callExpression
 */
export function isActionCallExpression(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.name) &&
    node.expression.name.text === 'actions' &&
    ts.isCallExpression(node.expression.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression.expression) &&
    ts.isIdentifier(node.expression.expression.expression.name) &&
    node.expression.expression.expression.name.text === 'model' &&
    ts.isIdentifier(node.expression.expression.expression.expression) &&
    node.expression.expression.expression.expression.text === 'types'
  )
}

/**
 * relace arrowFucntion objectMethod to generator function
 */
export function remapAsyncToGenerator(
  node: Func | ts.MethodDeclaration | ts.FunctionExpression,
  context: ts.TransformationContext
) {
  function replaceAwaitKeyword(n: ts.Node): ts.Node {
    if (ts.isAwaitExpression(n)) {
      return ts.createYield(n.expression)
    }
    return ts.visitEachChild(n, replaceAwaitKeyword, context)
  }

  return ts.createFunctionExpression(
    undefined,
    ts.createToken(ts.SyntaxKind.AsteriskToken),
    undefined,
    undefined,
    node.parameters,
    undefined,
    ts.visitEachChild(node.body, replaceAwaitKeyword, context) as ts.Block
  )
}

export function convertToFlow(
  node: Func | ts.MethodDeclaration | ts.FunctionExpression,
  context: ts.TransformationContext
) {
  // wrap a flow call expression
  return ts.createCall(ts.createIdentifier('flow'), undefined, [
    remapAsyncToGenerator(node, context)
  ])
}
