export const WORLD = 960

export function project(lon, lat) {
  const clamped = Math.max(-85, Math.min(85, lat))
  const x = ((lon + 180) / 360) * WORLD
  const rad = (clamped * Math.PI) / 180
  const merc = Math.log(Math.tan(Math.PI / 4 + rad / 2))
  const y = (0.5 - merc / (2 * Math.PI)) * WORLD
  return { x, y }
}

export function viewAround(lon, lat, spanLon, aspect) {
  const center = project(lon, lat)
  const w = (spanLon / 360) * WORLD
  const h = w / Math.max(aspect, 0.4)
  return { x: center.x - w / 2, y: center.y - h / 2, w, h }
}
