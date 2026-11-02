import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { StepUpModal } from '../../components/auth/StepUpModal'

export function SectorManagement() {
  const queryClient = useQueryClient()
  const [selectedSaccoId, setSelectedSaccoId] = useState('')
  const [newSector, setNewSector] = useState('AGRICULTURE')
  const [reclassifyReason, setReclassifyReason] = useState('')
  const [showStepUp, setShowStepUp] = useState(false)
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: saccosData } = useQuery({
    queryKey: ['superadmin-saccos'],
    queryFn: () => api.superAdmin.getSaccos(),
  })
  const saccos = saccosData?.results ?? []

  const { data: allModules = [] } = useQuery({
    queryKey: ['sector-modules'],
    queryFn: () => api.superAdmin.getSectorModules(),
  })

  const { data: saccoModulesData } = useQuery({
    queryKey: ['sacco-modules', selectedSaccoId],
    queryFn: () => (selectedSaccoId ? api.superAdmin.getSaccoModules(selectedSaccoId) : null),
    enabled: Boolean(selectedSaccoId),
  })

  // Mutations
  const overrideMutation = useMutation({
    mutationFn: (data: { saccoId: string; moduleCode: string; enabled: boolean; reason: string }) =>
      api.superAdmin.updateSaccoModuleOverride(data.saccoId, data.moduleCode, { enabled: data.enabled, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-modules', selectedSaccoId] })
      setMsg('Tenant module override updated.')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  const resetOverrideMutation = useMutation({
    mutationFn: (data: { saccoId: string; moduleCode: string }) =>
      api.superAdmin.deleteSaccoModuleOverride(data.saccoId, data.moduleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-modules', selectedSaccoId] })
      setMsg('Module override removed; reset to sector default.')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  const reclassifyMutation = useMutation({
    mutationFn: (data: { saccoId: string; sector: string; reason: string; verification_code?: string }) =>
      api.superAdmin.reclassifySacco(data.saccoId, { sector: data.sector, reason: data.reason, verification_code: data.verification_code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-saccos'] })
      queryClient.invalidateQueries({ queryKey: ['sacco-modules', selectedSaccoId] })
      setReclassifyReason('')
      setShowStepUp(false)
      setStepUpError(null)
      setMsg('Sector reclassification queued for maker-checker approval (ActionType.SECTOR_RECLASSIFICATION).')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => {
      if (err?.status === 428) {
        setStepUpError(err?.message || 'Incorrect verification code.')
        setShowStepUp(true)
        return
      }
      setMsg(err?.message || 'Reclassification failed.')
    },
  })

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Sector Feature Gating &amp; Reclassification"
        subtitle="Manage tenant sector confirmation, default module packs, and individual module overrides"
      />

      {msg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Select Tenant SACCO" className="md:col-span-1">
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-ink-muted mb-1 block">SACCO</label>
              <select
                value={selectedSaccoId}
                onChange={(e) => setSelectedSaccoId(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="">Select a SACCO...</option>
                {saccos.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedSaccoId && (
              <div className="border-t pt-3 space-y-3">
                <div className="font-bold text-ink">Reclassify Confirmed Sector</div>
                <div>
                  <label className="text-ink-muted block mb-1">Target Sector</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  >
                    <option value="AGRICULTURE">AGRICULTURE (P26 Pack)</option>
                    <option value="TRANSPORT">TRANSPORT (P27 Pack)</option>
                    <option value="EDUCATION">EDUCATION (P28 Pack)</option>
                    <option value="HEALTHCARE">HEALTHCARE (P29 Pack)</option>
                    <option value="OTHER">OTHER (Core Only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-ink-muted block mb-1">Audit Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Reason for sector reclassification..."
                    value={reclassifyReason}
                    onChange={(e) => setReclassifyReason(e.target.value)}
                    className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                    required
                  />
                </div>

                <button
                  onClick={() => {
                    if (!reclassifyReason) return
                    setShowStepUp(true)
                  }}
                  disabled={!reclassifyReason || reclassifyMutation.isPending}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded cursor-pointer"
                >
                  Initiate Sector Reclassification
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Resolved Sector Modules &amp; Overrides" className="md:col-span-2">
          {selectedSaccoId && saccoModulesData ? (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-surface-2 p-3 rounded border">
                <div>
                  <div className="font-bold text-ink">Confirmed Sector: {saccoModulesData.sector?.code || 'OTHER'}</div>
                  <div className="text-ink-muted">Confirmed: {saccoModulesData.sector?.confirmed ? 'YES' : 'NO (Unconfirmed / Fallback)'}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted font-semibold bg-surface-2">
                      <th className="py-2 px-3">Module Code</th>
                      <th className="py-2 px-3">Module Name</th>
                      <th className="py-2 px-3">Resolved Source</th>
                      <th className="py-2 px-3">Enabled</th>
                      <th className="py-2 px-3 text-right">Override Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ede9]">
                    {(saccoModulesData.modules ?? allModules).map((m: any) => (
                      <tr key={m.code} className="hover:bg-surface-1">
                        <td className="py-2 px-3 font-mono font-bold text-violet-700">{m.code}</td>
                        <td className="py-2 px-3 font-medium text-ink">{m.name}</td>
                        <td className="py-2 px-3 font-semibold text-ink-muted">{m.source || 'SECTOR_DEFAULT'}</td>
                        <td className="py-2 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${m.enabled ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'}`}>
                            {m.enabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              const reason = prompt('Enter override justification reason:')
                              if (reason) overrideMutation.mutate({ saccoId: selectedSaccoId, moduleCode: m.code, enabled: !m.enabled, reason })
                            }}
                            className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer"
                          >
                            Toggle Override
                          </button>
                          {m.source === 'OVERRIDE' && (
                            <button
                              onClick={() => resetOverrideMutation.mutate({ saccoId: selectedSaccoId, moduleCode: m.code })}
                              className="px-2 py-1 bg-gray-100 text-ink-muted font-bold text-[10px] rounded cursor-pointer"
                            >
                              Reset Default
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink-muted p-4">Select a SACCO on the left to view its resolved sector pack modules and manage overrides.</div>
          )}
        </Card>
      </div>

      <StepUpModal
        isOpen={showStepUp}
        title="Authorize Sector Reclassification"
        description="Reclassifying a tenant sector changes its default feature packs and requires super-admin step-up security authorization."
        error={stepUpError}
        onClose={() => { setShowStepUp(false); setStepUpError(null) }}
        onSubmitCode={(code) => {
          if (selectedSaccoId && newSector && reclassifyReason) {
            reclassifyMutation.mutate({ saccoId: selectedSaccoId, sector: newSector, reason: reclassifyReason, verification_code: code })
          }
        }}
      />
    </div>
  )
}
