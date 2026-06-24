import { useAuthStore } from '../../store/useAuthStore'

export function PlatformSettings() {
  const { user } = useAuthStore()

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-lg font-semibold text-ink">Platform configuration</div>
          <div className="text-xs text-ink-muted">Saccosphere global configuration — super admin only</div>
        </div>
        <button className="py-2 px-6 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors">Save changes</button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Platform identity */}
        <div>
          <div className="bg-surface border border-mid rounded-[10px] p-5 mb-4">
            <div className="font-semibold text-sm text-ink mb-4">Platform identity</div>
            {[
              { label: 'Platform name', value: 'Saccosphere', editable: true },
              { label: 'CBK PSP licence no.', value: 'CBK/PSP/001/2024', editable: false },
              { label: 'ODPC registration no.', value: 'ODPC/DC/2024/001', editable: false },
              { label: 'Support email', value: 'support@saccosphere.co.ke', editable: true },
            ].map(f => (
              <div key={f.label} className="mb-3.5">
                <label className="block text-[11px] font-medium text-ink-soft mb-1">{f.label}</label>
                <input className={`w-full py-2 px-3 border border-mid rounded-lg text-[13px] outline-none ${f.editable ? 'bg-surface' : 'bg-surface-2'}`}
                  defaultValue={f.value} disabled={!f.editable} />
              </div>
            ))}
          </div>

          {/* Super admin team */}
          <div className="bg-surface border border-mid rounded-[10px] p-5">
            <div className="font-semibold text-sm text-ink mb-3.5">Super admin team</div>
            {[
              { name: `${user?.first_name ?? 'Anthony'} ${user?.last_name ?? 'Mwangi'}`, role: 'CEO', color: 'bg-violet-500' },
              { name: 'K. Muriuki', role: 'CTO', color: 'bg-mint-700' },
              { name: 'P. Njoroge', role: 'CFO', color: 'bg-blue-500' },
              { name: 'L. Wambua', role: 'Compliance officer', color: 'bg-amber-500' },
            ].map(a => (
              <div key={a.name} className="flex justify-between items-center py-2 border-b border-surface-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${a.color}`}>
                    {a.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                  </div>
                  <span className="text-[13px] text-ink-soft">{a.name}</span>
                </div>
                <span className="text-[11px] bg-violet-50 text-violet-800 py-0.5 px-2 rounded-full font-semibold">{a.role}</span>
              </div>
            ))}
            <button className="w-full mt-3 py-1.5 px-3.5 rounded-lg border border-mid bg-surface hover:bg-surface-2 text-xs cursor-pointer transition-colors">+ Invite super admin</button>
          </div>
        </div>

        {/* Global fee settings + KYC config */}
        <div>
          <div className="bg-surface border border-mid rounded-[10px] p-5 mb-4">
            <div className="font-semibold text-sm text-ink mb-4">Global fee settings</div>
            {[
              { label: 'Default transaction fee rate (%)', value: '1.0', type: 'number', step: '0.1' },
              { label: 'Minimum fee per transaction (KES)', value: '25', type: 'number' },
              { label: 'Base SACCO platform fee (KES/month)', value: '15000', type: 'number' },
              { label: 'Free trial period (days for new SACCOs)', value: '30', type: 'number' },
            ].map(f => (
              <div key={f.label} className="mb-3.5">
                <label className="block text-[11px] font-medium text-ink-soft mb-1">{f.label}</label>
                <input type={f.type} step={(f as any).step} className="w-full py-2 px-3 border border-mid rounded-lg text-[13px] outline-none" defaultValue={f.value} />
              </div>
            ))}
          </div>

          <div className="bg-surface border border-mid rounded-[10px] p-5">
            <div className="font-semibold text-sm text-ink mb-3.5">KYC & compliance settings</div>
            {[
              { label: 'Require IPRS ID verification', checked: true },
              { label: 'Auto-flag high-value transactions', checked: true },
              { label: 'CRB check on loan applications', checked: true },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-surface-2">
                <span className="text-[13px] text-ink-soft">{s.label}</span>
                <div className={`w-9 h-[22px] rounded-full relative cursor-pointer ${s.checked ? 'bg-violet-500' : 'bg-mid'}`}>
                  <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${s.checked ? 'right-[3px]' : 'left-[3px]'}`} />
                </div>
              </div>
            ))}
            <div className="mt-3.5">
              <label className="block text-[11px] font-medium text-ink-soft mb-1">AML threshold (KES)</label>
              <input type="number" className="w-full py-2 px-3 border border-mid rounded-lg text-[13px] outline-none" defaultValue="500000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
