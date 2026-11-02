import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'

export function EducationPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'institutions' | 'bursary'>('institutions')

  // Institution form
  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')
  const [instType, setInstType] = useState<'SCHOOL' | 'COLLEGE' | 'UNIVERSITY'>('SCHOOL')

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: institutions = [], isLoading: isInstLoading } = useQuery({
    queryKey: ['edu-institutions'],
    queryFn: () => api.education.getInstitutions(),
  })

  const { data: bursaryApps = [], isLoading: isBursaryLoading } = useQuery({
    queryKey: ['edu-bursary-apps'],
    queryFn: () => api.education.getBursaryApplications(),
  })

  // Mutations
  const registerInstMutation = useMutation({
    mutationFn: (data: any) => api.education.registerInstitution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-institutions'] })
      setInstName('')
      setInstCode('')
      setMsg('Educational institution registered (check-off subtype).')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Education Sector Pack
            <InfoTip text="Tools built for teacher and school SACCOs: school/college registration, fee loans paid straight to the institution, a bursary fund, and device financing." label="About the Education Sector Pack" />
          </div>
          <div className="text-xs text-ink-muted">
            School/College registry, term-aligned fee advances disbursed directly to institutions, ring-fenced bursary fund &amp; device financing.
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('institutions')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'institutions'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Educational Institutions ({institutions.length})
        </button>
        <button
          onClick={() => setActiveTab('bursary')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'bursary'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Bursary Fund &amp; Applications
        </button>
      </div>

      {/* TAB 1: INSTITUTIONS */}
      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink">Register Institution</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!instName || !instCode) return
                registerInstMutation.mutate({
                  name: instName,
                  code: instCode,
                  institution_type: instType,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alliance High School / University of Nairobi"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Institution Code</label>
                <input
                  type="text"
                  placeholder="e.g. SCH-0192"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full p-2 border rounded bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Type</label>
                <select
                  value={instType}
                  onChange={(e) => setInstType(e.target.value as any)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="SCHOOL">School (Primary / Secondary)</option>
                  <option value="COLLEGE">College / TVET</option>
                  <option value="UNIVERSITY">University</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={registerInstMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Institution
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Registered Institutions</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isInstLoading ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading institutions...</td></tr>
                  ) : institutions.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No institutions registered.</td></tr>
                  ) : (
                    institutions.map((i: any) => (
                      <tr key={i.id}>
                        <td className="py-2 px-3 font-mono font-bold text-violet-700">{i.code}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{i.name}</td>
                        <td className="py-2 px-3 font-bold text-ink-muted">{i.institution_type || 'SCHOOL'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BURSARY */}
      {activeTab === 'bursary' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3">
          <div className="font-bold text-base text-ink">Ring-Fenced Bursary Applications Queue</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">Applicant</th>
                  <th className="py-2 px-3">Dependant</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isBursaryLoading ? (
                  <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading applications...</td></tr>
                ) : bursaryApps.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No bursary applications.</td></tr>
                ) : (
                  bursaryApps.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2 px-3 font-semibold text-ink">{b.member_name || 'Member'}</td>
                      <td className="py-2 px-3 text-ink-muted">{b.dependant_name || 'Dependant'}</td>
                      <td className="py-2 px-3 font-bold text-violet-700">{b.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
