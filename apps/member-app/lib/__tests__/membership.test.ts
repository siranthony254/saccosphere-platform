import type { Membership } from '@saccosphere/schemas'
import {
  isActiveMembership,
  isPendingMembership,
  getActiveMemberships,
  getPendingMemberships,
  getMembershipSavings,
  getDisplayName,
  getInitials,
} from '../membership'

function membership(overrides: Partial<Membership>): Membership {
  return {
    id: 'm1',
    sacco_id: 's1',
    sacco_slug: 'test-sacco',
    sacco_name: 'Test Sacco',
    sacco_color: '#000000',
    status: 'active',
    bosa_balance: 0,
    fosa_balance: 0,
    ...overrides,
  } as Membership
}

describe('isActiveMembership', () => {
  it('is true only for active status', () => {
    expect(isActiveMembership({ status: 'active' })).toBe(true)
    expect(isActiveMembership({ status: 'applied' })).toBe(false)
    expect(isActiveMembership({ status: 'withdrawn' })).toBe(false)
  })
})

describe('isPendingMembership', () => {
  it('is true for applied or under_review status', () => {
    expect(isPendingMembership({ status: 'applied' })).toBe(true)
    expect(isPendingMembership({ status: 'under_review' })).toBe(true)
    expect(isPendingMembership({ status: 'active' })).toBe(false)
  })
})

describe('getActiveMemberships / getPendingMemberships', () => {
  const memberships = [
    membership({ id: 'a', status: 'active' }),
    membership({ id: 'b', status: 'applied' }),
    membership({ id: 'c', status: 'withdrawn' }),
    membership({ id: 'd', status: 'under_review' }),
  ]

  it('filters to only active memberships', () => {
    expect(getActiveMemberships(memberships).map((m) => m.id)).toEqual(['a'])
  })

  it('filters to only pending memberships', () => {
    expect(getPendingMemberships(memberships).map((m) => m.id)).toEqual(['b', 'd'])
  })

  it('defaults to an empty array when no memberships are passed', () => {
    expect(getActiveMemberships()).toEqual([])
    expect(getPendingMemberships()).toEqual([])
  })
})

describe('getMembershipSavings', () => {
  it('sums BOSA and FOSA balances', () => {
    expect(getMembershipSavings(membership({ bosa_balance: 10000, fosa_balance: 2500 }))).toBe(12500)
  })
})

describe('getDisplayName', () => {
  it('joins first and last name', () => {
    expect(getDisplayName('Jane', 'Doe')).toBe('Jane Doe')
  })

  it('falls back to "Member" when both names are missing', () => {
    expect(getDisplayName(undefined, undefined)).toBe('Member')
  })

  it('handles a single missing name', () => {
    expect(getDisplayName('Jane', undefined)).toBe('Jane')
  })
})

describe('getInitials', () => {
  it('returns uppercase initials', () => {
    expect(getInitials('jane', 'doe')).toBe('JD')
  })

  it('falls back to "ME" when both names are missing', () => {
    expect(getInitials(undefined, undefined)).toBe('ME')
  })
})
