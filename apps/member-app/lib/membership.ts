import type { Membership } from '@saccosphere/schemas'

export function isActiveMembership(membership: Pick<Membership, 'status'>) {
  return membership.status === 'active'
}

export function isPendingMembership(membership: Pick<Membership, 'status'>) {
  return membership.status === 'applied' || membership.status === 'under_review'
}

export function getActiveMemberships(memberships: Membership[] = []) {
  return memberships.filter(isActiveMembership)
}

export function getPendingMemberships(memberships: Membership[] = []) {
  return memberships.filter(isPendingMembership)
}

export function getMembershipSavings(membership: Membership) {
  return membership.bosa_balance + membership.fosa_balance
}

export function getDisplayName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Member'
}

export function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  return initials || 'ME'
}
