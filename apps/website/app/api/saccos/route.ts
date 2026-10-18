import { NextRequest, NextResponse } from 'next/server'
import { searchSaccos } from '@/lib/api'

// Same-origin proxy for the client-side directory search. The Railway
// backend's CORS allowlist is locked to FRONTEND_URL and won't include this
// site's origin, so the browser can't call it directly — this route runs on
// the Next.js server instead, where CORS doesn't apply.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const results = await searchSaccos({
    search: params.get('search') ?? undefined,
    sector: params.get('sector') ?? undefined,
    county: params.get('county') ?? undefined,
  })
  return NextResponse.json({ results })
}
