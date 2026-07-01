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


// ── IGNORE VITE TEMP FILES FROM OTHER APPS ────────────────
// Without this, Metro tries to crawl sacco-admin and super-admin
// Vite cache folders and throws ENOENT errors
config.watchFolders = [
  monorepoRoot,
]

config.resolver.blockList = [
  // Ignore Vite cache from admin portals
  /apps[\\\/]sacco-admin[\\\/]node_modules[\\\/]\.vite/,
  /apps[\\\/]super-admin[\\\/]node_modules[\\\/]\.vite/,
  // Ignore dist folders
  /apps[\\\/]sacco-admin[\\\/]dist/,
  /apps[\\\/]super-admin[\\\/]dist/,
  // Ignore admin app source — Metro shouldn't bundle these
  /apps[\\\/]sacco-admin[\\\/]src/,
  /apps[\\\/]super-admin[\\\/]src/,
]

// ── WEB: enable import.meta support for expo-router and web bundles ─────
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
    },
  }),
}

// ── NATIVEWIND v4 ─────────────────────────────────────────────────────────
module.exports = withNativeWind(config, {
  input: './global.css',
})