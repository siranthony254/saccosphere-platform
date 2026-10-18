// Market-context figures (not live-fetched — no endpoint serves these).
// Source: SASRA Sacco Supervision Annual Report 2024. Keep these in sync
// with the investor blueprint if that document's figures are ever revised.
export const MARKET_CONTEXT = {
  regulatedMembers: '7.39M',
  regulatedAssets: 'KES 1.07T',
  regulatedSaccos: '355+',
  sourceLabel: 'SASRA, 2024',
}

// Mirrors accounts.models.Sacco.Sector exactly — these are real filter
// values the backend's ?sector= query param matches against.
export const SECTORS = [
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'OTHER', label: 'Other' },
] as const
