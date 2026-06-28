import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native'

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
const BORDER_MID = 'rgba(0,0,0,0.13)'

interface MpesaStkPushModalProps {
  visible: boolean
  saccoName: string
  amount: number
  purpose: 'SAVING_DEPOSIT' | 'LOAN_REPAYMENT'
  phoneNumber: string
  platformFee: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function MpesaStkPushModal({
  visible,
  saccoName,
  amount,
  purpose,
  platformFee,
  phoneNumber,
  isPending,
  onConfirm,
  onCancel,
}: MpesaStkPushModalProps) {
  const totalDeducted = amount + platformFee
  const purposeLabel = purpose === 'LOAN_REPAYMENT' ? 'Loan repayment' : 'Contribution'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: SURFACE,
            borderRadius: 20,
            width: '100%',
            maxWidth: 340,
            overflow: 'hidden',
          }}
        >
          {/* M-Pesa Header */}
          <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 12 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: '#00a550',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>M</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: INK }}>Confirm payment</Text>
            <Text style={{ fontSize: 11, color: INK_MUTED, marginTop: 2 }}>via M-Pesa STK Push</Text>
          </View>

          {/* Divider */}
          <View style={{ height: 0.5, backgroundColor: BORDER }} />

          {/* Payment details */}
          <View style={{ padding: 18 }}>
            <View style={{ backgroundColor: SURFACE2, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <PaymentRow label="To" value={saccoName} />
              <PaymentRow label="Type" value={purposeLabel} />
              <PaymentRow
                label="Amount"
                value={`KES ${amount.toLocaleString()}`}
                valueStyle={{ color: INK, fontWeight: '600' }}
              />
              <PaymentRow label="Platform fee (2%)" value={`KES ${platformFee}`} />
              <View
                style={{
                  borderTopWidth: 0.5,
                  borderTopColor: BORDER,
                  marginTop: 4,
                  paddingTop: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: INK }}>Total deducted</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: BRAND_MINT,
                  }}
                >
                  KES {totalDeducted.toLocaleString()}
                </Text>
              </View>
              <PaymentRow label="From" value={phoneNumber} />
            </View>

            {/* Info box */}
            <View
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.06)',
                borderLeftWidth: 3,
                borderLeftColor: '#2563EB',
                borderRadius: 8,
                padding: 10,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: '#1E3A5F', lineHeight: 16 }}>
                A push prompt will appear on your phone. Enter your M-Pesa PIN to confirm.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isPending}
              activeOpacity={0.8}
              style={{
                backgroundColor: BRAND_VIOLET,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                marginBottom: 8,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                  Send M-Pesa prompt →
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isPending}
              style={{ alignItems: 'center', paddingVertical: 6 }}
            >
              <Text style={{ color: INK_MUTED, fontSize: 11 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function PaymentRow({
  label,
  value,
  valueStyle,
}: {
  label: string
  value: string
  valueStyle?: any
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
      }}
    >
      <Text style={{ fontSize: 11, color: INK_MUTED }}>{label}</Text>
      <Text style={[{ fontSize: 11, color: INK_SOFT }, valueStyle]}>{value}</Text>
    </View>
  )
}
