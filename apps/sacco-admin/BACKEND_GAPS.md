# Backend Gaps — Sacco Admin Frontend

## 1. SACCO ID not in login/me response (workaround in place)

**Endpoint**: `POST /accounts/login/` and `GET /accounts/me/`  
**Issue**: The response does not include the `sacco_id` for a SACCO admin user.  
**Frontend workaround**: After login, the frontend calls `GET /management/roles/?user_id=<id>` separately to find the `SACCO_ADMIN` role and extract `role.sacco.id`. This works but adds a round-trip on every login and bootstrap.  
**Recommendation**: Include `sacco_id` (or the first admin sacco's ID) in the `/accounts/me/` or `/accounts/login/` response for users with `SACCO_ADMIN` role.

---

## 2. Member detail missing financial fields

**Endpoint**: `GET /management/members/{id}/`  
**Issue**: The response does not include:
- `monthly_contribution`
- `fosa_balance` (separate from total savings)
- `share_capital`
- `repayment_rate_pct`

These are all hardcoded to `0` in `normalizeAdminMember()` in `packages/api-client/src/api.ts`.  
**Recommendation**: The member detail endpoint should return the full financial breakdown per member. The member list endpoint (`GET /management/members/`) currently returns `savings_total` and `outstanding_loans` — extend this or the detail endpoint to include the fields above.

---

## 3. User ID not exposed on member list items

**Endpoint**: `GET /management/members/` and `GET /management/members/{id}/`  
**Issue**: To look up a user's roles (`GET /management/roles/?user_id=`), the frontend needs the user's UUID. The backend returns membership objects where the user ID is nested under `member.user.id` but may be omitted in some serializer configurations.  
**Frontend fix applied**: `normalizeAdminMember()` now reads `user.id` and stores it as `user_id` on `AdminMember`. `MemberDetail` uses this to call `useUserRoles(member.user_id)`.  
**Recommendation**: Ensure `user.id` is always present in the member serializer response.

---

## 4. No total-member count from stats endpoint

**Endpoint**: `GET /management/stats/`  
**Issue**: `total_members` is returned here and correctly mapped to the dashboard. However `GET /management/members/` also returns a `count` field (paginated total) which is used in `MembersList` for the "X total members" subtitle — ensure this is the live SACCO-scoped count, not a global count.

---

## 5. Roles endpoint scope

**Endpoint**: `GET /management/roles/?user_id=`  
**Issue**: A SACCO admin can only call this for users within their SACCO. If a user belongs to multiple SACCOs (e.g., member of SACCO A, admin of SACCO B), the admin of SACCO A may not be able to see the SACCO B admin role. This is expected behaviour but worth confirming.
