import { useEffect, useMemo, useRef, useState } from 'react'
import { LAND_PATH } from '../data/landPath'
import { samePlace } from '../utils/places'
import { project, viewAround, WORLD } from '../utils/project'
import { markerHtml } from '../utils/weatherCodes'

const HOME = viewAround(62, 55, 86, 1.35)

function Graticule() {
  const lines = []
  for (let lon = -180; lon <= 180; lon += 30) {
    const top = project(lon, 85)
    const bottom = project(lon, -85)
    lines.push(<line key={`lon-${lon}`} x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} />)
  }
  for (let lat = -60; lat <= 80; lat += 20) {
    const left = project(-180, lat)
    const right = project(180, lat)
    lines.push(<line key={`lat-${lat}`} x1={left.x} y1={left.y} x2={right.x} y2={right.y} />)
  }
  return (
    <g stroke="#ffffff" strokeOpacity="0.5" vectorEffect="non-scaling-stroke">
      {lines}
    </g>
  )
}

export function WeatherMap({ city, current, places, onSelect }) {
  const boxRef = useRef(null)
  const viewRef = useRef(HOME)
  const dragRef = useRef(null)
  const rafRef = useRef(0)
  const seenRef = useRef(null)
  const [view, setView] = useState(HOME)
  const [aspect, setAspect] = useState(1.35)
  const [dragging, setDragging] = useState(false)

  viewRef.current = view

  const markers = useMemo(() => {
    const list = places.map((place) => ({ ...place }))
    if (!list.some((place) => samePlace(place, city))) {
      list.push({
        ...city,
        temperature: current?.temperature ?? null,
        weatherCode: current?.weatherCode ?? null,
      })
    }
    return list
  }, [places, city, current])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return undefined
    const update = () => {
      const next = box.clientWidth / Math.max(box.clientHeight, 1)
      if (next > 0) setAspect(next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setView((currentView) => {
      const h = currentView.w / aspect
      const cy = currentView.y + currentView.h / 2
      return { ...currentView, y: cy - h / 2, h }
    })
  }, [aspect])

  useEffect(() => {
    const key = `${city.latitude},${city.longitude}`
    if (seenRef.current === null || seenRef.current === key) {
      seenRef.current = key
      return undefined
    }
    seenRef.current = key
    const box = boxRef.current
    const nextAspect = box ? box.clientWidth / Math.max(box.clientHeight, 1) : 1.35
    const from = viewRef.current
    const next = viewAround(city.longitude, city.latitude, 34, nextAspect)
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / 650)
      const eased = 1 - (1 - t) ** 3
      const frame = {
        x: from.x + (next.x - from.x) * eased,
        y: from.y + (next.y - from.y) * eased,
        w: from.w + (next.w - from.w) * eased,
        h: from.h + (next.h - from.h) * eased,
      }
      viewRef.current = frame
      setView(frame)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [city.latitude, city.longitude])

  function zoomBy(factor) {
    cancelAnimationFrame(rafRef.current)
    setView((currentView) => {
      const w = Math.min(WORLD * 1.15, Math.max((10 / 360) * WORLD, currentView.w * factor))
      const h = w / aspect
      const cx = currentView.x + currentView.w / 2
      const cy = currentView.y + currentView.h / 2
      return { x: cx - w / 2, y: cy - h / 2, w, h }
    })
  }

  function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest('.map-pin, .zoom-controls')) return
    cancelAnimationFrame(rafRef.current)
    dragRef.current = { x: event.clientX, y: event.clientY, view: viewRef.current }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function onPointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    setView({
      ...drag.view,
      x: drag.view.x - ((event.clientX - drag.x) / rect.width) * drag.view.w,
      y: drag.view.y - ((event.clientY - drag.y) / rect.height) * drag.view.h,
    })
  }

  function onPointerUp() {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div
      ref={boxRef}
      className={dragging ? 'map is-dragging' : 'map'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg className="map-svg" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} preserveAspectRatio="none">
        <rect x={-WORLD} y={-WORLD} width={WORLD * 3} height={WORLD * 3} fill="#b7d4ea" />
        <Graticule />
        <path d={LAND_PATH} fill="#e4efd8" stroke="#7d987c" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="zoom-controls">
        <button type="button" aria-label="Приблизить" onClick={() => zoomBy(0.72)}>
          +
        </button>
        <button type="button" aria-label="Отдалить" onClick={() => zoomBy(1.4)}>
          −
        </button>
      </div>
      {markers.map((place) => {
        const point = project(place.longitude, place.latitude)
        const left = ((point.x - view.x) / view.w) * 100
        const top = ((point.y - view.y) / view.h) * 100
        return (
          <div
            key={place.id ?? `${place.latitude}-${place.longitude}`}
            className="map-pin"
            role="button"
            tabIndex={0}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-label={place.name}
            title={place.name}
            onClick={() => onSelect(place)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(place)
              }
            }}
            dangerouslySetInnerHTML={{
              __html: markerHtml({
                code: place.weatherCode,
                temperature: place.temperature,
                active: samePlace(place, city),
              }),
            }}
          />
        )
      })}
    </div>
  )
}
