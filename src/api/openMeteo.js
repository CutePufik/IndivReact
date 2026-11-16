const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export const PRESET_CITIES = [
  { id: 'moscow', name: 'Москва', latitude: 55.7558, longitude: 37.6173, country: 'Россия' },
  { id: 'spb', name: 'Санкт-Петербург', latitude: 59.9343, longitude: 30.3351, country: 'Россия' },
  { id: 'kazan', name: 'Казань', latitude: 55.7887, longitude: 49.1221, country: 'Россия' },
  { id: 'novosibirsk', name: 'Новосибирск', latitude: 55.0084, longitude: 82.9357, country: 'Россия' },
  { id: 'sochi', name: 'Сочи', latitude: 43.5855, longitude: 39.7231, country: 'Россия' },
]

export async function searchCities(name, signal) {
  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', name)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'ru')
  url.searchParams.set('format', 'json')

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error('Поиск городов сейчас недоступен')
  }

  const data = await response.json()
  return (data.results ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country ?? '',
    admin1: item.admin1 ?? '',
  }))
}

export async function getForecast(city, signal) {
  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(city.latitude))
  url.searchParams.set('longitude', String(city.longitude))
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m')
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '5')
  url.searchParams.set('wind_speed_unit', 'ms')

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error('Не удалось получить прогноз')
  }

  const data = await response.json()
  const daily = data.daily
  if (!data.current || !daily?.time) {
    throw new Error('Сервис вернул неполные данные')
  }

  return {
    current: {
      temperature: data.current.temperature_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
    },
    daily: daily.time.map((date, index) => ({
      date,
      weatherCode: daily.weather_code[index],
      tempMax: daily.temperature_2m_max[index],
      tempMin: daily.temperature_2m_min[index],
      precipitation: daily.precipitation_sum[index] ?? 0,
    })),
  }
}
