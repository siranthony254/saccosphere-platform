import { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { SafeAreaView, Edge } from 'react-native-safe-area-context'

type Props = {
  children: ReactNode
  /** Screen background colour. */
  background?: string
  /** Safe-area edges to apply. Defaults to bottom + sides (top is usually handled by content padding). */
  edges?: Edge[]
  /** Extra style merged into the scroll content container. */
  contentContainerStyle?: StyleProp<ViewStyle>
  /** Vertically centre the content when it fits (typical for auth screens). */
  centerContent?: boolean
  /** iOS only — extra offset above the keyboard (e.g. a fixed header height). */
  keyboardVerticalOffset?: number
  /** Disable scrolling (rare — only for screens that must never scroll). */
  scrollEnabled?: boolean
}

/**
 * Wraps a screen so the on-screen keyboard never covers focused inputs.
 *
 * - Android: the window is `adjustResize` (see AndroidManifest), so the
 *   ScrollView shrinks above the keyboard and Android scrolls the focused
 *   TextInput into view automatically.
 * - iOS: `behavior="padding"` + `automaticallyAdjustKeyboardInsets` insets
 *   the content and scrolls the focused field above the keyboard.
 *
 * Use `keyboardShouldPersistTaps="handled"` semantics are built in, so tapping
 * another field while the keyboard is open focuses it instead of just
 * dismissing.
 */
export function KeyboardAwareScreen({
  children,
  background = '#06091A',
  edges = ['bottom', 'left', 'right'],
  contentContainerStyle,
  centerContent = true,
  keyboardVerticalOffset = 0,
  scrollEnabled = true,
}: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { flexGrow: 1 },
            centerContent && { justifyContent: 'center' },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
