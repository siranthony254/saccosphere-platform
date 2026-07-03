import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DeepSpaceBackground } from '../DeepSpaceBackground'

const BRAND_MINT = '#10B981'
const BRAND_VIOLET = '#6D28D9'

interface PaymentSuccessScreenProps {
  amount: number
  saccoName: string
  purpose: 'SAVING_DEPOSIT' | 'LOAN_REPAYMENT'
  mpesaRef: string
  saccosphereRef: string
  newBalance?: number
  onBackToDashboard: () => void
  onViewReceipt?: () => void
}

export default function PaymentSuccessScreen({
  amount,
  saccoName,
  purpose,
  mpesaRef,
  saccosphereRef,
  newBalance,
  onBackToDashboard,
  onViewReceipt,
}: PaymentSuccessScreenProps) {
  const insets = useSafeAreaInsets()
  const purposeLabel = purpose === 'LOAN_REPAYMENT' ? 'Loan repayment' : 'Contribution'
  const isContribution = purpose === 'SAVING_DEPOSIT'

  return (
    <DeepSpaceBackground>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Success ring */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: BRAND_MINT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>✓</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 }}>
          Payment Successful
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
            paddingHorizontal: 10,
          }}
        >
          KES {amount.toLocaleString()} {isContribution ? 'contributed to' : 'repaid to'} {saccoName}.{' '}
          {newBalance !== undefined && `Your new balance is KES ${newBalance.toLocaleString()}.`}
        </Text>

        {/* Details card */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: 20,
            width: '100%',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <SuccessRow label="Amount Paid" value={`KES ${amount.toLocaleString()}`} valueColor={BRAND_MINT} />
          <SuccessRow label="M-Pesa Reference" value={mpesaRef} monospace />
          <SuccessRow label="Saccosphere Ref" value={saccosphereRef} monospace />
          <SuccessRow label="Transaction Time" value={new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} />
          {newBalance !== undefined && (
            <SuccessRow label={`New ${saccoName} Balance`} value={`KES ${newBalance.toLocaleString()}`} valueColor={BRAND_MINT} />
          )}
        </View>

        {/* Info Alert */}
        <View
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderLeftWidth: 4,
            borderLeftColor: BRAND_MINT,
            borderRadius: 12,
            padding: 14,
            width: '100%',
            marginBottom: 32,
          }}
        >
          <Text style={{ fontSize: 12, color: '#4ade80', lineHeight: 18, fontWeight: '500' }}>
            Your {purposeLabel.toLowerCase()} receipt has been generated and saved to your statements.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={onBackToDashboard}
          activeOpacity={0.8}
          style={{
            backgroundColor: BRAND_VIOLET,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            width: '100%',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Back to Dashboard</Text>
        </TouchableOpacity>

        {onViewReceipt && (
          <TouchableOpacity
            onPress={onViewReceipt}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>View Digital Receipt</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </DeepSpaceBackground>
  )
}

function SuccessRow({
  label,
  value,
  valueColor,
  monospace,
}: {
  label: string
  value: string
  valueColor?: string
  monospace?: boolean
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</Text>
      <Text
        style={[
          { fontSize: 12, fontWeight: '700', color: valueColor || '#fff' },
          monospace && { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5 },
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

