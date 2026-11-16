import { PRESET_CITIES } from './api/openMeteo'
import { CurrentWeather } from './components/CurrentWeather'
import { ForecastChart } from './components/ForecastChart'
import { SearchBar } from './components/SearchBar'
import { WeatherMap } from './components/WeatherMap'
import { useCityWeather } from './hooks/useCityWeather'

export default function App() {
  const weather = useCityWeather(PRESET_CITIES[0])

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Open-Meteo</p>
        <h1>Погодный дашборд</h1>
        <p className="lede">Карта выбранного города и прогноз температуры с осадками на 5 дней.</p>
      </header>

      <SearchBar city={weather.city} onSelect={weather.setCity} />

      {weather.status === 'error' && (
        <p className="banner" role="alert">
          {weather.error}
        </p>
      )}

      <main className="layout">
        <section className="panel map-panel" aria-label="Карта">
          <div className="panel-head">
            <h2>Карта</h2>
            <p>Клик по метке открывает город</p>
          </div>
          <WeatherMap
            city={weather.city}
            current={weather.current}
            places={weather.places}
            onSelect={weather.setCity}
          />
        </section>
        <section className="side">
          <CurrentWeather city={weather.city} current={weather.current} status={weather.status} />
          <ForecastChart daily={weather.daily} status={weather.status} />
        </section>
      </main>

      <footer className="footer">
        Данные <a href="https://open-meteo.com/">Open-Meteo</a>, контур суши{' '}
        <a href="https://www.naturalearthdata.com/">Natural Earth</a>
      </footer>
    </div>
  )
}
