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

// Pricing tiers — same figures as the investor blueprint's revenue-model
// section, restated as public pricing rather than internal unit economics.
export const PRICING_TIERS = [
  {
    name: 'Community',
    range: 'Up to 2,000 members',
    price: 'KES 10,000',
    period: '/month',
    description: 'For a single-branch SACCO getting off desktop software.',
    featured: false,
    features: [
      'Member app, admin portal, both included',
      'M-Pesa deposits & disbursements',
      'Loan underwriting & guarantor management',
      'SASRA Form 1–3 generation',
      'Standard support',
    ],
  },
  {
    name: 'Growth',
    range: '2,000–15,000 members',
    price: 'KES 45,000',
    period: '/month',
    description: 'For a SACCO running real loan volume and a collections desk.',
    featured: true,
    features: [
      'Everything in Community',
      'Collections workbench & PAR reporting',
      'Loan restructuring workflows',
      'Dividend declaration with four-eyes control',
      'Priority support',
    ],
  },
  {
    name: 'Scale',
    range: '15,000+ members',
    price: 'KES 150,000',
    period: '/month',
    description: 'For a multi-branch SACCO with its own payroll partners.',
    featured: false,
    features: [
      'Everything in Growth',
      'Employer payroll check-off',
      'Dedicated onboarding & migration support',
      'A named account manager',
    ],
  },
] as const

export const PRICING_ADDONS = [
  { name: 'Fleet management', price: 'from KES 3,000/mo' },
  { name: 'Payroll check-off module', price: 'from KES 6,000/mo' },
  { name: 'Produce advances (agri)', price: 'from KES 5,000/mo' },
  { name: 'Housing project management', price: 'from KES 10,000/mo' },
] as const

export const ONBOARDING_STEPS = [
  {
    step: '01',
    title: 'Apply',
    body: 'Tell us your member count, sector, and licence category (DT / NWDT / Commissioner-only). We confirm fit in one call.',
  },
  {
    step: '02',
    title: 'Migrate',
    body: 'We import members, savings balances, loan books and guarantor records from whatever you run today — spreadsheet or legacy core.',
  },
  {
    step: '03',
    title: 'Configure',
    body: 'Loan products, savings types, approval thresholds and your M-Pesa paybill get set up against your actual by-laws, not a generic default.',
  },
  {
    step: '04',
    title: 'Train & go live',
    body: 'Admin staff are trained on the portal; members get the app. Your SACCO decides the cutover date.',
  },
] as const

export const SACCO_FAQ = [
  {
    q: 'Does SaccoSphere hold our members’ money?',
    a: 'No. Deposits move directly from a member’s M-Pesa into your SACCO’s own paybill; disbursements move from your own B2C wallet to the member. SaccoSphere never touches the money in between — only the record.',
  },
  {
    q: 'Can we migrate from our existing system?',
    a: 'Yes. Members, savings balances, loan books, guarantor records and dividend history import from a spreadsheet or your legacy core as part of onboarding.',
  },
  {
    q: 'What if we’re not SASRA-licensed yet?',
    a: 'The platform supports all three licence categories — DT, NWDT, and Commissioner-registered-only. FOSA (withdrawable savings) features are gated to DT tenants automatically; everything else works regardless.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'A single-branch SACCO with clean records is typically live within two to four weeks. Multi-branch migrations from a legacy core take longer — we scope this on the first call.',
  },
] as const

export const MEMBER_FAQ = [
  {
    q: 'Is my money safe with SaccoSphere?',
    a: 'SaccoSphere never holds your deposits — your money moves directly between your own M-Pesa and your SACCO’s own paybill. What SaccoSphere runs is the record-keeping underneath your SACCO, not a wallet of its own.',
  },
  {
    q: 'Can I see more than one SACCO in the app?',
    a: 'Yes — if you’re a member of more than one SACCO on the network, your savings, loans and dividends across all of them show in one portfolio.',
  },
  {
    q: 'My SACCO isn’t on the network yet. What do I do?',
    a: 'Point your SACCO’s board to our SACCOs page. Bringing a SACCO onto the network is typically a two-to-four-week process, not a core-banking migration project.',
  },
  {
    q: 'Do I need a smartphone?',
    a: 'The app needs a smartphone, but deposits can be made by dialing your SACCO’s paybill directly from any phone’s M-Pesa menu, app or not.',
  },
] as const
