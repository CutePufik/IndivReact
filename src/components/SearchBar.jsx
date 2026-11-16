import { useEffect, useState } from 'react'
import { PRESET_CITIES, searchCities } from '../api/openMeteo'
import { samePlace } from '../utils/places'

export function SearchBar({ city, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')

  useEffect(() => {
    const name = query.trim()
    if (name.length < 2) {
      setSuggestions([])
      setSearchStatus('idle')
      return undefined
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearchStatus('loading')
      searchCities(name, controller.signal)
        .then((list) => {
          setSuggestions(list)
          setSearchStatus(list.length ? 'ready' : 'empty')
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          setSuggestions([])
          setSearchStatus('error')
        })
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function choose(place) {
    onSelect(place)
    setQuery('')
    setSuggestions([])
    setSearchStatus('idle')
  }

  const listOpen = searchStatus !== 'idle'

  return (
    <div className="search">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (suggestions[0]) choose(suggestions[0])
        }}
      >
        <label className="search-label" htmlFor="city-search">
          Город
        </label>
        <input
          id="city-search"
          value={query}
          placeholder="Начните вводить название"
          autoComplete="off"
          aria-expanded={listOpen}
          aria-controls="city-suggestions"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('')
              setSuggestions([])
              setSearchStatus('idle')
            }
          }}
        />
        {listOpen && (
          <div className="suggestions" id="city-suggestions" role="listbox">
            {searchStatus === 'loading' && <p className="suggestion-note">Ищем город…</p>}
            {searchStatus === 'empty' && <p className="suggestion-note">Ничего не нашлось</p>}
            {searchStatus === 'error' && (
              <p className="suggestion-note">Поиск не ответил. Попробуйте ещё раз.</p>
            )}
            {suggestions.map((place) => {
              const meta = [place.admin1, place.country].filter(Boolean).join(', ')
              return (
                <button key={place.id} type="button" className="suggestion" onClick={() => choose(place)}>
                  <span>{place.name}</span>
                  {meta && <span className="suggestion-meta">{meta}</span>}
                </button>
              )
            })}
          </div>
        )}
      </form>
      <div className="chips" role="group" aria-label="Быстрый выбор города">
        {PRESET_CITIES.map((place) => (
          <button
            key={place.id}
            type="button"
            className={samePlace(city, place) ? 'chip is-active' : 'chip'}
            onClick={() => choose(place)}
          >
            {place.name}
          </button>
        ))}
      </div>
    </div>
  )
}
