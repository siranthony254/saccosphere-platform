const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

// Monorepo root — two levels up from apps/member-app/
const monorepoRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(__dirname)

// ── MONOREPO: tell Metro where to find workspace packages ──────────────────
config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),          // app-level node_modules
  path.resolve(monorepoRoot, 'node_modules'),       // root node_modules (workspace packages)
]

// Keep hierarchical lookup ON — needed for workspace: resolution
config.resolver.disableHierarchicalLookup = false

// ── NATIVEWIND v4: must wrap last, after all other config ──────────────────
module.exports = withNativeWind(config, {
  input: './global.css',   // your Tailwind CSS entry file
})