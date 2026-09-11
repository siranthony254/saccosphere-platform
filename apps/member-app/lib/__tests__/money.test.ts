import { formatMoney, maskedMoney, MONEY_MASK, getLoanProgress } from '../money'

describe('formatMoney', () => {
  it('formats a positive amount with KES prefix and thousands separators', () => {
    expect(formatMoney(150000)).toBe('KES 150,000')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('KES 0')
  })

  it('defaults to zero for null/undefined', () => {
    expect(formatMoney(null)).toBe('KES 0')
    expect(formatMoney(undefined)).toBe('KES 0')
  })
})

describe('maskedMoney', () => {
  it('renders the KES prefix with the mask instead of a real amount', () => {
    expect(maskedMoney()).toBe(`KES ${MONEY_MASK}`)
  })
})

describe('getLoanProgress', () => {
  it('returns 0 when amountRequested is missing, zero, or negative', () => {
    expect(getLoanProgress(undefined, 100)).toBe(0)
    expect(getLoanProgress(0, 100)).toBe(0)
    expect(getLoanProgress(-500, 100)).toBe(0)
  })

  it('computes the percentage repaid', () => {
    expect(getLoanProgress(100000, 25000)).toBe(75)
  })

  it('treats a missing balanceRemaining as fully repaid (0 outstanding)', () => {
    expect(getLoanProgress(100000, undefined)).toBe(100)
  })

  it('clamps to 100 when the balance is fully repaid or overpaid', () => {
    expect(getLoanProgress(100000, 0)).toBe(100)
    expect(getLoanProgress(100000, -500)).toBe(100)
  })
})
