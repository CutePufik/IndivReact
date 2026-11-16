import { useEffect, useState } from 'react'
import { getForecast, PRESET_CITIES } from '../api/openMeteo'
import { samePlace } from '../utils/places'

async function loadPlace(place, signal) {
  const data = await getForecast(place, signal)
  return {
    ...place,
    temperature: data.current.temperature,
    weatherCode: data.current.weatherCode,
  }
}

export function useCityWeather(initialCity = PRESET_CITIES[0]) {
  const [city, setCity] = useState(initialCity)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [places, setPlaces] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    const requested = city
    setStatus('loading')
    setError('')

    getForecast(requested, controller.signal)
      .then((data) => {
        setReport({ city: requested, current: data.current, daily: data.daily })
        setStatus('ready')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus('error')
        setError(err instanceof TypeError ? 'Нет соединения с сервисом погоды' : err.message)
      })

    return () => controller.abort()
  }, [city])

  useEffect(() => {
    const controller = new AbortController()

    Promise.allSettled(PRESET_CITIES.map((place) => loadPlace(place, controller.signal))).then((results) => {
      if (controller.signal.aborted) return
      setPlaces(results.filter((item) => item.status === 'fulfilled').map((item) => item.value))
    })

    return () => controller.abort()
  }, [])

  const ready = report != null && samePlace(report.city, city)

  return {
    city,
    setCity,
    status,
    error,
    current: ready ? report.current : null,
    daily: ready ? report.daily : [],
    places,
  }
}
