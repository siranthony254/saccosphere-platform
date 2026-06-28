import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

type LiveTransaction = {
  id: string
  time: string
  member: string
  sacco: string
  type: string
  amount: number
  direction: string
  method: string
  platform_fee: number
  status: string
}

const toLiveTransaction = (txn: {
  id: string
  date: string
  member_name?: string
  sacco_name: string
  txn_type: string
  amount: number
  direction: string
  payment_method: string
  platform_fee: number
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
  direction: txn.direction,
  method: txn.payment_method,
  platform_fee: txn.platform_fee,
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

export function useAllSaccos(filters?: { status?: string; sector?: string; search?: string }) {
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

export function useSuspendSacco() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.superAdmin.suspendSacco(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeys.allSaccos() }),
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

export function usePlatformLiveFeed() {
  const { data, isLoading } = useQuery({
    queryKey: QueryKeys.platformTransactions(),
    queryFn: () =>
      api.superAdmin.getTransactions().then((r) =>
        r.results.map((txn) =>
          toLiveTransaction({
            id: txn.id,
            date: txn.date,
            member_name: txn.member_name,
            sacco_name: txn.sacco_name,
            txn_type: txn.txn_type,
            amount: txn.amount,
            direction: txn.direction,
            payment_method: txn.payment_method,
            platform_fee: txn.platform_fee,
            status: txn.status,
          })
        )
      ),
    refetchInterval: 10_000,
  })
  return { feed: data ?? [], connected: !isLoading }
}
