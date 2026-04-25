let _connected = false;

const NetInfo = {
  fetch: jest.fn(() => Promise.resolve({ isConnected: _connected })),
  // Test helpers
  _setOnline:  () => { _connected = true;  },
  _setOffline: () => { _connected = false; },
};

module.exports = NetInfo;
