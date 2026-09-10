import { useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMemberships } from '../../hooks/useMembership'
import SaccoSelectModal from '../../components/SaccoSelectModal'
import { getActiveMemberships, getPendingMemberships } from '../../lib/membership'

import { api } from '@saccosphere/api-client'
import { Icon, IconName } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'


type ServiceAction = 'contribute' | 'withdraw' | 'loan' | 'statement'

const servicesList: Array<{
  action: ServiceAction
  label: string
  desc: string
  icon: IconName
  color: string
}> = [
  {
    action: 'contribute',
    label: 'Contribute and Save',
    desc: 'Deposit savings or share capital instantly via M-Pesa STK push.',
    icon: 'card',
    color: 'rgba(16, 185, 129, 0.15)',
  },
  {
    action: 'withdraw',
    label: 'Withdraw Savings',
    desc: 'Send eligible savings to your M-Pesa number.',
    icon: 'withdraw',
    color: 'rgba(239, 68, 68, 0.15)',
  },
  {
    action: 'loan',
    label: 'Apply for a Loan',
    desc: 'Submit a loan application from an active SACCO membership.',
    icon: 'loan',
    color: 'rgba(59, 130, 246, 0.15)',
  },
  {
    action: 'statement',
    label: 'Account Statement',
    desc: 'View recent transactions, ledger entries, and statement records.',
    icon: 'file',
    color: 'rgba(245, 158, 11, 0.15)',
  },
  {
    action: 'dividends' as any,
    label: 'Annual Dividends',
    desc: 'View declared board dividends, gross earnings & net payouts.',
    icon: 'dividend',
    color: 'rgba(168, 85, 247, 0.15)',
  },
]

export default function ServicesScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: memberships = [], isLoading, isError, refetch, isRefetching } = useMemberships()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<ServiceAction | null>(null)

  const activeMemberships = getActiveMemberships(memberships)
  const pendingMemberships = getPendingMemberships(memberships)

  const handleServiceSelect = (action: ServiceAction) => {
    if (activeMemberships.length === 0) {
      router.push('/(member)/discover')
      return
    }

    if (activeMemberships.length === 1) {
      navigateToServiceAction(action, activeMemberships[0].sacco_slug)
      return
    }

    setCurrentAction(action)
    setPickerVisible(true)
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          style={{ backgroundColor: c.bg }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
        >
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.bg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Services</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Pick a service, then choose the SACCO it belongs to.</Text>
        </View>

        <View style={{ padding: 14, paddingBottom: 32 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator color={c.success} />
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>Loading SACCO services...</Text>
            </View>
          ) : isError ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 32, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>Unable to load your SACCO services.</Text>
              <TouchableOpacity onPress={() => refetch()} style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : activeMemberships.length === 0 ? (
            <LockedServicesState hasPending={pendingMemberships.length > 0} />
          ) : (
            <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 2, marginBottom: 14 }}>AVAILABLE SERVICES</Text>
              {servicesList.map((service, index) => (
                <TouchableOpacity
                  key={service.action}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: index === servicesList.length - 1 ? 0 : 0.5,
                    borderBottomColor: c.border,
                  }}
                  onPress={() => handleServiceSelect(service.action)}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: service.color, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Icon name={service.icon} size={22} color={c.text} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{service.label}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 }}>{service.desc}</Text>
                  </View>
                  <Icon name="arrow-right" size={18} color={c.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>

      <SaccoSelectModal
        visible={pickerVisible}
        onClose={() => {
          setPickerVisible(false)
          setCurrentAction(null)
        }}
        onSelect={(slug) => {
          if (currentAction) navigateToServiceAction(currentAction, slug)
        }}
        title={currentAction === 'contribute' ? 'Make Contribution' : currentAction === 'withdraw' ? 'Withdraw Savings' : currentAction === 'loan' ? 'Apply for Loan' : 'Account Statement'}
        subtitle="Select an active SACCO to continue"
      />
    </>
  )
}

function LockedServicesState({ hasPending }: { hasPending: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 20, alignItems: 'center' }}>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4, textAlign: 'center' }}>
        {hasPending ? 'Services unlock after approval' : 'No SACCO services available'}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 16 }}>
        {hasPending
          ? 'Your application is still under review. Once a SACCO approves you, its savings, loan, payment, and statement services will appear here.'
          : 'Join a SACCO first, then its savings, loan, payment, and statement services will appear here.'}
      </Text>
      <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 12, width: '100%', paddingVertical: 12, alignItems: 'center' }} onPress={() => router.push('/(member)/discover')}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Browse SACCOs</Text>
      </TouchableOpacity>
    </View>
  )
}

function navigateToServiceAction(action: ServiceAction, slug: string) {
  if (action === 'contribute') {
    router.push({ pathname: '/sacco/[slug]/pay', params: { slug } })
    return
  }

  if (action === 'withdraw') {
    router.push({ pathname: '/(member)/withdraw', params: { slug } } as any)
    return
  }

  if (action === 'loan') {
    router.push({ pathname: '/sacco/[slug]/loans', params: { slug } })
    return
  }

  if (action === ('dividends' as any)) {
    router.push('/dividends' as any)
    return
  }

  router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })
}
