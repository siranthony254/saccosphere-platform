import { useAuthStore } from '../store/useAuthStore'

export type Permission = 
  | 'view_members'
  | 'manage_members'
  | 'view_loans'
  | 'approve_loans'
  | 'disburse_loans'
  | 'view_applications'
  | 'review_applications'
  | 'view_kyc'
  | 'review_kyc'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_roles'
  | 'view_audit_logs'
  | 'import_members'
  | 'view_external_guarantors'
  | 'review_external_guarantors'

// SACCO admin permissions based on backend IsSaccoAdmin permission
const SACCO_ADMIN_PERMISSIONS: Set<Permission> = new Set([
  'view_members',
  'manage_members',
  'view_loans',
  'approve_loans',
  'disburse_loans',
  'view_applications',
  'review_applications',
  'view_kyc',
  'review_kyc',
  'view_reports',
  'manage_settings',
  'view_audit_logs',
  'import_members',
  'view_external_guarantors',
  'review_external_guarantors',
])

// Super admin permissions (includes role management)
const SUPER_ADMIN_PERMISSIONS: Set<Permission> = new Set([
  ...SACCO_ADMIN_PERMISSIONS,
  'manage_roles',
])

export function usePermissions() {
  const { user } = useAuthStore()

  const isSaccoAdmin = user?.sacco_id != null
  const isSuperAdmin = user?.role === 'superadmin'

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    
    // Super admins have all permissions
    if (isSuperAdmin) {
      return SUPER_ADMIN_PERMISSIONS.has(permission)
    }
    
    // SACCO admins have SACCO-specific permissions
    if (isSaccoAdmin) {
      return SACCO_ADMIN_PERMISSIONS.has(permission)
    }
    
    return false
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }

  return {
    isSaccoAdmin,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
