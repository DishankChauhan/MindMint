// Import polyfills FIRST - this is critical
require('./polyfills');

// Import Expo registration after polyfills
const { registerRootComponent } = require('expo');
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
