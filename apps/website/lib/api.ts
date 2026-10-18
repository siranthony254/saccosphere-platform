// Talks directly to the real SaccoSphere backend's two public,
// unauthenticated endpoints. This site is the company's public face, not an
// authenticated client, so it deliberately skips @saccosphere/api-client
// (built for token-bearing apps) in favor of plain fetch.

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://saccosphere-production-a4cb.up.railway.app').replace(/\/+$/, '')
const API_V1 = `${API_BASE}/api/v1`

export type PublicStats = {
  total_saccos: number
  total_members_on_app: number
}

// GET /accounts/public-stats/ returns the bare counters, unwrapped — this
// view is a plain APIView, not the StandardResponseMixin envelope the rest
// of the backend uses.
export async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${API_V1}/accounts/public-stats/`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      total_saccos: Number(data.total_saccos ?? 0),
      total_members_on_app: Number(data.total_members_on_app ?? 0),
    }
  } catch {
    return null
  }
}

export type SaccoListing = {
  id: string
  name: string
  logo: string | null
  sector: string | null
  county: string | null
  membership_type: string | null
  is_verified: boolean
  member_count: number
  membership_open: boolean
}

type SaccoSearchParams = {
  search?: string
  sector?: string
  county?: string
}

// GET /accounts/saccos/ — publicly-listed SACCOs only (is_publicly_listed=True
// is enforced server-side for an unauthenticated caller). May come back
// paginated ({results: [...]}) or as a bare array depending on DRF pagination
// settings — handle both rather than assuming one shape.
export async function searchSaccos(params: SaccoSearchParams = {}): Promise<SaccoListing[]> {
  const query = new URLSearchParams({ ordering: '-member_count' })
  if (params.search) query.set('search', params.search)
  if (params.sector) query.set('sector', params.sector)
  if (params.county) query.set('county', params.county)

  try {
    const res = await fetch(`${API_V1}/accounts/saccos/?${query.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const body = await res.json()
    const items = Array.isArray(body) ? body : Array.isArray(body?.results) ? body.results : Array.isArray(body?.data) ? body.data : []
    return items.map((s: Record<string, unknown>) => ({
      id: String(s.id),
      name: String(s.name ?? ''),
      logo: (s.logo as string | null) ?? null,
      sector: (s.sector as string | null) ?? null,
      county: (s.county as string | null) ?? null,
      membership_type: (s.membership_type as string | null) ?? null,
      is_verified: Boolean(s.is_verified),
      member_count: Number(s.member_count ?? 0),
      membership_open: Boolean(s.membership_open),
    }))
  } catch {
    return []
  }
}
