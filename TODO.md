# TODO: Fix super-admin type-check/build errors

Status: queued fixes based on CI/Vercel TypeScript errors (TS7006/TS7053/TS6133/TS18048).


## Step 1 — Fix implicit `any` + index typing in `Compliance.tsx`
- Add proper types for `.map` callback params (`m`, `row`, `i`, `flag`).
- Fix TS7053 dynamic indexing by constraining severity key type (e.g. `keyof typeof severityMap`) or avoiding indexing with `any`.

## Step 2 — Fix implicit `any` in `MembersList.tsx`
- Add types for `member` and `idx` in `.map` callback.

## Step 3 — Fix implicit `any` in `Revenue.tsx`
- Add types for `sum`, `item`, `i` in reduce/map callbacks.

## Step 4 — Fix implicit `any` in `usePlatformData.ts`
- Replace `txn: any` usage with a typed transaction shape or cast to `LiveTransaction` inputs.

## Step 5 — Fix unused function in `packages/api-client/src/api.ts`
- Remove `normalizePlatformOverview` if truly unused OR use it.

## Step 6 — Fix `params.search` possibly undefined in `packages/api-client/src/api.ts`
- Ensure search is defined before calling `.toLowerCase()`.

## Step 7 — Re-run:
- `pnpm --filter super-admin type-check`
- `pnpm --filter super-admin build`

