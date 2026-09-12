import { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../../theme/ThemeProvider'
import { hapticSuccess } from '../../../../lib/haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

// Masks all but the last 3 digits, regardless of the phone number's length
// or prefix (+254..., 254..., 07...) — a fixed-shape regex only matched one
// exact 10-digit format and silently rendered anything else unmasked.
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 3) return phone
  return `•••• ${digits.slice(-3)}`
}

export default function LoanDisbursed() {
  const { slug, amount, phone, ref, mpesaRef, date } = useLocalSearchParams<{
    slug: string;
    amount?: string;
    phone?: string;
    ref?: string;
    mpesaRef?: string;
    date?: string
  }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()

  useEffect(() => {
    hapticSuccess()
  }, [])

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 20,
        alignItems: 'center',
      }}
      style={{ backgroundColor: c.bg }}
    >
      {/* Success Icon */}
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Icon name="cash" size={40} color="#10b981" />
      </View>

      {/* Title */}
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Loan approved!</Text>
      <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
        Your loan has been approved and sent to your M-Pesa account.
      </Text>

      {/* Disbursement Card — mint-600 is a fixed brand colour, safe for
          white text regardless of theme. */}
      <View style={{ borderRadius: 16, padding: 20, marginBottom: 16, width: '100%', alignItems: 'center', backgroundColor: '#059669' }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Amount received
        </Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '700', marginBottom: 8 }}>
          KES {amount ? Number(amount).toLocaleString() : '---'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
          Sent to {phone ? maskPhone(phone) : '---'}
        </Text>
      </View>

      {/* Receipt */}
      <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 14, width: '100%', marginBottom: 24 }}>
        {[
          { label: 'Loan reference', value: ref || 'Pending' },
          { label: 'M-Pesa reference', value: mpesaRef || 'Pending' },
          { label: 'Disbursement time', value: date || 'Pending' },
          { label: 'Status', value: 'Completed' },
        ].map((row) => (
          <View
            key={row.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}
          >
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{row.label}</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Info Box */}
      <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 24 }}>
        <Text style={{ color: c.success, fontSize: 12, lineHeight: 18 }}>
          Your repayment schedule and first instalment date are available in the Loans tab.
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={{ width: '100%', backgroundColor: c.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
        onPress={() => router.replace(`/sacco/${slug}`)}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Back to dashboard</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  )
}
