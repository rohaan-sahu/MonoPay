const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // Force Solana packages to use a CJS-compatible bs58 implementation in React Native.
  bs58: path.resolve(__dirname, "node_modules/@solana/web3.js/node_modules/bs58"),
};

module.exports = config;
