import { flow, types } from 'mobx-state-tree'

const api = {
  getCount(...args: any[]) {
    return Promise.resolve(1)
  }
}
const store = types.model({ count: 0 }).actions(self => ({
  getCount1: flow(function* () {
    self.count = yield api.getCount()
  }),
  getCount2: flow(function* () {
    self.count = yield api.getCount()
  }),
  getCount3: flow(function* () {
    self.count = yield api.getCount()
  }),
  getCount4: flow(function* (info: any) {
    self.count = yield api.getCount(info)
  })
}))
export default store.create()
