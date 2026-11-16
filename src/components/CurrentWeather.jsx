import { placeSubtitle } from '../utils/places'
import { describeWeather, formatMm, formatTemp, formatWind } from '../utils/weatherCodes'
import { WeatherGlyph } from './WeatherIcon'

export function CurrentWeather({ city, current, status }) {
  const subtitle = placeSubtitle(city)

  return (
    <article className="card current" aria-busy={status === 'loading'}>
      <p className="eyebrow">Сейчас</p>
      <h2>{city.name}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
      {!current && (
        <p className="status">{status === 'error' ? 'Нет данных по этому городу' : 'Загружаем погоду…'}</p>
      )}
      {current && (
        <div className="current-body">
          <WeatherGlyph code={current.weatherCode} size={72} />
          <div className="current-main">
            <p className="temp">{formatTemp(current.temperature)}</p>
            <p>{describeWeather(current.weatherCode).label}</p>
          </div>
          <dl className="facts">
            <div>
              <dt>Ветер</dt>
              <dd>{formatWind(current.windSpeed)}</dd>
            </div>
            <div>
              <dt>Осадки</dt>
              <dd>{formatMm(current.precipitation)}</dd>
            </div>
          </dl>
        </div>
      )}
    </article>
  )
}
