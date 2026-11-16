export function samePlace(a, b) {
  if (!a || !b) return false
  return Math.abs(a.latitude - b.latitude) < 0.25 && Math.abs(a.longitude - b.longitude) < 0.25
}

export function placeSubtitle(city) {
  const parts = []
  if (city.admin1 && city.admin1 !== city.name) parts.push(city.admin1)
  if (city.country) parts.push(city.country)
  return parts.join(', ')
}
