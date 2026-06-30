const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

// Monorepo root — two levels up from apps/member-app/
const monorepoRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(__dirname)

// ── MONOREPO: tell Metro where to find workspace packages ──────────────────
config.watchFolders = [
  ...config.watchFolders,
  monorepoRoot,
]

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Keep hierarchical lookup ON
config.resolver.disableHierarchicalLookup = false

// ── WEB: Fix import.meta issue ─────────────────────────────────────────────
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
}

// ── NATIVEWIND v4 ─────────────────────────────────────────────────────────
module.exports = withNativeWind(config, {
  input: './global.css',
})