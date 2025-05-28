// Essential polyfills for React Native + Solana compatibility
// This runs before any other module loads

// Import crypto polyfill first using require
require('react-native-get-random-values');

// Import URL polyfill
require('react-native-url-polyfill/auto');

// Import Buffer
const { Buffer } = require('buffer');

// Import setImmediate polyfill
require('setimmediate');

// Set up global Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Set up global process if not available
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    version: '',
    versions: {},
    platform: 'react-native',
  };
}

// Set up global crypto
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

// Ensure crypto.getRandomValues is available
if (typeof global.crypto.getRandomValues === 'undefined') {
  const { getRandomValues } = require('react-native-get-random-values');
  global.crypto.getRandomValues = getRandomValues;
}

// Basic FormData polyfill
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map();
    }
    
    append(key, value) {
      if (!this._data.has(key)) {
        this._data.set(key, []);
      }
      this._data.get(key).push(value);
    }
    
    get(key) {
      const values = this._data.get(key);
      return values ? values[0] : null;
    }
    
    getAll(key) {
      return this._data.get(key) || [];
    }
    
    has(key) {
      return this._data.has(key);
    }
    
    delete(key) {
      this._data.delete(key);
    }
    
    set(key, value) {
      this._data.set(key, [value]);
    }
  };
}

// Console log to verify polyfills loaded
console.log('✅ MindMint polyfills loaded successfully'); 