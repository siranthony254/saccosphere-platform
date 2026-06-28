# TODO

## Goal
Ensure MPesa option is pressable from the member dashboard contribute/pay-loan selection and routes into the existing payment processing UI (the “screen 17 → 18” flow).

## Steps
1. Identify where the dashboard “Contribute” and “Pay loan” buttons land (routes and any selection step UI).
2. Modify routing so that clicking **MPesa** from that selection page navigates (or jumps) into the existing payment flow (`apps/member-app/components/payments/*` via `apps/member-app/components/sacco/[slug]/pay.tsx`).
3. If the pay screen currently always starts at `methodStep='amount'`, add support for a query param to start directly at `processing` (or add a `step` param) so the MPesa press shows the processing screens immediately.
4. Update any TypeScript types and ensure the route params are wired correctly.
5. Run a quick typecheck/build for `apps/member-app` to ensure no compile errors.

## Status
- Found Pay/Contribution flow: `apps/member-app/components/sacco/[slug]/pay.tsx` already has Mpesa → `methodStep='processing'` and renders the processing UI.
- Dashboard “Contribute” goes to `/sacco/[slug]/pay`.
- Dashboard “Pay loan” goes to `/sacco/[slug]/pay` with params `type=repayment` and `loanId`.
- Remaining item: ensure any other selection-page Mpesa button is pressable (selection page referenced by the task wasn’t a separate route; it’s the method selector inside the pay flow).


