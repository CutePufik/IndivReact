import { describeWeather, glyphSvg } from '../utils/weatherCodes'

export function WeatherGlyph({ code, size = 48 }) {
  const { kind, label } = describeWeather(code)
  return (
    <span
      className={`glyph glyph-${kind}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: glyphSvg(kind) }}
    />
  )
}
