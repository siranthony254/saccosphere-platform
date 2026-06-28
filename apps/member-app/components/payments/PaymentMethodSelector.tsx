import { View, Text, TouchableOpacity } from 'react-native'

const BRAND_VIOLET = '#6D28D9'
const BRAND_MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'

interface PaymentMethodSelectorProps {
  title: string
  subtitle: string
  saccoName: string
  amount?: string
  mpesaFee?: number
  bankFee?: number
  onSelectMpesa: () => void
  onSelectBank: () => void
  onCancel: () => void
}

export default function PaymentMethodSelector({
  title,
  subtitle,
  saccoName,
  amount,
  mpesaFee = 0,
  bankFee = 0,
  onSelectMpesa,
  onSelectBank,
  onCancel,
}: PaymentMethodSelectorProps) {
  return (
    <View style={{ flex: 1, backgroundColor: SURFACE2 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: SURFACE,
          borderBottomWidth: 0.5,
          borderBottomColor: BORDER,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(109, 40, 217, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>{title.includes('Contribute') ? '💰' : title.includes('Loan') ? '📋' : '💳'}</Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: INK }}>{title}</Text>
        <Text style={{ fontSize: 12, color: INK_MUTED, marginTop: 4, lineHeight: 18 }}>
          {subtitle}
        </Text>
      </View>

      {/* SACCO context */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: BRAND_VIOLET,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                {saccoName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: INK }}>{saccoName}</Text>
              <Text style={{ fontSize: 10, color: INK_FAINT }}>
                {amount ? `Amount: KES ${Number(amount).toLocaleString()}` : 'Select an amount to continue'}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.6,
            color: INK_FAINT,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          Choose payment method
        </Text>

        {/* M-Pesa option */}
        <TouchableOpacity
          onPress={onSelectMpesa}
          activeOpacity={0.7}
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1.5,
            borderColor: BORDER,
            borderRadius: 16,
            padding: 18,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: '#00a550',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>M</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: INK }}>M-Pesa</Text>
            <Text style={{ fontSize: 11, color: INK_MUTED, marginTop: 2 }}>
              Pay instantly via M-Pesa STK Push
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 9, color: BRAND_MINT, fontWeight: '600' }}>
                  Instant
              {mpesaFee > 0 && <Text style={{ fontSize: 9, color: INK_FAINT }}>+ KES {mpesaFee} fee</Text>}
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ color: INK_FAINT, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Bank option */}
        <TouchableOpacity
          onPress={onSelectBank}
          activeOpacity={0.7}
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1.5,
            borderColor: BORDER,
            borderRadius: 16,
            padding: 18,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>🏦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: INK }}>Bank transfer</Text>
            <Text style={{ fontSize: 11, color: INK_MUTED, marginTop: 2 }}>
              Transfer from your bank account
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 9, color: '#D97706', fontWeight: '600' }}>
              {bankFee > 0 ? <Text style={{ fontSize: 9, color: INK_FAINT }}>+ KES {bankFee} fee</Text> : <Text style={{ fontSize: 9, color: INK_FAINT }}>No additional fee</Text>}
                  1–3 days
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ color: INK_FAINT, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel */}
      <View style={{ paddingHorizontal: 16, marginTop: 'auto', paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            backgroundColor: SURFACE3,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
