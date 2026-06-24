const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)
const defaultResolveRequest = config.resolver.resolveRequest
const zustandRoot = path.dirname(require.resolve('zustand/package.json'))
const expoRuntimeLocationInstallShim = path.join(projectRoot, 'shims', 'expo-metro-runtime-location-install.ts')
const expoRuntimeRscShim = path.join(projectRoot, 'shims', 'expo-metro-runtime-rsc-runtime.ts')

// Add web support
config.resolver.platforms = ['ios', 'android', 'web']

// Add support for SVG files
config.resolver.assetExts.push('svg')

// Add support for more file types
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@expo/metro-runtime/rsc/runtime') {
    return {
      type: 'sourceFile',
      filePath: expoRuntimeRscShim,
    }
  }

  if (
    moduleName === './location/install' &&
    context.originModulePath.includes(`${path.sep}@expo${path.sep}metro-runtime${path.sep}`)
  ) {
    return {
      type: 'sourceFile',
      filePath: expoRuntimeLocationInstallShim,
    }
  }

  if (platform === 'web' && moduleName === 'zustand') {
    return {
      type: 'sourceFile',
      filePath: path.join(zustandRoot, 'index.js'),
    }
  }

  if (platform === 'web' && moduleName === 'zustand/vanilla') {
    return {
      type: 'sourceFile',
      filePath: path.join(zustandRoot, 'vanilla.js'),
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, {
  input: path.join(projectRoot, 'global.css'),
  configPath: path.join(projectRoot, 'tailwind.config.js'),
})
