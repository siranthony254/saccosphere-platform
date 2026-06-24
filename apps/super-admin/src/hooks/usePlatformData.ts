import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

type RevenueData = {
  saas_fees: Array<{
    sacco: string
    fee: number
    txn_fees: number
    total: number
    status: string
  }>
  arr_kes: number
  projected_12mo_kes: number
  avg_per_sacco_kes: number
}

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

const toRevenueData = (data: Record<string, unknown>): RevenueData => ({
  saas_fees: Array.isArray(data.saas_fees) ? data.saas_fees as RevenueData['saas_fees'] : [],
  arr_kes: typeof data.arr_kes === 'number' ? data.arr_kes : 0,
  projected_12mo_kes: typeof data.projected_12mo_kes === 'number' ? data.projected_12mo_kes : 0,
  avg_per_sacco_kes: typeof data.avg_per_sacco_kes === 'number' ? data.avg_per_sacco_kes : 0,
})

const toLiveTransaction = (txn: {
  id: string
  date: string
  member_name: string
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
  member: txn.member_name,
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

export function useAllSaccos(filters?: { status?: string; sector?: string; search?: string }) {
  return useQuery({
    queryKey: QueryKeys.allSaccos(filters),
    queryFn: () => api.superAdmin.getSaccos(filters),
  })
}

export function useSaccoDetail(id: string) {
  return useQuery({
    queryKey: QueryKeys.superSaccoDetail(id),
    queryFn: () => api.superAdmin.getSacco(id),
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

export function useRevenueData() {
  return useQuery({
    queryKey: QueryKeys.revenue(),
    queryFn: () => api.superAdmin.getRevenue().then(toRevenueData),
  })
}

export function usePlatformLiveFeed() {
  const { data, isLoading } = useQuery({
    queryKey: QueryKeys.platformTransactions(),
    queryFn: () => api.superAdmin.getTransactions().then((r) => r.results ? r.results.map(toLiveTransaction) : (Array.isArray(r) ? r.map(toLiveTransaction) : [])),
    refetchInterval: 10_000,
  })
  return { feed: data || [], connected: !isLoading }
}
