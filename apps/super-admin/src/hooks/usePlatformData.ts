import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

type LiveTransaction = {
  id: string
  time: string
  member: string
  sacco: string
  type: string
  amount: number
  method: string
  status: string
}

const toLiveTransaction = (txn: {
  id: string
  date: string
  member_name?: string
  sacco_name: string
  txn_type: string
  amount: number
  payment_method: string
  status: string
}): LiveTransaction => ({
  id: txn.id,
  time: new Date(txn.date).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
  member: txn.member_name ?? '—',
  sacco: txn.sacco_name,
  type: txn.txn_type.replace(/_/g, ' '),
  amount: txn.amount,
  method: txn.payment_method,
  status: txn.status,
})

export function usePlatformOverview() {
  return useQuery({
    queryKey: QueryKeys.platformOverview(),
    queryFn: api.superAdmin.getDashboard,
    staleTime: STALE_TIMES.platformOverview,
    refetchInterval: 60_000,
  })
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['revenue-chart'],
    queryFn: api.superAdmin.getRevenueChart,
    staleTime: 300_000, // 5 minutes
  })
}

export function useTopSaccos() {
  return useQuery({
    queryKey: ['top-saccos'],
    queryFn: api.superAdmin.getTopSaccos,
    staleTime: 60_000, // 1 minute
  })
}

export function usePlatformAlerts() {
  return useQuery({
    queryKey: ['platform-alerts'],
    queryFn: api.superAdmin.getPlatformAlerts,
    staleTime: 30_000, // 30 seconds
  })
}

export function useAllSaccos(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: QueryKeys.allSaccos(filters),
    queryFn: () => api.superAdmin.getSaccos(filters),
    staleTime: 60_000, // 1 minute
  })
}

export function useSaccoDetail(id: string) {
  return useQuery({
    queryKey: QueryKeys.superSaccoDetail(id),
    queryFn: () => api.superAdmin.getSacco(id),
    refetchInterval: 30_000,
  })
}

export function useAMLFlags() {
  return useQuery({
    queryKey: QueryKeys.amlFlags(),
    queryFn: api.superAdmin.getAMLFlags,
  })
}

export function useKycQueue() {
  return useQuery({
    queryKey: ['kyc-queue'],
    queryFn: api.superAdmin.getKycQueue,
  })
}

export function useAllMembers(params?: { sacco?: string; search?: string }) {
  return useQuery({
    queryKey: QueryKeys.allMembers(params),
    queryFn: () => api.superAdmin.getAllMembers(params),
    staleTime: 60_000,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: api.superAdmin.getSystemHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function usePlatformLiveFeed() {
  type ApiTxn = {
    id: string
    date: string
    member_name?: string
    sacco_name: string
    txn_type: string
    amount: number
    payment_method: string
    status: string
  }

  const { data, isLoading } = useQuery({
    queryKey: QueryKeys.platformTransactions(),
    queryFn: async () => {
      const r = await api.superAdmin.getTransactions()
      return r.results.map((txn: ApiTxn) =>
        toLiveTransaction({
          id: txn.id,
          date: txn.date,
          member_name: txn.member_name,
          sacco_name: txn.sacco_name,
          txn_type: txn.txn_type,
          amount: txn.amount,
          payment_method: txn.payment_method,
          status: txn.status,
        })
      )
    },
    refetchInterval: 10_000,
  })
  return { feed: data ?? [], connected: !isLoading }
}

