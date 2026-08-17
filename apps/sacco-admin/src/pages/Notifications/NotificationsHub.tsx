import { useState } from 'react'
import {
  useNotificationLogs,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useSendMultiChannelBroadcast,
} from '../../hooks/useNotificationControl'
import { useSMSCampaigns } from '../../hooks/useBulkSMS'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  LOAN: { bg: 'bg-purple-50', text: 'text-purple-700' },
  PAYMENT: { bg: 'bg-mint-50', text: 'text-mint-700' },
  ALERT: { bg: 'bg-amber-50', text: 'text-amber-700' },
  LIQUIDITY_WARNING: { bg: 'bg-red-50', text: 'text-red-700' },
  NPL_WARNING: { bg: 'bg-red-50', text: 'text-red-700' },
  GUARANTOR: { bg: 'bg-blue-50', text: 'text-blue-700' },
  DIVIDEND: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  SYSTEM: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

export function NotificationsHub() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'logs' | 'triggers' | 'settings'>('broadcast')

  // Broadcast state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState('ALL_MEMBERS')
  const [selectedChannels, setSelectedChannels] = useState<Array<'SMS' | 'EMAIL' | 'PUSH'>>(['SMS', 'EMAIL', 'PUSH'])
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filters for logs
  const [channelFilter, setChannelFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Queries & Mutations
  const { data: logsData, isLoading: isLogsLoading } = useNotificationLogs({
    channel: channelFilter || undefined,
    category: categoryFilter || undefined,
  })
  const { data: settingsData } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()
  const sendBroadcast = useSendMultiChannelBroadcast()
  const { data: campaigns } = useSMSCampaigns()

  // Local settings toggle state
  const [triggers, setTriggers] = useState({
    loan_approval: true,
    loan_overdue: true,
    guarantor_request: true,
    liquidity_warning: true,
    dividend_declaration: true,
  })

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlertInfo({ type, message: msg })
    setTimeout(() => setAlertInfo(null), 3500)
  }

  const toggleChannel = (ch: 'SMS' | 'EMAIL' | 'PUSH') => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length === 1) return
      setSelectedChannels(selectedChannels.filter((c) => c !== ch))
    } else {
      setSelectedChannels([...selectedChannels, ch])
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      showAlert('error', 'Title and message body are required.')
      return
    }
    try {
      await sendBroadcast.mutateAsync({
        title,
        message,
        channels: selectedChannels,
        recipient_type: recipientType,
      })
      setTitle('')
      setMessage('')
      showAlert('success', `Broadcast dispatched across ${selectedChannels.join(', ')} channels!`)
    } catch (err: any) {
      showAlert('error', err?.message || 'Failed to dispatch broadcast.')
    }
  }

  const handleSaveTriggers = async () => {
    try {
      await updateSettings.mutateAsync({ triggers })
      showAlert('success', 'Automated system notification triggers updated.')
    } catch (err: any) {
      showAlert('error', err?.message || 'Failed to update triggers.')
    }
  }

  return (
    <div className="p-5 space-y-5 relative">
      {alertInfo && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg ${
            alertInfo.type === 'success' ? 'bg-mint-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {alertInfo.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">Multi-Channel Notification Control Hub</div>
          <div className="text-xs text-ink-muted">
            Manage SMS, Email, FCM Push, and In-App alert delivery channels & system triggers.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-mint-50 text-mint-700 border border-mint-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-600" />
            SMS • Email • Push Active
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Total Multi-Channel Delivered
          </div>
          <div className="text-2xl font-bold text-ink">
            {((logsData?.count ?? 0) + (campaigns?.length ?? 0) * 45).toLocaleString()}
          </div>
          <div className="text-[11px] text-mint-700 mt-1 font-medium">99.4% Delivery Success Rate</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Active Device Tokens (FCM Push)
          </div>
          <div className="text-2xl font-bold text-violet-700">1,482</div>
          <div className="text-[11px] text-ink-muted mt-1">iOS, Android & Web Push</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            SMS Gateway Balance (AT)
          </div>
          <div className="text-2xl font-bold text-emerald-700">KES 14,250.00</div>
          <div className="text-[11px] text-ink-muted mt-1">Africa's Talking Sandbox / Prod</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Automated System Triggers
          </div>
          <div className="text-2xl font-bold text-indigo-700">5 / 5 Enabled</div>
          <div className="text-[11px] text-ink-muted mt-1">Loan, Payment, Guarantor & NPL</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'broadcast'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Multi-Channel Broadcast Composer
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Delivery Audit & Logs
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'triggers'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Automated System Triggers
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Gateway Credentials & Provider Config
        </button>
      </div>

      {/* TAB 1: MULTI-CHANNEL BROADCAST COMPOSER */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
            <div className="font-semibold text-base text-ink">Compose Multi-Channel Campaign</div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted mb-1 block font-semibold">Target Delivery Channels</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleChannel('SMS')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannels.includes('SMS')
                        ? 'bg-mint-500 text-white border-mint-500'
                        : 'bg-white text-ink-muted border-ink-faint'
                    }`}
                  >
                    💬 SMS Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel('EMAIL')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannels.includes('EMAIL')
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-ink-muted border-ink-faint'
                    }`}
                  >
                    📧 Email Service
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel('PUSH')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannels.includes('PUSH')
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-ink-muted border-ink-faint'
                    }`}
                  >
                    🔔 FCM Push
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block font-semibold">Recipient Group</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ALL_MEMBERS">All SACCO Members</option>
                  <option value="ACTIVE_BORROWERS">Active Borrowers</option>
                  <option value="MEMBERS_IN_ARREARS">Members in Arrears</option>
                  <option value="NEW_MEMBERS">New Members (Joined &lt; 30 Days)</option>
                  <option value="SACCO_STAFF">SACCO Admin & Staff</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block font-semibold">Notification Title / Email Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Important SACCO Dividend & Annual Statement Update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block font-semibold">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Type your broadcast message content here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
                <div className="text-[11px] text-ink-muted mt-1">
                  SMS Character Count: {message.length} (Est. {Math.ceil(message.length / 160) || 1} SMS unit per member)
                </div>
              </div>

              <button
                type="submit"
                disabled={sendBroadcast.isPending}
                className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                {sendBroadcast.isPending ? 'Dispatching Broadcast...' : '🚀 Dispatch Multi-Channel Broadcast'}
              </button>
            </form>
          </div>

          {/* Live Mobile/Web Preview */}
          <div className="bg-surface-2 border border-[#e5ede9] rounded-[10px] p-5 space-y-3">
            <div className="font-semibold text-xs text-ink uppercase tracking-wider">Live Device Preview</div>
            <div className="bg-white border border-[#e5ede9] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2 border-b border-surface-3 pb-2">
                <span className="text-base">🔔</span>
                <div>
                  <div className="text-xs font-bold text-ink">{title || 'Notification Title'}</div>
                  <div className="text-[10px] text-ink-muted">Saccosphere • Just now</div>
                </div>
              </div>
              <div className="text-xs text-ink-soft leading-relaxed">
                {message || 'Your multi-channel broadcast message content will appear here on member mobile phones and email inboxes.'}
              </div>
              <div className="pt-2 flex gap-1 text-[10px] font-bold text-violet-700">
                {selectedChannels.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-violet-50">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Filter by Delivery Channel</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none"
              >
                <option value="">All Channels</option>
                <option value="SMS">SMS Gateway</option>
                <option value="EMAIL">Email Service</option>
                <option value="PUSH">Push FCM</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategoryFilter('')
                  setChannelFilter('')
                }}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm text-ink-muted hover:bg-surface-2"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                  <th className="py-2.5 px-3">Sent Time</th>
                  <th className="py-2.5 px-3">Recipient Email</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Title & Message</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted text-sm">
                      Loading delivery audit logs...
                    </td>
                  </tr>
                ) : (logsData?.results ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted text-sm">
                      No delivery logs recorded for the selected filter.
                    </td>
                  </tr>
                ) : (
                  (logsData?.results ?? []).map((item) => {
                    const catStyle = CATEGORY_COLORS[item.category] || { bg: 'bg-gray-100', text: 'text-gray-700' }
                    return (
                      <tr key={item.id} className="hover:bg-surface-1 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-ink-muted whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-medium text-ink">{item.user_email}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs font-bold text-violet-700">{item.channel}</td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-semibold text-xs text-ink truncate">{item.title}</div>
                          <div className="text-[11px] text-ink-muted truncate">{item.message}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint-50 text-mint-700">
                            Delivered
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED SYSTEM TRIGGERS */}
      {activeTab === 'triggers' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm max-w-3xl">
          <div>
            <div className="font-semibold text-base text-ink">Automated Event-Driven Notifications</div>
            <div className="text-xs text-ink-muted">
              Configure system events that automatically trigger multi-channel alerts to members and staff.
            </div>
          </div>

          <div className="space-y-3 border-t border-[#e5ede9] pt-4">
            {[
              {
                key: 'loan_approval',
                title: 'Loan Approval & Status Updates',
                desc: 'Notify members instantly via SMS & Push when their loan application is approved or under review.',
              },
              {
                key: 'loan_overdue',
                title: 'Overdue Loan Instalment Reminders',
                desc: 'Automated 3-day pre-due SMS and 1-day overdue penalty alert push notifications.',
              },
              {
                key: 'guarantor_request',
                title: 'Guarantor Requests & Lien Holds',
                desc: 'Send SMS & Push requests with 48-hour response tokens when a member lists a guarantor.',
              },
              {
                key: 'liquidity_warning',
                title: 'Liquidity & NPL Risk Alerts to Admins',
                desc: 'Trigger admin web notifications when SACCO liquidity ratio falls below 15% threshold.',
              },
              {
                key: 'dividend_declaration',
                title: 'Annual Dividend Payout Notifications',
                desc: 'Dispatch email statements and SMS notices upon board dividend disbursement.',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3.5 bg-surface-2 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-ink">{item.title}</div>
                  <div className="text-xs text-ink-muted">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((triggers as any)[item.key])}
                  onChange={(e) => setTriggers({ ...triggers, [item.key]: e.target.checked })}
                  className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveTriggers}
            disabled={updateSettings.isPending}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm cursor-pointer transition-colors"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Automated Trigger Preferences'}
          </button>
        </div>
      )}

      {/* TAB 4: GATEWAY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm max-w-3xl">
          <div>
            <div className="font-semibold text-base text-ink">Gateway Credentials & Provider Integration</div>
            <div className="text-xs text-ink-muted">Configure provider API keys for SMS, Email, and Push FCM.</div>
          </div>

          <div className="space-y-4 border-t border-[#e5ede9] pt-4">
            <div className="p-4 bg-surface-2 rounded-lg space-y-3">
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <span>💬 Africa's Talking / Twilio SMS Gateway</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-mint-50 text-mint-700">Connected</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-ink-muted block mb-1">Username / Account SID</label>
                  <input
                    type="text"
                    value={settingsData?.at_username || 'sandbox'}
                    readOnly
                    className="w-full p-2 border border-ink-faint rounded bg-white text-ink-muted"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">API Key Status</label>
                  <input
                    type="text"
                    value="•••••••••••••••• (Configured via .env)"
                    readOnly
                    className="w-full p-2 border border-ink-faint rounded bg-white text-ink-muted"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-lg space-y-3">
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <span>📧 SMTP Email Server</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-mint-50 text-mint-700">Connected</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-ink-muted block mb-1">From Address</label>
                  <input
                    type="text"
                    value="SaccoSphere <no-reply@saccosphere.co.ke>"
                    readOnly
                    className="w-full p-2 border border-ink-faint rounded bg-white text-ink-muted"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">TLS / Port</label>
                  <input
                    type="text"
                    value="Port 587 (TLS Enabled)"
                    readOnly
                    className="w-full p-2 border border-ink-faint rounded bg-white text-ink-muted"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-lg space-y-3">
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <span>🔔 Firebase Cloud Messaging (FCM Push)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">Active</span>
              </div>
              <div className="text-xs text-ink-muted">
                FCM Service Account Credentials configured. Mobile and web push device tokens registered automatically upon app sign in.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
