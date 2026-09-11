import { useAdminTheme } from './AdminThemeProvider'

/**
 * Drop into any Settings page to let the signed-in admin pick their
 * background theme. Selecting one updates AdminThemeProvider's context
 * immediately, so every screen — this one included — reflects it right away.
 */
export function ThemePicker() {
  const { themeId, setThemeId, presets } = useAdminTheme()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {presets.map((p) => {
        const active = p.id === themeId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setThemeId(p.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
              active
                ? 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-50'
                : 'border-[#e5ede9] hover:border-violet-300'
            }`}
          >
            <span
              className="w-8 h-8 rounded-full shrink-0 border border-black/10"
              style={{
                background: p.glow
                  ? `linear-gradient(135deg, ${p.swatch}, ${p.swatch}CC)`
                  : '#E2E8F0',
              }}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{p.label}</span>
              <span className="block text-xs text-ink-muted truncate">{p.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
