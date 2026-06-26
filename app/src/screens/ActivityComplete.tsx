import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar } from '../components'
import { useActiveTripId, useActiveTrip, useActivity, useCompleteActivity, useCreateExpense } from '../api/queries'
import { tg } from '../lib/tg'

export default function ActivityComplete() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: act } = useActivity(id ?? '')
  const { data: trip } = useActiveTrip()
  const tripId = useActiveTripId()
  const [amount, setAmount] = useState('')
  const complete = useCompleteActivity()
  const createExpense = useCreateExpense(tripId)

  const people = Math.max(1, trip?.members.length ?? 1)
  const per = amount ? (Number(amount) / people).toFixed(2) : '0'
  const cur = trip?.currency || '€'
  const busy = complete.isPending || createExpense.isPending

  const submit = () => {
    if (!amount || Number(amount) <= 0) return
    tg.haptic('medium')
    // создаём расход на сумму активности, затем помечаем её завершённой
    createExpense.mutate(
      { amount: Number(amount), currency: trip?.baseCurrency || 'EUR', category: 'activity', title: act?.title || 'Активность' },
      {
        onSettled: () => {
          if (id) complete.mutate(id, { onSettled: () => nav('/balance') })
          else nav('/balance')
        },
      },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Завершение" onBack={() => nav(-1)} />

      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div className="ttl" style={{ fontSize: 18 }}>{act?.title ?? 'Активность'}</div>
        <div className="sub">Внеси фактическую стоимость</div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '22px 16px', margin: '14px 0' }}>
        <div className="lbl" style={{ color: 'var(--muted)' }}>Итого, {cur}</div>
        <input className="amount-big" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="0" />
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="sub" style={{ margin: 0 }}>Делим на {people} {people === 1 ? 'участника' : 'участников'}</div>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 18 }}>{cur}{per} / чел</div>
      </div>

      <button className="btn-grad" style={{ marginTop: 16 }} disabled={busy} onClick={submit}>
        {busy ? 'Завершаем…' : 'Создать расход и завершить'}
      </button>
    </Screen>
  )
}
