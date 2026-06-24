import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar } from '../ui'
import { categories } from '../data'
import { useActiveTrip, useActiveTripId, useCreateExpense } from '../api/queries'
import { tg } from '../tg'

const splits = [
  { id: 'equal', label: 'Поровну' },
  { id: 'manual', label: 'Вручную' },
]

export default function ExpenseNew() {
  const nav = useNavigate()
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState(categories[0])
  const [title, setTitle] = useState('')
  const [split, setSplit] = useState('equal')
  const tripId = useActiveTripId()
  const { data: trip } = useActiveTrip()
  const create = useCreateExpense(tripId)

  const people = Math.max(1, trip?.members.length ?? 1)
  const per = amount ? (Number(amount) / people).toFixed(2) : '0'

  const submit = () => {
    if (!amount || Number(amount) <= 0) return
    tg.haptic('medium')
    create.mutate(
      { amount: Number(amount), currency: 'EUR', category: 'other', title: title.trim() || cat },
      { onSettled: () => nav(-1) },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Новый расход" onBack={() => nav(-1)} />

      {/* amount */}
      <div className="card" style={{ textAlign: 'center', padding: '22px 16px', marginBottom: 16 }}>
        <div className="lbl" style={{ color: 'var(--muted)' }}>Сумма, €</div>
        <input className="amount-big" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" />
      </div>

      <div className="field">
        <label>Категория</label>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Название</label>
        <input placeholder="Музей Пикассо" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label>Как делим</label>
        <div className="seg">
          {splits.map((s) => (
            <button key={s.id} className={split === s.id ? 'on' : ''} onClick={() => setSplit(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {split === 'equal' ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div className="sub" style={{ margin: 0 }}>На {people} {people === 1 ? 'человека' : 'человек'}</div>
          <div className="font-display" style={{ fontWeight: 800, fontSize: 18 }}>€{per} / чел</div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 4 }}>
          <div className="sub" style={{ margin: 0 }}>Ручное распределение появится при добавлении участников в поездку.</div>
        </div>
      )}

      <button className="btn-ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => nav('/receipt')}>📎 Прикрепить чек или скрин</button>

      <button className="btn-grad" style={{ marginTop: 12 }} disabled={create.isPending} onClick={submit}>
        {create.isPending ? 'Создаём…' : 'Создать расход'}
      </button>
    </Screen>
  )
}
