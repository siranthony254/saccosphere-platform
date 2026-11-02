import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function GovernanceManagement() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'meetings' | 'zones' | 'elections'>('meetings')

  // Meeting form state
  const [meetingType, setMeetingType] = useState<'AGM' | 'SGM' | 'ADM'>('AGM')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('2026-11-15T09:00')
  const [meetingVenue, setMeetingVenue] = useState('SACCO HQ Auditorium')
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null)

  // Motion state
  const [motionTitle, setMotionTitle] = useState('')
  const [motionType, setMotionType] = useState('DIVIDEND_RATE')
  const [votesFor, setVotesFor] = useState('')
  const [votesAgainst, setVotesAgainst] = useState('')
  const [votesPassed, setVotesPassed] = useState(true)

  // Election form state
  const [electionType, setElectionType] = useState<'BOARD' | 'SUPERVISORY_COMMITTEE' | 'DELEGATE' | 'RECALL_VOTE'>('BOARD')
  const [electionTitle, setElectionTitle] = useState('')
  const [selectedElection, setSelectedElection] = useState<any | null>(null)
  // No default — there's no settings-level delegate term length, so the
  // certifying admin must type a real date explicitly every time, never
  // submit a pre-filled placeholder unedited.
  const [certifyTermEnd, setCertifyTermEnd] = useState('')

  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  // Queries
  const { data: meetings = [], isLoading: isMeetingsLoading } = useQuery({
    queryKey: ['governance-meetings'],
    queryFn: () => api.governance.getMeetings(),
  })

  const { data: zones = [], isLoading: isZonesLoading } = useQuery({
    queryKey: ['governance-zones'],
    queryFn: () => api.governance.getZones(),
  })

  const { data: elections = [], isLoading: isElectionsLoading } = useQuery({
    queryKey: ['governance-elections'],
    queryFn: () => api.governance.getElections(),
  })

  // Meeting Motions & Quorum
  const { data: quorumData } = useQuery({
    queryKey: ['meeting-quorum', selectedMeeting?.id],
    queryFn: () => (selectedMeeting?.id ? api.governance.getQuorum(selectedMeeting.id) : null),
    enabled: Boolean(selectedMeeting?.id),
    refetchInterval: 10_000,
  })

  const { data: motions = [] } = useQuery({
    queryKey: ['meeting-motions', selectedMeeting?.id],
    queryFn: () => (selectedMeeting?.id ? api.governance.getMotions(selectedMeeting.id) : []),
    enabled: Boolean(selectedMeeting?.id),
  })

  const { data: electionResults } = useQuery({
    queryKey: ['election-results', selectedElection?.id],
    queryFn: () => (selectedElection?.id ? api.governance.getElectionResults(selectedElection.id) : null),
    enabled: Boolean(selectedElection?.id),
  })

  // Mutations
  const createMeetingMutation = useMutation({
    mutationFn: (data: { meeting_type: 'AGM' | 'SGM' | 'ADM'; title: string; scheduled_at: string; venue?: string }) =>
      api.governance.createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings'] })
      setMeetingTitle('')
      setStatusMsg('Meeting scheduled successfully.')
      setTimeout(() => setStatusMsg(null), 4000)
    },
    onError: (err: any) => setStatusMsg(err?.message || 'Failed to schedule meeting.'),
  })

  const openMeetingMutation = useMutation({
    mutationFn: (id: string) => api.governance.openMeeting(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings'] })
      setSelectedMeeting(res)
      setStatusMsg('Meeting opened. Member check-ins active.')
    },
  })

  const closeMeetingMutation = useMutation({
    mutationFn: (id: string) => api.governance.closeMeeting(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings'] })
      setSelectedMeeting(res)
      setStatusMsg('Meeting closed.')
    },
  })

  const createMotionMutation = useMutation({
    mutationFn: (data: { meetingId: string; motion_type: string; title: string }) =>
      api.governance.createMotion(data.meetingId, { motion_type: data.motion_type, title: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-motions', selectedMeeting?.id] })
      setMotionTitle('')
    },
  })

  const recordVoteMutation = useMutation({
    mutationFn: (data: { motionId: string; votes_for: number; votes_against: number; passed: boolean }) =>
      api.governance.recordMotionVote(data.motionId, {
        votes_for: data.votes_for,
        votes_against: data.votes_against,
        votes_abstain: 0,
        passed: data.passed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-motions', selectedMeeting?.id] })
    },
  })

  const certifyMotionMutation = useMutation({
    mutationFn: (motionId: string) => api.governance.certifyMotion(motionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-motions', selectedMeeting?.id] })
      setStatusMsg('Motion queued for AGM resolution certification (maker-checker).')
    },
  })

  const createElectionMutation = useMutation({
    mutationFn: (data: { election_type: 'BOARD' | 'SUPERVISORY_COMMITTEE' | 'DELEGATE' | 'RECALL_VOTE'; title: string }) =>
      api.governance.createElection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-elections'] })
      setElectionTitle('')
      setStatusMsg('Secret ballot election created in DRAFT state.')
      setTimeout(() => setStatusMsg(null), 4000)
    },
  })

  const openVotingMutation = useMutation({
    mutationFn: (id: string) => api.governance.openVoting(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['governance-elections'] })
      setSelectedElection(res)
      setStatusMsg('Secret ballot voting opened.')
    },
  })

  const closeVotingMutation = useMutation({
    mutationFn: (id: string) => api.governance.closeVoting(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['governance-elections'] })
      setSelectedElection(res)
      setStatusMsg('Voting closed & synchronous ballot tally completed.')
    },
  })

  const certifyElectionMutation = useMutation({
    mutationFn: (data: { id: string; termEnd?: string }) =>
      api.governance.certifyElection(data.id, data.termEnd ? { term_end: data.termEnd } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-elections'] })
      setStatusMsg('Election results queued for certification (maker-checker).')
    },
  })

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">AGM, Delegate &amp; Secret Ballot Governance</div>
          <div className="text-xs text-ink-muted">
            Statutory general meetings, quorum tracking, certified resolutions, electoral zones &amp; anonymous secret-ballot elections.
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'meetings'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          General Meetings ({meetings.length})
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'zones'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Electoral Zones &amp; Delegates
        </button>
        <button
          onClick={() => setActiveTab('elections')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'elections'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Secret-Ballot Elections
        </button>
      </div>

      {/* TAB 1: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Schedule Meeting</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!meetingTitle) return
                createMeetingMutation.mutate({
                  meeting_type: meetingType,
                  title: meetingTitle,
                  scheduled_at: new Date(meetingDate).toISOString(),
                  venue: meetingVenue,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Meeting Type</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as any)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                >
                  <option value="AGM">AGM (Annual General Meeting)</option>
                  <option value="SGM">SGM (Special General Meeting)</option>
                  <option value="ADM">ADM (Annual Delegates Meeting — Delegate Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Title</label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Annual General Meeting"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Scheduled Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Venue</label>
                <input
                  type="text"
                  placeholder="Venue or Virtual Link"
                  value={meetingVenue}
                  onChange={(e) => setMeetingVenue(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={createMeetingMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Schedule Meeting
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Meetings &amp; Quorum Live Tracker</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Meeting Title</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Scheduled At</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isMeetingsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">Loading meetings...</td>
                    </tr>
                  ) : meetings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">No scheduled meetings.</td>
                    </tr>
                  ) : (
                    meetings.map((m: any) => (
                      <tr key={m.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{m.title}</td>
                        <td className="py-2.5 px-3 uppercase text-ink-soft">{m.meeting_type}</td>
                        <td className="py-2.5 px-3 font-bold text-violet-700">{m.status}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : '—'}</td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedMeeting(m)}
                            className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                          {m.status === 'NOTICE_SENT' && (
                            <button
                              onClick={() => openMeetingMutation.mutate(m.id)}
                              className="px-2 py-1 bg-mint-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Open Meeting
                            </button>
                          )}
                          {m.status === 'OPEN' && (
                            <button
                              onClick={() => closeMeetingMutation.mutate(m.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedMeeting && (
              <div className="border-t border-[#e5ede9] pt-4 space-y-4 bg-surface-2 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-sm text-ink">{selectedMeeting.title} ({selectedMeeting.meeting_type})</div>
                    <div className="text-ink-muted">Status: {selectedMeeting.status}</div>
                  </div>
                  {quorumData && (
                    <div className="text-right">
                      <div className="font-bold text-violet-700">Attendance: {quorumData.attendee_count ?? 0} / {quorumData.eligible_voter_count ?? 0} (quorum {quorumData.quorum_fraction_required != null ? `${(quorumData.quorum_fraction_required * 100).toFixed(0)}%` : '—'})</div>
                      <div className="text-[10px] text-ink-muted">Quorum Met: {quorumData.quorum_met ? 'YES' : 'NO'}</div>
                    </div>
                  )}
                </div>

                {/* Motions List */}
                <div className="space-y-3">
                  <div className="font-bold text-xs text-ink">Meeting Motions &amp; Show-of-Hands Resolutions</div>
                  <div className="space-y-2">
                    {motions.map((mo: any) => (
                      <div key={mo.id} className="p-3 bg-white rounded border space-y-2 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>{mo.title} ({mo.motion_type})</span>
                          <span className="text-violet-700 font-bold">{mo.status}</span>
                        </div>
                        {mo.status === 'PROPOSED' && (
                          <div className="flex gap-2 items-center pt-1 border-t">
                            <input
                              type="number"
                              placeholder="Votes For"
                              value={votesFor}
                              onChange={(e) => setVotesFor(e.target.value)}
                              className="w-24 p-1 border rounded text-xs"
                            />
                            <input
                              type="number"
                              placeholder="Votes Against"
                              value={votesAgainst}
                              onChange={(e) => setVotesAgainst(e.target.value)}
                              className="w-24 p-1 border rounded text-xs"
                            />
                            <label className="flex items-center gap-1 text-[10px] text-ink-muted">
                              <input type="checkbox" checked={votesPassed} onChange={(e) => setVotesPassed(e.target.checked)} />
                              Chair declares: passed
                            </label>
                            <button
                              onClick={() =>
                                recordVoteMutation.mutate({
                                  motionId: mo.id,
                                  votes_for: Number(votesFor),
                                  votes_against: Number(votesAgainst),
                                  passed: votesPassed,
                                })
                              }
                              className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded"
                            >
                              Record Vote Tally
                            </button>
                          </div>
                        )}
                        {mo.status === 'VOTED' && (
                          <button
                            onClick={() => certifyMotionMutation.mutate(mo.id)}
                            className="px-3 py-1 bg-mint-600 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Queue Certification (Maker-Checker)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Motion */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="New Motion Title..."
                      value={motionTitle}
                      onChange={(e) => setMotionTitle(e.target.value)}
                      className="flex-1 p-2 border border-ink-faint rounded text-xs bg-white"
                    />
                    <select
                      value={motionType}
                      onChange={(e) => setMotionType(e.target.value)}
                      className="p-2 border border-ink-faint rounded text-xs bg-white"
                    >
                      <option value="DIVIDEND_RATE">DIVIDEND_RATE</option>
                      <option value="INTEREST_RATE">INTEREST_RATE</option>
                      <option value="BYLAW_AMENDMENT">BYLAW_AMENDMENT</option>
                      <option value="GENERIC">GENERIC</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!motionTitle) return
                        createMotionMutation.mutate({ meetingId: selectedMeeting.id, motion_type: motionType, title: motionTitle })
                      }}
                      className="px-3 py-1.5 bg-violet-600 text-white font-bold text-xs rounded"
                    >
                      Propose Motion
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ZONES */}
      {activeTab === 'zones' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Electoral Zones &amp; Delegate Roster</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                  <th className="py-2 px-3">Zone Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Active Delegates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isZonesLoading ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-ink-muted">Loading electoral zones...</td>
                  </tr>
                ) : zones.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-ink-muted">No electoral zones configured.</td>
                  </tr>
                ) : (
                  zones.map((z: any) => (
                    <tr key={z.id} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-semibold text-ink">{z.name}</td>
                      <td className="py-2.5 px-3 text-ink-muted">{z.description || 'Electoral Zone'}</td>
                      <td className="py-2.5 px-3 font-bold text-violet-700">{z.delegate_count ?? 0} Delegates</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ELECTIONS */}
      {activeTab === 'elections' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Create Secret-Ballot Election</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!electionTitle) return
                createElectionMutation.mutate({ election_type: electionType, title: electionTitle })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Election Type</label>
                <select
                  value={electionType}
                  onChange={(e) => setElectionType(e.target.value as any)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                >
                  <option value="BOARD">Board of Directors Election</option>
                  <option value="SUPERVISORY_COMMITTEE">Supervisory Committee</option>
                  <option value="DELEGATE">Zone Delegate Election</option>
                  <option value="RECALL_VOTE">Delegate Recall Vote</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Election Title</label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Board Election"
                  value={electionTitle}
                  onChange={(e) => setElectionTitle(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createElectionMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Create Secret Ballot Election
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Elections &amp; Secret Ballot Tally</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isElectionsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">Loading elections...</td>
                    </tr>
                  ) : elections.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">No elections created.</td>
                    </tr>
                  ) : (
                    elections.map((el: any) => (
                      <tr key={el.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{el.title}</td>
                        <td className="py-2.5 px-3 uppercase text-ink-soft">{el.election_type}</td>
                        <td className="py-2.5 px-3 font-bold text-violet-700">{el.status}</td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedElection(el)}
                            className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                          {el.status === 'CANDIDATES_FINALIZED' && (
                            <button
                              onClick={() => openVotingMutation.mutate(el.id)}
                              className="px-2 py-1 bg-mint-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Open Voting
                            </button>
                          )}
                          {el.status === 'VOTING_OPEN' && (
                            <button
                              onClick={() => closeVotingMutation.mutate(el.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Close &amp; Tally
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedElection && (
              <div className="border-t border-[#e5ede9] pt-4 space-y-3 bg-surface-2 p-4 rounded-xl text-xs">
                <div className="font-bold text-sm text-ink">{selectedElection.title} ({selectedElection.status})</div>
                <div className="text-ink-muted">Note: Voter record is separated from ballot contents to guarantee 100% secret ballot privacy.</div>

                {selectedElection.status === 'TALLYING' && (
                  <div className="pt-2 border-t space-y-2">
                    {selectedElection.election_type === 'DELEGATE' && (
                      <>
                        <label className="text-ink-muted block">Delegate term end date (required — no settings default exists)</label>
                        <input
                          type="text"
                          placeholder="e.g. 2028-06-30T23:59:59Z"
                          value={certifyTermEnd}
                          onChange={(e) => setCertifyTermEnd(e.target.value)}
                          className="p-1.5 border rounded font-mono text-xs w-full bg-white"
                        />
                      </>
                    )}
                    <button
                      onClick={() => certifyElectionMutation.mutate({ id: selectedElection.id, termEnd: certifyTermEnd || undefined })}
                      disabled={selectedElection.election_type === 'DELEGATE' && !certifyTermEnd}
                      className="px-3 py-1.5 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50"
                    >
                      Queue Certification (Maker-Checker)
                    </button>
                  </div>
                )}

                {electionResults && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="font-bold text-ink">Certified Aggregate Election Results:</div>
                    <div className="font-mono bg-white p-2 rounded border">
                      {JSON.stringify(electionResults, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
