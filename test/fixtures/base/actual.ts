import { types } from 'mobx-state-tree'
const api = {
  getCount(...args: any[]) {
    return Promise.resolve(1)
  }
}
const store = types.model({ count: 0 }).actions(self => ({
  async getCount1() {
    self.count = await api.getCount()
  },
  getCount2: async () => {
    self.count = await api.getCount()
  },
  getCount3: async function() {
    self.count = await api.getCount()
  },
  getCount4: async function(info: any) {
    self.count = await api.getCount(info)
  }
}))
export default store.create()
