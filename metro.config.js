const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to handle Node.js polyfills for React Native
config.resolver.alias = {
  crypto: 'react-native-get-random-values',
  stream: 'readable-stream',
  buffer: 'buffer',
  // Add more polyfills as needed
  events: 'events',
  url: 'react-native-url-polyfill',
};

// Remove the problematic getModulesRunBeforeMainModule config
// We'll handle polyfill loading in index.ts instead

// Add resolver platforms for better compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 