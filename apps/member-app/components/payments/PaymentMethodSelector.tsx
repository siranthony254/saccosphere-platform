import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DeepSpaceBackground } from '../DeepSpaceBackground'

const BRAND_VIOLET = '#6D28D9'
const BRAND_MINT = '#10B981'

interface PaymentMethodSelectorProps {
  title: string
  subtitle: string
  saccoName: string
  amount?: string
  mpesaFee?: number
  bankFee?: number
  mpesaDisabled?: boolean
  bankDisabled?: boolean
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
  mpesaDisabled = false,
  bankDisabled = false,
  onSelectMpesa,
  onSelectBank,
  onCancel,
}: PaymentMethodSelectorProps) {
  const insets = useSafeAreaInsets()

  return (
    <DeepSpaceBackground>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Header Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: 'rgba(109, 40, 217, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(109, 40, 217, 0.2)',
            }}
          >
            <Text style={{ fontSize: 24 }}>{title.includes('Contribute') ? '💰' : title.includes('Loan') ? '📋' : '💳'}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{title}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 20 }}>
            {subtitle}
          </Text>
        </View>

        {/* Amount Summary Card */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: BRAND_VIOLET,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                  {saccoName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{saccoName}</Text>
                <Text style={{ fontSize: 12, color: BRAND_MINT, fontWeight: '700', marginTop: 2 }}>
                  {amount ? `KES ${Number(amount).toLocaleString()}` : '—'}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 16,
              marginLeft: 4,
              textTransform: 'uppercase',
            }}
          >
            Select Payment Method
          </Text>

          {/* M-Pesa Option */}
          <TouchableOpacity
            onPress={onSelectMpesa}
            disabled={mpesaDisabled}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: mpesaDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              opacity: mpesaDisabled ? 0.4 : 1,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: '#00a550',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>M</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>M-Pesa</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Instant STK Push
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, color: BRAND_MINT, fontWeight: '800', textTransform: 'uppercase' }}>
                    {mpesaDisabled ? 'Unavailable' : 'Instant'}
                  </Text>
                </View>
                {!mpesaDisabled && mpesaFee > 0 && (
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>+ KES {mpesaFee} fee</Text>
                )}
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          {/* Bank Option */}
          <TouchableOpacity
            onPress={onSelectBank}
            disabled={bankDisabled}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: bankDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              opacity: bankDisabled ? 0.4 : 1,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.2)',
              }}
            >
              <Text style={{ fontSize: 24 }}>🏦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Bank Transfer</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Direct bank deposit
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase' }}>
                    {bankDisabled ? 'Unavailable' : '1-2 Days'}
                  </Text>
                </View>
                {!bankDisabled && (
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                    {bankFee > 0 ? `+ KES ${bankFee} fee` : 'Zero fee'}
                  </Text>
                )}
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer / Cancel */}
        <View style={{ paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 24 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', tracking: 1.5 }}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

