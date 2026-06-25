import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Screen, TopBar, Loading } from '../components'
import { useActivity, useUpdateActivity } from '../api/queries'

const today = new Date().toISOString().slice(0, 10)

export default function ActivityEdit() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: act, isLoading } = useActivity(id ?? '')
  const update = useUpdateActivity(id ?? '')

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (!act) return
    setTitle(act.title)
    setDesc(act.description ?? '')
    setPrice(act.price != null ? String(act.price) : '')
    if (act.startTime) {
      const d = new Date(act.startTime)
      setDate(d.toISOString().slice(0, 10))
      setTime(d.toTimeString().slice(0, 5))
    }
  }, [act])

  const save = () => {
    const startTime = date ? new Date(`${date}T${time || '12:00'}`).toISOString() : undefined
    update.mutate(
      { title: title.trim() || undefined, description: desc.trim(), startTime, price: price ? Number(price) : undefined },
      { onSettled: () => nav(-1) },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Редактировать активность" onBack={() => nav(-1)} />
      {isLoading && <Loading />}
      {act && (
        <>
          <div className="field"><label>Название</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 11 }}>
            <div className="field" style={{ flex: 1 }}><label>Дата</label><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Время</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="field"><label>Описание</label><input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="field"><label>Стоимость (опц.), €</label><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} /></div>
          <button className="btn-grad" style={{ marginTop: 8 }} disabled={update.isPending} onClick={save}>
            {update.isPending ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </>
      )}
    </Screen>
  )
}
