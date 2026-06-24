import React from 'react'
import { useAuthStore } from '../../store/useAuthStore'

export function Settings() {
  const { user } = useAuthStore()

  return (
    <div className="p-5">
      <div className="text-lg font-semibold text-ink mb-1">Configuration</div>
      <div className="text-xs text-ink-muted mb-6">Stima SACCO — configuration & policy</div>

      <div className="grid grid-cols-2 gap-5">
        {/* SACCO Profile */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="font-semibold text-sm text-ink mb-4">SACCO profile</div>
          {[
            { label: 'SACCO name', value: 'Stima SACCO', editable: true },
            { label: 'SASRA licence no.', value: 'SASRA/DT/001/2006', editable: false },
            { label: 'Sector', value: 'Energy', editable: true },
            { label: 'Support email', value: 'support@stimasacco.co.ke', editable: true },
          ].map(f => (
            <div key={f.label} className="mb-3.5">
              <label className="block text-[11px] font-medium text-ink-soft mb-1">{f.label}</label>
              <input
                className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm text-ink box-border focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                style={{ background: f.editable ? '#fff' : '#f9fafb' }}
                defaultValue={f.value}
                disabled={!f.editable}
              />
            </div>
          ))}
        </div>

        {/* Saccosphere integration */}
        <div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 mb-4">
            <div className="font-semibold text-sm text-ink mb-3.5">Saccosphere integration</div>
            {[
              { label: 'Platform status', value: '● Active & live', color: 'text-mint-600' },
              { label: 'API connection', value: 'Connected', color: 'text-mint-600' },
              { label: 'Member data sync', value: 'Real-time', color: 'text-ink' },
              { label: 'Monthly platform fee', value: 'KES 20,000', color: 'text-ink' },
              { label: 'Transaction fee rate', value: '1.0% per txn', color: 'text-ink' },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b border-surface-3 text-sm">
                <span className="text-ink-muted">{row.label}</span>
                <span className={`font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Admin team */}
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
            <div className="font-semibold text-sm text-ink mb-3.5">Admin team</div>
            {[
              { name: `${user?.first_name ?? 'Charles'} ${user?.last_name ?? 'Kariuki'}`, role: 'CEO', color: 'bg-mint-600' },
              { name: 'L. Mutua', role: 'Finance officer', color: 'bg-blue-500' },
              { name: 'S. Ngugi', role: 'Loans officer', color: 'bg-amber-500' },
            ].map(admin => (
              <div key={admin.name} className="flex justify-between items-center py-2 border-b border-surface-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${admin.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                    {admin.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <span className="text-sm text-ink-soft">{admin.name}</span>
                </div>
                <span className="text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{admin.role}</span>
              </div>
            ))}
            <button className="mt-3 py-1.5 px-3.5 rounded-lg border border-ink-faint bg-white text-xs cursor-pointer hover:bg-surface-2 transition-colors w-full">
              + Invite admin user
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 text-right">
        <button className="px-6 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors">
          Save changes
        </button>
      </div>
    </div>
  )
}