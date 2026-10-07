# Backend-To-Frontend Gap Audit

Date: October 5, 2026

## Summary

The backend is ahead of the frontend in several areas. This is good: many "new product" features do not require starting from zero. The missing work is mostly API-client wrappers, hooks, screens, navigation entries, and UX flows.

The biggest backend/frontend gaps are:

1. Maker-checker approvals and step-up security.
2. Staff MFA onboarding and login verification.
3. Savings account admin actions: status changes, dividend eligibility, reversals.
4. GL account statement drill-down.
5. Platform holiday mode.
6. Billing exemption and invoice resend controls.
7. Data erasure review for admins/super-admins.
8. Support access grants.
9. Alternate-number B2C disbursement.
10. Backend model foundations with little or no UI: insurance, holidays/EOD/balance snapshots, approval policies, platform settings, compliance flags, retention policies, provider events/outbox/job health.

## Priority 1: High-Value Gaps To Expose Soon

### 1. Maker-Checker Approvals

Backend exists:

- `SaccoSphere/saccosphere-project/approvals/urls.py`
- Endpoints:
  - `GET /approvals/pending/`
  - `GET /approvals/history/`
  - `POST /approvals/<id>/approve/`
  - `POST /approvals/<id>/reject/`
  - `support-access-grants/`
- Models:
  - `ApprovalPolicy`
  - `ApprovalRequest`
  - `ApprovalDecision`
  - `SupportAccessGrant`

Frontend status:

- No clear SACCO-admin or super-admin approvals page.
- No API-client namespace for `api.approvals.*`.
- Some backend tests show this gates sensitive actions, but the UI does not expose a clean approval inbox.

Implementation needed:

- Add API client methods:
  - `api.approvals.getPending()`
  - `api.approvals.getHistory()`
  - `api.approvals.approve(id, notes?)`
  - `api.approvals.reject(id, reason)`
  - `api.approvals.getSupportAccessGrants()`
  - `api.approvals.createSupportAccessGrant(...)`
  - `api.approvals.revokeSupportAccessGrant(id)`
- Add SACCO admin route:
  - `/approvals`
- Add super-admin route if platform-level approvals are needed:
  - `/approvals`
- UI:
  - Pending approval queue.
  - Approval detail drawer/modal.
  - Approve/reject actions.
  - History tab.
  - Badges in admin sidebar.

Why it matters:

- This is investor-grade governance.
- It proves the system is not just CRUD; it has financial controls.

### 2. Staff MFA And Step-Up Verification

Backend exists:

- `accounts/urls.py`
- Endpoints:
  - `POST /accounts/mfa/enroll/`
  - `POST /accounts/mfa/confirm/`
  - `POST /accounts/mfa/login-verify/`
  - `POST /accounts/mfa/reset/`
  - `POST /accounts/step-up/request-otp/`
- Models:
  - `StaffMFADevice`
  - `MFARecoveryCode`
  - `StepUpVerification`

Frontend status:

- Member app has trusted devices and app lock.
- Admin login exists, but there is no obvious staff MFA enrollment/verification UI.
- No visible step-up prompt flow for sensitive admin actions.

Implementation needed:

- Add API client methods:
  - `api.auth.mfaEnroll()`
  - `api.auth.mfaConfirm(code)`
  - `api.auth.mfaLoginVerify(payload)`
  - `api.auth.mfaReset(userId?)`
  - `api.auth.requestStepUpOtp()`
- Admin frontend:
  - MFA setup screen after first admin login.
  - QR/manual secret display.
  - Recovery code display.
  - MFA challenge screen during login.
  - Step-up modal when backend returns step-up-required response.
- Sensitive actions to wire:
  - Loan disbursement.
  - Savings reversal.
  - Payment config approval.
  - Settings changes.
  - Billing exemptions.

Why it matters:

- This directly supports the cyber-resilience and fraud-control story.

### 3. Savings Account Admin Actions

Backend exists:

- `services/urls.py`
- Endpoints:
  - `POST /services/savings/<id>/status/`
  - `POST /services/savings/<id>/dividend-eligibility/`
  - `POST /services/savings/<id>/reversal/`
- Serializers:
  - `SavingsStatusActionSerializer`
  - `SavingsDividendEligibilitySerializer`
  - `SavingsReversalSerializer`

Frontend status:

- SACCO admin has members and savings-type/product configuration.
- I did not see a strong UI for account-level status changes, dividend eligibility toggling, or savings transaction reversal.

Implementation needed:

- Add API client methods:
  - `api.saccoAdmin.updateSavingsStatus(id, payload)`
  - `api.saccoAdmin.updateSavingsDividendEligibility(id, payload)`
  - `api.saccoAdmin.reverseSavingTransaction(id, payload)`
- Add UI in:
  - Member detail page.
  - Savings account detail section.
  - Ledger/transaction detail page.
- Required modals:
  - Freeze/activate/close savings account.
  - Toggle dividend eligibility.
  - Reverse savings entry with reason, reference, and step-up/approval handling.

Why it matters:

- SACCO admins need operational controls, not just dashboards.
- Reversal is important for real finance operations.

### 4. GL Account Statement Drill-Down

Backend exists:

- `ledger/urls.py`
- Endpoint:
  - `GET /ledger/gl/accounts/<account_id>/statement/`
- Frontend already uses:
  - GL trial balance.
  - GL reconciliation.

Frontend status:

- Ledger page likely shows entries, balance, trial balance, reconciliation.
- No obvious drill-down into a single GL account statement.

Implementation needed:

- Add API client method:
  - `api.saccoAdmin.getGLAccountStatement(accountId, params)`
- Add UI:
  - Click account row in trial balance.
  - Open account statement drawer/page.
  - Date filters.
  - Export/download option if backend supports or future endpoint is added.

Why it matters:

- Makes ledger/GL feel finance-grade rather than summary-only.

### 5. Platform Holiday Mode

Backend exists:

- `saccomanagement/urls.py`
- Endpoint:
  - `GET/PATCH /management/superadmin/holiday-mode/`
- Model:
  - `PlatformSettings.holiday_mode_enabled`
- Related SACCO-level setting:
  - `SaccoSettings.holiday_mode_enabled`

Frontend status:

- Super-admin has system/settings pages.
- No obvious holiday-mode control.

Implementation needed:

- Add API client methods:
  - `api.superAdmin.getHolidayMode()`
  - `api.superAdmin.updateHolidayMode(enabled, reason?)`
- Add UI:
  - Super-admin settings/system toggle.
  - Warning explaining that holiday/heightened-risk mode lowers B2C thresholds and forces approvals.
  - Audit note/reason field.

Why it matters:

- Good risk-control story.
- Useful during holidays, fraud spikes, or platform incidents.

## Priority 2: Product Completeness Gaps

### 6. Billing Exemption

Backend exists:

- `billing/urls.py`
- Endpoint:
  - `PATCH /billing/saccos/<sacco_id>/exemption/`
- Model flag:
  - Billing exemption / overdue suspension bypass.

Frontend status:

- Billing screens exist for SACCO admin and super-admin.
- Invoice mark-paid exists.
- No clear UI for granting/removing billing exemption.

Implementation needed:

- Add API client method:
  - `api.superAdmin.updateSaccoBillingExemption(saccoId, payload)`
- Add UI:
  - Super-admin billing page or SACCO detail page.
  - Toggle exemption.
  - Reason field.
  - Expiry date if backend supports later.

### 7. Invoice Resend

Backend exists:

- `billing/urls.py`
- Endpoint:
  - `POST /billing/invoices/<invoice_id>/resend/`

Frontend status:

- Invoice list/detail/download and mark-paid are exposed.
- Resend action is not clearly exposed.

Implementation needed:

- Add API client method:
  - `api.saccoAdmin.resendInvoice(invoiceId)` or `api.superAdmin.resendInvoice(invoiceId)`
- Add button:
  - Invoice detail page.
  - Billing table row action.

### 8. Data Erasure Review

Backend exists:

- `accounts/urls.py`
- Endpoints:
  - `POST /accounts/me/erasure-requests/`
  - `POST /accounts/erasure-requests/<request_id>/review/`
- Models:
  - `DataErasureRequest`

Frontend status:

- Member app can request erasure through privacy flows.
- No clear admin/super-admin queue to review erasure requests.

Implementation needed:

- Backend may need a list endpoint if not already available. Current URLs show create and review, not list.
- Add API client:
  - `api.account.reviewDataErasure(requestId, payload)`
  - `api.superAdmin.getDataErasureRequests()` if backend list is added.
- Add super-admin page:
  - `/privacy-requests` or inside Compliance.
  - Approve/reject/hold.
  - Show regulatory hold reason.

### 9. Support Access Grants

Backend exists:

- `approvals/urls.py`
- Router:
  - `support-access-grants/`
- Model:
  - `SupportAccessGrant`

Frontend status:

- No visible UI.

Implementation needed:

- Add API client methods under approvals or super-admin namespace.
- Add super-admin support access page:
  - Grant support engineer temporary access to a SACCO context.
  - Expiry.
  - Reason.
  - Audit trail.

Why it matters:

- Important for real SaaS operations.
- Supports secure customer support without sharing passwords.

### 10. Alternate-Number B2C Disbursement

Backend exists:

- `payments/urls.py`
- Endpoint:
  - `POST /payments/mpesa/b2c/disburse/alternate-number/`

Frontend status:

- Standard B2C disbursement exists in admin flows.
- Alternate-number disbursement is not clearly exposed.

Implementation needed:

- Add API client method:
  - `api.saccoAdmin.disburseToAlternateNumber(payload)`
- Add UI:
  - Loan disbursement modal option for alternate payout number.
  - Strong warning and approval/step-up requirement.
  - Audit reason.

Risk:

- This is sensitive. Only expose with maker-checker + step-up.

## Priority 3: Backend Foundations With Little Or No UI

### 11. Approval Policies

Backend/model exists:

- `ApprovalPolicy`

Frontend gap:

- No policy management UI.

Implementation needed:

- Confirm if backend exposes CRUD for approval policies. If not, add endpoints.
- Add SACCO admin/super-admin settings:
  - Action type.
  - Threshold.
  - Required approvers.
  - Active/inactive.

### 12. Insurance Model

Backend/model exists:

- `services.models.Insurance`

Frontend gap:

- No insurance/bima/welfare UI.

Implementation needed:

- Decide product direction:
  - True insurance requires licensed partner.
  - Welfare fund can be built internally as mutual-aid workflow.
- If using existing Insurance model, add endpoints and frontend:
  - Member insurance/welfare status.
  - Admin policy/claims page.
  - Claim approval.
  - B2C payout.

### 13. Holidays, EOD Runs, Daily Balance Snapshots

Backend/model exists:

- `Holiday`
- `EndOfDayRun`
- `DailyBalanceSnapshot`
- `seed_holidays` management command.

Frontend gap:

- No visible operations dashboard for EOD, holiday calendar, or balance snapshots.

Implementation needed:

- Add backend endpoints if missing.
- Add super-admin/system page:
  - Holiday calendar.
  - EOD run status.
  - Last successful job.
  - Snapshot history.

### 14. Platform Settings

Backend/model exists:

- `saccomanagement.models.PlatformSettings`

Frontend gap:

- Super-admin settings page exists, but likely not all platform settings are wired.

Implementation needed:

- Audit which settings are exposed.
- Add API client methods if missing.
- Add editable settings groups:
  - Risk limits.
  - Holiday mode.
  - Platform fee behavior.
  - Notification defaults.

### 15. Compliance Flags And Retention Policies

Backend/model exists:

- `ComplianceFlag`
- `RetentionPolicy`

Frontend gap:

- Super-admin compliance page exists, but these models may not have full list/create/resolve UI.

Implementation needed:

- Confirm backend endpoints. Add if missing.
- Add compliance UI:
  - Flags list.
  - Assign owner.
  - Resolve/dismiss.
  - Retention policy table.

### 16. Payment Provider Events And Callback Logs

Backend/model exists:

- `PaymentProvider`
- `ProviderEvent`
- `Callback`
- `MpesaTransaction`

Frontend gap:

- Super-admin transactions exist.
- No obvious provider-event/callback diagnostic screen.

Implementation needed:

- Add backend endpoints if missing.
- Add super-admin diagnostics page:
  - Callback log.
  - Provider event log.
  - Failed callback retries.
  - Search by checkout request/conversation ID.

### 17. Notification Outbox

Backend/model exists:

- `OutboxMessage`

Frontend gap:

- Member notifications and admin bulk SMS exist.
- No visible outbox/retry/failed message screen.

Implementation needed:

- Add backend endpoints if missing.
- Add super-admin/system page:
  - Outbox queue.
  - Failed messages.
  - Retry action.
  - Delivery status.

### 18. Job Health

Backend exists:

- `health/urls.py`
- Endpoint:
  - `/health/jobs/`
- Model:
  - `JobHeartbeat`

Frontend status:

- Super-admin system health exists.
- Need confirm whether job health is displayed, not just readiness.

Implementation needed:

- Add API client method if missing:
  - `api.superAdmin.getJobHealth()`
- Add system health section:
  - Worker heartbeat.
  - Scheduled jobs.
  - Last success/failure.

## Already Mostly Connected

These backend areas appear to have frontend coverage:

- Member auth/register/login/password reset.
- Member KYC upload/status.
- SACCO discovery/list/detail.
- Membership applications and documents.
- Member dashboard/state/activity.
- Savings list/breakdown.
- Loan apply/list/detail/schedule/eligibility.
- Internal/external guarantors.
- M-Pesa STK payment.
- B2C loan disbursement.
- Savings withdrawal.
- Payment status.
- Transactions and statements.
- Notifications and device token registration.
- SACCO admin dashboard.
- Members and applications.
- KYC queue/review.
- Loan approvals and CRB warning display.
- Disbursement audit.
- Contributions dashboard/feed.
- Dividends.
- Bulk SMS.
- SASRA returns.
- Liquidity/NPL.
- Ledger entries, balances, trial balance, reconciliation.
- Billing list/detail/download/current month/mark paid.
- Super-admin overview, SACCOs, members, transactions, revenue, alerts, KYC, payment onboarding, disputes, audit logs, system health.

## Best Implementation Order

For product value and investor/expo storytelling:

1. Approvals inbox and approval history.
2. Step-up/MFA flow for admin sensitive actions.
3. Savings admin actions: freeze/activate/reversal/dividend eligibility.
4. Holiday mode toggle.
5. GL account statement drill-down.
6. Billing exemption and invoice resend.
7. Data erasure review queue.
8. Support access grants.
9. Alternate-number B2C with strong controls.
10. Outbox/provider-event/job diagnostics.

## Short Pitch Impact

If the first five are exposed in the frontend, the product story becomes much stronger:

> Saccosphere is not only digitizing SACCO member services. It already has the backend controls for regulated financial operations: maker-checker approvals, step-up authentication, account reversals, GL drill-down, and heightened-risk holiday mode. The remaining work is surfacing those controls cleanly in the admin and super-admin interfaces.

