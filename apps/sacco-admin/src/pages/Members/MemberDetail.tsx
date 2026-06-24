import { useParams, useNavigate } from 'react-router-dom'
import { useMemberDetail } from '../../hooks/useMembers'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: member, isLoading } = useMemberDetail(id!)

  if (isLoading) return <div className="p-5 text-ink-muted">Loading member...</div>
  if (!member) return <div className="p-5">Member not found.</div>

  return (
    <div className="p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-ink-muted text-sm hover:text-ink transition-colors">← Members</button>
        <span className="text-ink-faint">|</span>
        <div>
          <div className="text-lg font-semibold text-ink">{member.first_name} {member.last_name}</div>
          <div className="text-xs text-ink-muted">{member.member_number} · Active since {member.joined_at ? new Date(member.joined_at).getFullYear() : '—'}</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-mint-50 rounded-[10px] p-4 mb-4 flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-mint-600 flex items-center justify-center text-lg font-semibold text-white shrink-0">
          {member.first_name[0]}{member.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-mint-800">{member.first_name} {member.last_name}</div>
          <div className="text-[11px] text-mint-700">{member.email} · {member.phone} · ID: {member.national_id}</div>
          <div className="flex gap-1.5 mt-1.5">
            {[
              { text: member.membership_status, bg: 'bg-mint-50', color: 'text-mint-700' },
              { text: `KYC ${member.kyc_status}`, bg: 'bg-blue-50', color: 'text-blue-700' },
              { text: member.saccosphere_id, bg: 'bg-violet-50', color: 'text-violet-700' },
            ].map((b, i) => (
              <span key={i} className={`${b.bg} ${b.color} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>{b.text}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-4">
        {[
          { title: 'Savings', stats: [
            { label: 'BOSA savings', val: `KES ${member.bosa_balance.toLocaleString()}` },
            { label: 'FOSA savings', val: `KES ${member.fosa_balance.toLocaleString()}` },
            { label: 'Share capital', val: `KES ${member.share_capital.toLocaleString()}` },
          ]},
          { title: 'Loans', stats: [
            { label: 'Active loans', val: member.active_loans_count.toString() },
            { label: 'Outstanding', val: `KES ${member.active_loans_kes.toLocaleString()}` },
            { label: 'Repayment rate', val: `${member.repayment_rate_pct}%` },
          ]},
          { title: 'Contributions', stats: [
            { label: 'Monthly amount', val: `KES ${member.monthly_contribution.toLocaleString()}` },
            { label: 'KYC status', val: member.kyc_status },
            { label: 'Last active', val: member.last_active ? new Date(member.last_active).toLocaleDateString() : '—' },
          ]},
        ].map(card => (
          <div key={card.title} className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
            <div className="font-semibold text-sm text-ink mb-2.5">{card.title}</div>
            {card.stats.map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-surface-3">
                <span className="text-xs text-ink-muted">{s.label}</span>
                <span className="text-xs font-semibold text-ink">{s.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}