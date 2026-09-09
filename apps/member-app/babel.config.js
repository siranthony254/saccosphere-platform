module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', lazy: false }],
      'nativewind/babel',
    ],
    plugins: [
      // Reanimated 4 (react-native-worklets) — MUST be the last plugin.
      // Without it, release builds crash on launch ("keeps stopping").
      'react-native-worklets/plugin',
    ],
  }
}
