import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Screen, TopBar, Loading } from '../components'
import { useTrip, useUpdateTrip } from '../api/queries'

const STATUSES = [
  { id: 'planning', label: 'Планируется' },
  { id: 'active', label: 'Активна' },
  { id: 'finished', label: 'Завершена' },
]

export default function TripEdit() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: trip, isLoading } = useTrip(id ?? '')
  const update = useUpdateTrip(id ?? '')

  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [status, setStatus] = useState('planning')

  useEffect(() => {
    if (!trip) return
    setTitle(trip.title)
    setStart(trip.startDate ?? '')
    setEnd(trip.endDate ?? '')
    setStatus(trip.status)
  }, [trip])

  const save = () => {
    update.mutate(
      { title: title.trim() || undefined, startDate: start || undefined, endDate: end || undefined, status },
      { onSettled: () => nav(-1) },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Редактировать поездку" onBack={() => nav(-1)} />
      {isLoading && <Loading />}
      {trip && (
        <>
          <div className="field"><label>Название</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 11 }}>
            <div className="field" style={{ flex: 1 }}><label>Начало</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Конец</label><input type="date" min={start || new Date().toISOString().slice(0, 10)} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Статус</label>
            <div className="seg">
              {STATUSES.map((s) => (
                <button key={s.id} className={status === s.id ? 'on' : ''} onClick={() => setStatus(s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
          <button className="btn-grad" style={{ marginTop: 8 }} disabled={update.isPending} onClick={save}>
            {update.isPending ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </>
      )}
    </Screen>
  )
}
