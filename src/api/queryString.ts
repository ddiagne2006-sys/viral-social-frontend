/** « ?a=1&b=x » à partir des paramètres définis et non vides, ou « » s'il n'y en a aucun. */
export function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
