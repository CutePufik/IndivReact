const GROUPS = [
  { kind: 'clear', label: 'Ясно', codes: [0] },
  { kind: 'mainly', label: 'Преимущественно ясно', codes: [1] },
  { kind: 'partly', label: 'Переменная облачность', codes: [2] },
  { kind: 'cloudy', label: 'Пасмурно', codes: [3] },
  { kind: 'fog', label: 'Туман', codes: [45, 48] },
  { kind: 'drizzle', label: 'Морось', codes: [51, 53, 55, 56, 57] },
  { kind: 'rain', label: 'Дождь', codes: [61, 63, 65, 66, 67, 80, 81, 82] },
  { kind: 'snow', label: 'Снег', codes: [71, 73, 75, 77, 85, 86] },
  { kind: 'thunder', label: 'Гроза', codes: [95, 96, 99] },
]

const CLOUD =
  '<path fill="#f7fbfe" stroke="#7f9bb3" stroke-width="1.6" d="M16 32h17.2a6.6 6.6 0 0 0 .6-13.2 8.6 8.6 0 0 0-16.6-2.2A6.2 6.2 0 0 0 16 32z"/>'

function svg(body) {
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`
}

const GLYPHS = {
  clear: svg(`
    <circle cx="24" cy="24" r="8" fill="#f5b301"/>
    <g stroke="#f5b301" stroke-width="2.4" stroke-linecap="round">
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.4 10.4l4.2 4.2M33.4 33.4l4.2 4.2M37.6 10.4l-4.2 4.2M14.6 33.4l-4.2 4.2"/>
    </g>
  `),
  mainly: svg(`
    <circle cx="24" cy="24" r="8" fill="#f5b301"/>
    <g stroke="#f5b301" stroke-width="2.4" stroke-linecap="round">
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.4 10.4l4.2 4.2M33.4 33.4l4.2 4.2M37.6 10.4l-4.2 4.2M14.6 33.4l-4.2 4.2"/>
    </g>
  `),
  partly: svg(`
    <circle cx="32" cy="16" r="6" fill="#f5b301"/>
    <g stroke="#f5b301" stroke-width="2" stroke-linecap="round">
      <path d="M32 6v2.4M32 23.6V26M22 16h2.4M39.6 16H42M25.2 9.2l1.7 1.7M37.1 21.1l1.7 1.7M38.8 9.2l-1.7 1.7M26.9 21.1l-1.7-1.7"/>
    </g>
    ${CLOUD}
  `),
  cloudy: svg(CLOUD),
  fog: svg(`
    ${CLOUD}
    <g stroke="#8aa4bb" stroke-width="2" stroke-linecap="round">
      <path d="M12 37h24M15 41h18"/>
    </g>
  `),
  drizzle: svg(`
    <g transform="translate(0 -3)">${CLOUD}</g>
    <g fill="#5aa7e6">
      <circle cx="20" cy="38" r="1.5"/>
      <circle cx="28" cy="41" r="1.5"/>
      <circle cx="35" cy="37" r="1.5"/>
    </g>
  `),
  rain: svg(`
    <g transform="translate(0 -4)">${CLOUD}</g>
    <g fill="#2f86d6">
      <path d="M18 34c.2 3 2.6 5.2 2.6 5.2S23 37 22.8 34 20.4 31 20.4 31 17.8 31 18 34z"/>
      <path d="M26 36c.2 3 2.6 5.2 2.6 5.2S31 39 30.8 36 28.4 33 28.4 33 25.8 33 26 36z"/>
      <path d="M34 34c.2 3 2.6 5.2 2.6 5.2S39 37 38.8 34 36.4 31 36.4 31 33.8 31 34 34z"/>
    </g>
  `),
  snow: svg(`
    <g transform="translate(0 -4)">${CLOUD}</g>
    <g stroke="#6eb0d4" stroke-width="1.6" stroke-linecap="round">
      <path d="M18 36v6M15.5 39h5M16.2 36.8l3.6 4.4M19.8 36.8l-3.6 4.4"/>
      <path d="M28 37v6M25.5 40h5M26.2 37.8l3.6 4.4M29.8 37.8l-3.6 4.4"/>
      <path d="M37 35v5M35 37.5h4"/>
    </g>
  `),
  thunder: svg(`
    <g transform="translate(0 -5)">${CLOUD}</g>
    <path fill="#f0b429" d="M26 30h7l-4 7h4L24 46l2.2-8H22l4-8z"/>
  `),
  pending: svg(`
    <circle cx="24" cy="24" r="8" fill="none" stroke="#1f6aa5" stroke-width="2.4" stroke-dasharray="4 3"/>
  `),
}

export function describeWeather(code) {
  if (code == null) return { kind: 'pending', label: 'Загрузка' }
  return GROUPS.find((item) => item.codes.includes(code)) ?? { kind: 'cloudy', label: 'Нет данных' }
}

export function glyphSvg(kind) {
  return GLYPHS[kind] ?? GLYPHS.cloudy
}

export function formatTemp(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Math.round(Number(value))
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}°`
}

export function formatWind(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  return `${rounded} м/с`
}

export function formatMm(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  return `${rounded} мм`
}

export function formatDay(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`)
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' })
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric' })
  return `${weekday} ${day}`
}

export function markerHtml({ code, temperature, active }) {
  const { kind } = describeWeather(code)
  const temp = temperature == null ? '…' : formatTemp(temperature)
  const state = active ? ' is-active' : ''
  return `<div class="marker${state}"><div class="marker-icon">${glyphSvg(kind)}</div><div class="marker-temp">${temp}</div></div>`
}
