import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { SafeAreaView, Edge } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

type Props = {
  children: ReactNode
  /** Screen background colour. Defaults to the active theme's background. */
  background?: string
  /** Safe-area edges to apply. Defaults to bottom + sides (top is usually handled by content padding). */
  edges?: Edge[]
  /** Extra style merged into the scroll content container. */
  contentContainerStyle?: StyleProp<ViewStyle>
  /** Vertically centre the content when it fits (typical for auth screens). */
  centerContent?: boolean
  /** Gap kept between the focused field and the top of the keyboard. */
  bottomOffset?: number
  /** Disable scrolling (rare — only for screens that must never scroll). */
  scrollEnabled?: boolean
}

/**
 * Wraps a screen so the on-screen keyboard never covers the focused input.
 *
 * Uses `react-native-keyboard-controller`'s KeyboardAwareScrollView, which
 * tracks the IME height (works with Android 15 edge-to-edge, where
 * `windowSoftInputMode=adjustResize` is ignored) and scrolls the focused
 * TextInput above the keyboard on both platforms. `KeyboardProvider` is
 * mounted once in app/_layout.tsx.
 *
 * The themed backdrop itself comes from the single AppBackground mounted at
 * the app root — this stays transparent so that's the only background layer,
 * unless an explicit `background` colour opts out of it.
 */
export function KeyboardAwareScreen({
  children,
  background,
  edges = ['bottom', 'left', 'right'],
  contentContainerStyle,
  centerContent = true,
  bottomOffset = 24,
  scrollEnabled = true,
}: Props) {
  const inner = (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: background ?? 'transparent' }}
      edges={edges}
    >
      <KeyboardAwareScrollView
        scrollEnabled={scrollEnabled}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { flexGrow: 1 },
          centerContent && { justifyContent: 'center' },
          contentContainerStyle,
        ]}
      >
        {children}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )

  return inner
}
