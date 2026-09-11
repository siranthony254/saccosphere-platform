import React from 'react'
import { StyleSheet, View } from 'react-native'

/**
 * @deprecated kept only so existing call sites keep compiling — the "deep
 * space" glow/grid it used to paint now lives in the single AppBackground
 * mounted at the app root (theme/AppBackground.tsx), so every screen gets it
 * automatically with no wrapping needed. This is now a plain pass-through;
 * new screens don't need to reach for it.
 */
export function DeepSpaceBackground({ children }: { children: React.ReactNode }) {
  return <View style={styles.content}>{children}</View>
}

const styles = StyleSheet.create({
  content: { flex: 1 },
})
