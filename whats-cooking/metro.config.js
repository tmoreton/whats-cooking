const { getDefaultConfig } = require("expo/metro-config");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

// AWS SDK v3 publishes its React Native runtime from the ESM entry point.
// Prefer that entry before CommonJS so Metro selects fetch instead of the
// Node-only HTTP handler (which depends on node:https).
config.resolver.unstable_enablePackageExports = true;
config.resolver.resolverMainFields = [
  "react-native",
  "browser",
  "module",
  "main",
];

module.exports = config;
