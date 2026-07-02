const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const monorepoRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(__dirname)

// ── MONOREPO ─────────────────────────────────────────────────────────────
config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

config.resolver.disableHierarchicalLookup = false
config.resolver.unstable_enableSymlinks = true
config.resolver.unstable_enablePackageExports = false
// ── IGNORE OTHER APPS ────────────────────────────────────────────────────
config.resolver.blockList = [
  /apps[\\\/]sacco-admin[\\\/]node_modules[\\\/]\.vite/,
  /apps[\\\/]super-admin[\\\/]node_modules[\\\/]\.vite/,
  /apps[\\\/]sacco-admin[\\\/]dist/,
  /apps[\\\/]super-admin[\\\/]dist/,
  /apps[\\\/]sacco-admin[\\\/]src/,
  /apps[\\\/]super-admin[\\\/]src/,
]

// ── NATIVEWIND v4 ─────────────────────────────────────────────────────────
module.exports = withNativeWind(config, {
  input: './global.css',
})