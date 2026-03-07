function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function extractList<T>(payload: unknown): { items: T[]; total: number } {
  if (Array.isArray(payload)) {
    return { items: payload as T[], total: payload.length }
  }

  if (!isRecord(payload)) {
    return { items: [], total: 0 }
  }

  const listCandidate = payload.items ?? payload.data ?? payload.results ?? payload.content
  const items = Array.isArray(listCandidate) ? (listCandidate as T[]) : []

  const totalCandidate = payload.total ?? payload.totalCount ?? payload.count
  const total = typeof totalCandidate === 'number' ? totalCandidate : items.length

  return { items, total }
}
