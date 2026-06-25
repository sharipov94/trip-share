import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar } from '../components'
import { useActiveTripId, useActiveTrip, useCreateActivity } from '../api/queries'
import { todayStr } from '../lib/date'

export default function ActivityNew() {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const { data: trip } = useActiveTrip()
  // активность — в пределах поездки: не раньше старта, не позже конца
  const minDate = trip?.startDate || todayStr()
  const maxDate = trip?.endDate || undefined
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [desc, setDesc] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const create = useCreateActivity(tripId)

  const submit = () => {
    const startTime = date ? new Date(`${date}T${time || '12:00'}`).toISOString() : undefined
    create.mutate(
      {
        title: title.trim() || 'Новая активность',
        startTime,
        description: desc.trim() || undefined,
        activityUrl: url.trim() || undefined,
        price: price ? Number(price) : undefined,
        currency: price ? 'EUR' : undefined,
      },
      { onSettled: () => nav(-1) },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Новая активность" onBack={() => nav(-1)} />

      <div className="field"><label>Название</label><input placeholder="Музей Пикассо" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div style={{ display: 'flex', gap: 11 }}>
        <div className="field" style={{ flex: 1 }}><label>Дата</label><input type="date" min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Время</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      </div>
      <div className="field"><label>Описание</label><input placeholder="Что и где" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="field"><label>Ссылка</label><input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
      <div className="field"><label>Стоимость (опц.), €</label><input inputMode="decimal" placeholder="15" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} /></div>

      <button className="btn-grad" style={{ marginTop: 8 }} disabled={create.isPending} onClick={submit}>
        {create.isPending ? 'Создаём…' : 'Создать и оповестить'}
      </button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 12 }}>Все участники получат уведомление и смогут проголосовать</p>
    </Screen>
  )
}
