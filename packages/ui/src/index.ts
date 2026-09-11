// @saccosphere/ui — shared web components (React)
// Member app uses NativeWind variants, imported directly from the app.
// Admin portals import from here.

export { Icon, type IconName, type IconProps } from './Icon'
export { AdminThemeProvider, useAdminTheme } from './theme/AdminThemeProvider'
export { AdminBackground } from './theme/AdminBackground'
export { ThemePicker } from './theme/ThemePicker'
export {
  ADMIN_THEME_PRESETS,
  DEFAULT_ADMIN_THEME,
  type AdminThemeId,
  type AdminThemePreset,
} from './theme/presets'
