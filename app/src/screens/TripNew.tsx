import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar } from '../components'
import { useCreateTrip } from '../api/queries'

const types = [
  { id: 'flight', label: '✈️ Самолёт' },
  { id: 'car', label: '🚗 Авто' },
  { id: 'train', label: '🚆 Поезд' },
  { id: 'bus', label: '🚌 Автобус' },
]

export default function TripNew() {
  const nav = useNavigate()
  const [type, setType] = useState('flight')
  const [cur, setCur] = useState('EUR')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const create = useCreateTrip()

  const submit = () => {
    create.mutate(
      {
        title: title.trim() || 'Новая поездка',
        baseCurrency: cur,
        tripType: type,
        startDate: start || undefined,
        endDate: end || undefined,
      },
      { onSettled: () => nav('/invite') },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Новая поездка" onBack={() => nav('/trips')} />

      <div className="field">
        <label>Название</label>
        <input placeholder="Барселона 2027" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 11 }}>
        <div className="field" style={{ flex: 1 }}><label>Начало</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Конец</label><input type="date" min={start || new Date().toISOString().slice(0, 10)} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>

      <div className="field">
        <label>Тип поездки</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {types.map((t) => (
            <button key={t.id} className={t.id === type ? 'btn-grad' : 'btn-ghost'} style={{ width: '100%', padding: '13px 0' }} onClick={() => setType(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Базовая валюта</label>
        <select value={cur} onChange={(e) => setCur(e.target.value)}>
          <option value="EUR">€ Евро (EUR)</option>
          <option value="USD">$ Доллар (USD)</option>
          <option value="RUB">₽ Рубль (RUB)</option>
        </select>
      </div>

      <button className="btn-grad" style={{ marginTop: 8 }} disabled={create.isPending} onClick={submit}>
        {create.isPending ? 'Создаём…' : 'Создать и пригласить'}
      </button>
    </Screen>
  )
}
