import { useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useMemberships } from '../../hooks/useMembership'
import SaccoSelectModal from '../../components/SaccoSelectModal'
import { getActiveMemberships, getPendingMemberships } from '../../lib/membership'

type ServiceAction = 'contribute' | 'loan' | 'statement'

const servicesList: Array<{
  action: ServiceAction
  label: string
  desc: string
  icon: string
  colorClass: string
}> = [
  {
    action: 'contribute',
    label: 'Contribute and Save',
    desc: 'Deposit savings or share capital instantly via M-Pesa STK push.',
    icon: 'C',
    colorClass: 'bg-mint-50',
  },
  {
    action: 'loan',
    label: 'Apply for a Loan',
    desc: 'Submit a loan application from an active SACCO membership.',
    icon: 'L',
    colorClass: 'bg-blue-50',
  },
  {
    action: 'statement',
    label: 'Account Statement',
    desc: 'View recent transactions, ledger entries, and statement records.',
    icon: 'S',
    colorClass: 'bg-amber-50',
  },
]

export default function ServicesScreen() {
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
      <ScrollView
        className="bg-surface2"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        <View className="px-4 py-3 bg-surface border-b border-border">
          <Text className="text-ink text-xl font-bold">Services</Text>
          <Text className="text-ink-faint text-xs mt-0.5">Pick a service, then choose the SACCO it belongs to.</Text>
        </View>

        <View className="p-3.5 pb-8">
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#10B981" />
              <Text className="text-ink-muted text-xs mt-3">Loading SACCO services...</Text>
            </View>
          ) : isError ? (
            <View className="items-center px-8 py-8 bg-surface rounded-xl border border-border">
              <Text className="text-ink-muted text-xs mb-3 text-center">Unable to load your SACCO services.</Text>
              <TouchableOpacity onPress={() => refetch()} className="bg-violet-500 rounded-xl px-4 py-2">
                <Text className="text-white text-xs font-semibold">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : activeMemberships.length === 0 ? (
            <LockedServicesState hasPending={pendingMemberships.length > 0} />
          ) : (
            <View className="bg-surface border border-border rounded-xl p-3.5">
              <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-3.5">AVAILABLE SERVICES</Text>
              {servicesList.map((service, index) => (
                <TouchableOpacity
                  key={service.action}
                  className={`flex-row items-center py-4 border-b border-border ${
                    index === servicesList.length - 1 ? 'border-b-0 pb-1' : ''
                  }`}
                  onPress={() => handleServiceSelect(service.action)}
                >
                  <View className={`w-11 h-11 rounded-xl ${service.colorClass} items-center justify-center mr-3.5`}>
                    <Text className="text-ink text-base font-bold">{service.icon}</Text>
                  </View>
                  <View className="flex-1 pr-3">
                    <Text className="text-ink text-xs font-bold">{service.label}</Text>
                    <Text className="text-ink-faint text-xs mt-0.5 leading-4">{service.desc}</Text>
                  </View>
                  <Text className="text-ink-faint text-lg font-bold">{'>'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SaccoSelectModal
        visible={pickerVisible}
        onClose={() => {
          setPickerVisible(false)
          setCurrentAction(null)
        }}
        onSelect={(slug) => {
          if (currentAction) navigateToServiceAction(currentAction, slug)
        }}
        title={currentAction === 'contribute' ? 'Make Contribution' : currentAction === 'loan' ? 'Apply for Loan' : 'Account Statement'}
        subtitle="Select an active SACCO to continue"
      />
    </>
  )
}

function LockedServicesState({ hasPending }: { hasPending: boolean }) {
  return (
    <View className="bg-surface border border-border rounded-xl p-5 items-center">
      <Text className="text-ink text-sm font-semibold mb-1 text-center">
        {hasPending ? 'Services unlock after approval' : 'No SACCO services available'}
      </Text>
      <Text className="text-ink-muted text-xs text-center leading-5 mb-5 px-4">
        {hasPending
          ? 'Your application is still under review. Once a SACCO approves you, its savings, loan, payment, and statement services will appear here.'
          : 'Join a SACCO first, then its savings, loan, payment, and statement services will appear here.'}
      </Text>
      <TouchableOpacity className="bg-violet-500 rounded-xl w-full py-3 items-center" onPress={() => router.push('/(member)/discover')}>
        <Text className="text-white text-xs font-semibold">Browse SACCOs</Text>
      </TouchableOpacity>
    </View>
  )
}

function navigateToServiceAction(action: ServiceAction, slug: string) {
  if (action === 'contribute') {
    router.push({ pathname: '/sacco/[slug]/pay', params: { slug } })
    return
  }

  if (action === 'loan') {
    router.push({ pathname: '/sacco/[slug]/loans', params: { slug } })
    return
  }

  router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })
}
