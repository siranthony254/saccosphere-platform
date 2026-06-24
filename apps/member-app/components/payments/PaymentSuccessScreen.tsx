import { View, Text, TouchableOpacity } from 'react-native'

const BRAND_MINT = '#10B981'
const BRAND_VIOLET = '#6D28D9'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'

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
  const purposeLabel = purpose === 'LOAN_REPAYMENT' ? 'Loan repayment' : 'Contribution'
  const isContribution = purpose === 'SAVING_DEPOSIT'

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      {/* Success ring */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: BRAND_MINT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>✓</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: INK, marginBottom: 6 }}>
        Payment successful
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        KES {amount.toLocaleString()} {isContribution ? 'contributed to' : 'repayment to'} {saccoName}.{' '}
        {newBalance !== undefined && `Your updated balance is KES ${newBalance.toLocaleString()}.`}
      </Text>

      {/* Details card */}
      <View
        style={{
          backgroundColor: SURFACE2,
          borderRadius: 14,
          padding: 14,
          width: '100%',
          marginBottom: 16,
        }}
      >
        <SuccessRow label="Amount paid" value={`KES ${amount.toLocaleString()}`} valueColor={BRAND_MINT} />
        <SuccessRow label="M-Pesa ref" value={mpesaRef} monospace />
        <SuccessRow label="Saccosphere ref" value={saccosphereRef} monospace />
        <SuccessRow label="Time" value={new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} />
        {newBalance !== undefined && (
          <SuccessRow label={`New ${saccoName} balance`} value={`KES ${newBalance.toLocaleString()}`} valueColor={BRAND_MINT} />
        )}
      </View>

      {/* Alert */}
      <View
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderLeftWidth: 3,
          borderLeftColor: BRAND_MINT,
          borderRadius: 8,
          padding: 10,
          width: '100%',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 11, color: '#064E3B', lineHeight: 16 }}>
          Your {purposeLabel.toLowerCase()} receipt has been saved. You can find it in Statements anytime.
        </Text>
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={onBackToDashboard}
        activeOpacity={0.8}
        style={{
          backgroundColor: BRAND_VIOLET,
          borderRadius: 12,
          paddingVertical: 13,
          alignItems: 'center',
          width: '100%',
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Back to dashboard</Text>
      </TouchableOpacity>

      {onViewReceipt && (
        <TouchableOpacity
          onPress={onViewReceipt}
          style={{ alignItems: 'center', paddingVertical: 8 }}
        >
          <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>View receipt</Text>
        </TouchableOpacity>
      )}
    </View>
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
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
      }}
    >
      <Text style={{ fontSize: 11, color: '#6B7280' }}>{label}</Text>
      <Text
        style={[
          { fontSize: 11, fontWeight: '600', color: valueColor || INK },
          monospace && { fontFamily: 'monospace', fontSize: 10 },
        ]}
      >
        {value}
      </Text>
    </View>
  )
}
