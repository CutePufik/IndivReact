import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDay, formatMm, formatTemp } from '../utils/weatherCodes'

function formatTooltip(value, name) {
  if (name === 'Осадки, мм') return [formatMm(value), 'Осадки']
  return [formatTemp(value), name]
}

export function ForecastChart({ daily, status }) {
  const rows = daily.map((day) => ({
    ...day,
    label: formatDay(day.date),
  }))

  return (
    <article className="card chart-card" aria-busy={status === 'loading'}>
      <h2>Температура и осадки</h2>
      <p className="muted">Пять дней вперёд</p>
      {rows.length === 0 && (
        <p className="status">{status === 'error' ? 'График недоступен' : 'Собираем график…'}</p>
      )}
      {rows.length > 0 && (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={rows} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e4eef5" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#5c7388', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="temp"
                tick={{ fill: '#5c7388', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="rain"
                orientation="right"
                tick={{ fill: '#5c7388', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar
                yAxisId="rain"
                dataKey="precipitation"
                name="Осадки, мм"
                fill="#7ec8e3"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="tempMax"
                name="Макс"
                stroke="#e8590c"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="tempMin"
                name="Мин"
                stroke="#1c7ed6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
