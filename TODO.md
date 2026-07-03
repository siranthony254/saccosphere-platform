# TODO

- [x] Add backend registration creation step in `apps/member-app/app/(auth)/register/kyc.tsx`.
  - [x] Upload id_front
  - [x] Upload id_back
  - [x] After both succeed, call backend registration creation endpoint exactly once
  - [x] Handle failure with Alert + prevent navigation
  - [x] Navigate to `/auth/register/link-saccos` on success

