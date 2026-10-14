import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useCheckoffEmployers() {
  return useQuery({
    queryKey: ['checkoff-employers'],
    queryFn: api.saccoAdmin.getCheckoffEmployers,
  })
}

export function useCreateCheckoffEmployer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.saccoAdmin.createCheckoffEmployer>[0]) =>
      api.saccoAdmin.createCheckoffEmployer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-employers'] }),
  })
}

export function useUpdateCheckoffEmployer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.saccoAdmin.updateCheckoffEmployer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-employers'] }),
  })
}

export function useMemberEmployments(employerId: string | null) {
  return useQuery({
    queryKey: ['checkoff-employments', employerId],
    queryFn: () => api.saccoAdmin.getMemberEmployments(employerId!),
    enabled: !!employerId,
  })
}

export function useCreateMemberEmployment(employerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { membership: string; payroll_number: string; active_from: string }) =>
      api.saccoAdmin.createMemberEmployment(employerId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-employments', employerId] }),
  })
}

export function useUpdateMemberEmployment(employerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: 'ACTIVE' | 'ENDED'; active_to?: string; payroll_number?: string } }) =>
      api.saccoAdmin.updateMemberEmployment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-employments', employerId] }),
  })
}

export function useCheckoffMandates(employmentId: string | null) {
  return useQuery({
    queryKey: ['checkoff-mandates', employmentId],
    queryFn: () => api.saccoAdmin.getCheckoffMandates(employmentId!),
    enabled: !!employmentId,
  })
}

export function useCreateCheckoffMandate(employmentId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.saccoAdmin.createCheckoffMandate>[1]) =>
      api.saccoAdmin.createCheckoffMandate(employmentId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-mandates', employmentId] }),
  })
}

export function useEmployerSchedules(employerId: string | null) {
  return useQuery({
    queryKey: ['checkoff-schedules', employerId],
    queryFn: () => api.saccoAdmin.getEmployerSchedules(employerId!),
    enabled: !!employerId,
  })
}

export function useCheckoffSchedule(scheduleId: string | null) {
  return useQuery({
    queryKey: ['checkoff-schedule', scheduleId],
    queryFn: () => api.saccoAdmin.getCheckoffSchedule(scheduleId!),
    enabled: !!scheduleId,
  })
}

export function useGenerateCheckoffSchedule(employerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (period: string) => api.saccoAdmin.generateCheckoffSchedule(employerId!, period),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-schedules', employerId] }),
  })
}

export function useLockCheckoffSchedule(employerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scheduleId: string) => api.saccoAdmin.lockCheckoffSchedule(scheduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkoff-schedules', employerId] })
      qc.invalidateQueries({ queryKey: ['checkoff-schedule'] })
    },
  })
}

export function useImportCheckoffRemittance(employerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, period, bankReference }: { file: File; period?: string; bankReference?: string }) =>
      api.saccoAdmin.importCheckoffRemittance(employerId!, file, { period, bank_reference: bankReference }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-remittances', employerId] }),
  })
}

export function useRemittanceImport(id: string | null) {
  return useQuery({
    queryKey: ['checkoff-remittance', id],
    queryFn: () => api.saccoAdmin.getRemittanceImport(id!),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' || query.state.data?.status === 'PENDING' ? 3000 : false),
  })
}

export function useRemittanceImportLines(id: string | null) {
  return useQuery({
    queryKey: ['checkoff-remittance-lines', id],
    queryFn: () => api.saccoAdmin.getRemittanceImportLines(id!),
    enabled: !!id,
  })
}

export function useCheckoffVariances(params?: { reason_code?: string; status?: string }) {
  return useQuery({
    queryKey: ['checkoff-variances', params],
    queryFn: () => api.saccoAdmin.getCheckoffVariances(params),
  })
}

export function useResolveCheckoffVariance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { notes?: string; manual_schedule_line_id?: string } }) =>
      api.saccoAdmin.resolveCheckoffVariance(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkoff-variances'] }),
  })
}

export function useRemittanceTimelinessDashboard() {
  return useQuery({
    queryKey: ['checkoff-dashboard-timeliness'],
    queryFn: api.saccoAdmin.getRemittanceTimelinessDashboard,
  })
}

export function useArrearsAgeingDashboard() {
  return useQuery({
    queryKey: ['checkoff-dashboard-arrears'],
    queryFn: api.saccoAdmin.getArrearsAgeingDashboard,
  })
}
