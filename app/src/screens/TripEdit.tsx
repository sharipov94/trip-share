import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Screen, TopBar, Loading } from '../components'
import { useTrip, useUpdateTrip, useDeleteTrip } from '../api/queries'
import { tg } from '../lib/tg'

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
  const del = useDeleteTrip()

  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [status, setStatus] = useState('planning')
  const [confirmDel, setConfirmDel] = useState(false)

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

  const remove = () => {
    if (!id) return
    tg.haptic('medium')
    del.mutate(id, { onSuccess: () => nav('/trips', { replace: true, state: { toast: 'Поездка удалена' } }) })
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
          {start || end ? (
            <div className="field">
              <label>Статус</label>
              <p className="sub" style={{ margin: '2px 4px 0' }}>Определяется автоматически по датам: до начала — «Планируется», во время — «Активна», после конца — «Завершена».</p>
            </div>
          ) : (
            <div className="field">
              <label>Статус</label>
              <div className="seg">
                {STATUSES.map((s) => (
                  <button key={s.id} className={status === s.id ? 'on' : ''} onClick={() => setStatus(s.id)}>{s.label}</button>
                ))}
              </div>
            </div>
          )}
          <button className="btn-grad" style={{ marginTop: 8 }} disabled={update.isPending} onClick={save}>
            {update.isPending ? 'Сохраняем…' : 'Сохранить'}
          </button>

          <div className="sec" style={{ marginTop: 28 }}><h2>Опасная зона</h2><div className="line" /></div>
          {!confirmDel ? (
            <button className="btn-ghost" style={{ width: '100%', color: 'var(--danger, #e5484d)' }} onClick={() => setConfirmDel(true)}>
              Удалить поездку
            </button>
          ) : (
            <>
              <p className="sub" style={{ textAlign: 'center', margin: '0 4px 10px' }}>Удалить «{trip.title}» со всеми активностями и расходами? Это необратимо.</p>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn-ghost" style={{ flex: 1 }} disabled={del.isPending} onClick={() => setConfirmDel(false)}>Отмена</button>
                <button className="btn-solid" style={{ flex: 1, background: 'var(--danger, #e5484d)', color: '#fff' }} disabled={del.isPending} onClick={remove}>
                  {del.isPending ? 'Удаляем…' : 'Да, удалить'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Screen>
  )
}
