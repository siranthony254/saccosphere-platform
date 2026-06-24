import type { PlatformOverview, SuperAdminSacco, AMLFlag } from '@saccosphere/schemas'

export const MOCK_PLATFORM_OVERVIEW: PlatformOverview = {
  total_saccos: 47, active_saccos: 45,
  total_members: 284102, total_members_on_app: 108200,
  transaction_volume_mtd_kes: 182000000,
  platform_revenue_mtd_kes: 1820000,
  saas_revenue_mtd_kes: 940000,
  transaction_fees_mtd_kes: 880000,
  kyc_verified_pct: 91.2,
  aml_flags_open: 4,
  system_alerts: 2,
}

export const MOCK_ALL_SACCOS: SuperAdminSacco[] = [
  { id:'sacco-001', slug:'stima-sacco', name:'Stima SACCO', sector:'Energy', initials:'ST', color:'#0070ba', sasra_reg_no:'SASRA/DT/001/2006', status:'active', member_count:4821, members_on_app:1284, transaction_volume_mtd_kes:38200000, platform_fee_kes:20000, fee_status:'paid', api_connected:true, health:'healthy', joined_platform_at:'2022-02-01T00:00:00Z' },
  { id:'sacco-002', slug:'unaitas-sacco', name:'Unaitas SACCO', sector:'Community', initials:'UN', color:'#16a085', sasra_reg_no:'SASRA/DT/080/2010', status:'active', member_count:62440, members_on_app:24800, transaction_volume_mtd_kes:94100000, platform_fee_kes:45000, fee_status:'paid', api_connected:true, health:'healthy', joined_platform_at:'2022-06-01T00:00:00Z' },
  { id:'sacco-003', slug:'teachers-sacco', name:'Teachers SACCO', sector:'Education', initials:'TS', color:'#7c3aed', sasra_reg_no:'SASRA/DT/022/2008', status:'active', member_count:28012, members_on_app:9800, transaction_volume_mtd_kes:28900000, platform_fee_kes:30000, fee_status:'paid', api_connected:true, health:'healthy', joined_platform_at:'2022-03-01T00:00:00Z' },
  { id:'sacco-004', slug:'kenya-police-sacco', name:'Kenya Police SACCO', sector:'Government', initials:'KP', color:'#c0392b', sasra_reg_no:'SASRA/DT/045/2012', status:'active', member_count:35200, members_on_app:8400, transaction_volume_mtd_kes:11400000, platform_fee_kes:32000, fee_status:'overdue', api_connected:false, health:'critical', joined_platform_at:'2023-01-01T00:00:00Z' },
  { id:'sacco-005', slug:'imarika-sacco', name:'Imarika SACCO', sector:'Community', initials:'IK', color:'#2980b9', sasra_reg_no:'SASRA/DT/091/2015', status:'active', member_count:18003, members_on_app:4200, transaction_volume_mtd_kes:9600000, platform_fee_kes:15000, fee_status:'paid', api_connected:true, health:'warning', joined_platform_at:'2023-04-01T00:00:00Z' },
]

export const MOCK_AML_FLAGS: AMLFlag[] = [
  { id:'flag-001', member_name:'M. Ochieng', sacco_name:'Unaitas SACCO', transaction_ref:'SS-TXN-00090100', flag_reason:'Unusual transaction frequency — 12 transactions in 24 hours', amount:85000, risk_level:'medium', status:'open', flagged_at:new Date(Date.now()-3600000).toISOString() },
  { id:'flag-002', member_name:'J. Ndungu', sacco_name:'Imarika SACCO', transaction_ref:'SS-TXN-00090090', flag_reason:'Large single cash-equivalent deposit above KES 500,000 threshold', amount:650000, risk_level:'high', status:'under_review', flagged_at:new Date(Date.now()-86400000).toISOString() },
  { id:'flag-003', member_name:'L. Kiprotich', sacco_name:'Teachers SACCO', transaction_ref:'SS-TXN-00090050', flag_reason:'Identity document mismatch detected during KYC re-verification', amount:0, risk_level:'medium', status:'open', flagged_at:new Date(Date.now()-172800000).toISOString() },
  { id:'flag-004', member_name:'P. Mwangi', sacco_name:'Stima SACCO', transaction_ref:'SS-TXN-00089990', flag_reason:'Multiple large transfers to same external account over 7 days', amount:320000, risk_level:'medium', status:'open', flagged_at:new Date(Date.now()-259200000).toISOString() },
]

export const MOCK_LIVE_TRANSACTIONS = [
  { id:'lt-1', time:'09:41:22', member:'J. Kamau', sacco:'Stima', type:'Contribution', amount:5000, direction:'credit', method:'mpesa', platform_fee:25, status:'completed' },
  { id:'lt-2', time:'09:39:11', member:'F. Odhiambo', sacco:'Unaitas', type:'Share capital', amount:5000, direction:'credit', method:'mpesa', platform_fee:25, status:'completed' },
  { id:'lt-3', time:'09:38:04', member:'B. Mutuku', sacco:'Teachers', type:'Loan repayment', amount:8200, direction:'debit', method:'mpesa', platform_fee:41, status:'completed' },
  { id:'lt-4', time:'09:35:50', member:'P. Waweru', sacco:'Stima', type:'Loan disbursed', amount:80000, direction:'credit', method:'mpesa', platform_fee:400, status:'completed' },
  { id:'lt-5', time:'09:31:18', member:'A. Otieno', sacco:'Kenya Police', type:'Disbursement', amount:50000, direction:'credit', method:'mpesa', platform_fee:0, status:'failed' },
]
