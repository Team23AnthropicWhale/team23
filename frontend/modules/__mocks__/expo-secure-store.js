let _store = {};

const SecureStore = {
  getItemAsync:    jest.fn(key => Promise.resolve(_store[key] ?? null)),
  setItemAsync:    jest.fn((key, val) => { _store[key] = val; return Promise.resolve(); }),
  deleteItemAsync: jest.fn(key => { delete _store[key]; return Promise.resolve(); }),
  // Test helpers
  _reset:  () => { _store = {}; },
  _dump:   () => ({ ..._store }),
  _has:    key => Object.prototype.hasOwnProperty.call(_store, key),
};

module.exports = SecureStore;
