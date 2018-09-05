# ts-plugin-mst-async-action

[![npm](https://img.shields.io/npm/v/ts-plugin-mst-async-action.svg)](https://www.npmjs.com/package/ts-plugin-mst-async-action)
[![travis-ci](https://travis-ci.com/newraina/ts-plugin-mst-async-action.svg?branch=master)](https://travis-ci.com/newraina/ts-plugin-mst-async-action)

Converts mobx-state-tree async actions to flows. inspired by [babel-plugin-mobx-async-action](https://github.com/Strate/babel-plugin-mobx-async-action)

## Example

### In

```ts
import { types } from 'mobx-state-tree'

const store = types.model({ count: 0 }).actions(self => ({
  async getCount() {
    self.count = await api.getCount()
  }
}))
```

### Out

```ts
import { types } from 'mobx-state-tree'
import { flow } from 'mobx-state-tree'

const store = types.model({ count: 0 }).actions(self => ({
  getCount: flow(function*() {
    self.count = yield api.getCount()
  })
}))
```

## Usage

### With ts-loader

```js
// webpack.config.js
const tsMstAsyncActionPluginFactory = require('ts-plugin-mst-async-action')

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: () => ({
            before: [tsMstAsyncActionPluginFactory(/** options */)]
          }),
          compilerOptions: {
            module: 'es2015'
          }
        }
      }
    ]
  }
  // ...
}
```

### Options

- mstPackage `string`

  if you use wrapper for "mobx-state-tree" package, you can pass it's name to plugin

  default: `'mobx-state-tree'`
