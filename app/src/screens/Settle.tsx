import { useNavigate, useLocation } from 'react-router-dom'
import { Screen, TopBar } from '../components'
import { useActiveTripId, useRecordSettlement } from '../api/queries'
import { tg } from '../lib/tg'

export default function Settle() {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const record = useRecordSettlement(tripId)
  const st = (useLocation().state ?? {}) as {
    fromId?: string; toId?: string; to?: string; toInitial?: string; toUsername?: string | null; amount?: number; cur?: string
  }
  const to = st.to ?? 'Участник'
  const amount = st.amount ?? 0
  const cur = st.cur ?? '€'

  const markPaid = () => {
    if (record.isPending) return
    if (!st.fromId || !st.toId) return nav('/balance')
    tg.haptic('medium')
    record.mutate(
      { fromUser: st.fromId, toUser: st.toId, amount },
      { onSettled: () => nav('/balance') },
    )
  }

  const openChat = () => {
    if (st.toUsername) tg.openTelegramLink(`https://t.me/${st.toUsername}`)
  }

  return (
    <Screen nav={false}>
      <TopBar title="Перевод" onBack={() => nav(-1)} />

      <div style={{ textAlign: 'center', padding: '20px 0 6px' }}>
        <div className="av" style={{ width: 72, height: 72, margin: '0 auto', background: 'var(--g1)', color: 'var(--on-grad)', fontSize: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{st.toInitial ?? to[0]}</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 40, marginTop: 16 }}>{cur}{amount.toFixed(2)}</div>
        <div className="sub">Ты → {to}</div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="lbl" style={{ color: 'var(--muted)' }}>Реквизиты получателя</div>
        <div className="sub" style={{ marginTop: 6 }}>Реквизиты {to} указаны в его профиле. Открой чат и переведи сумму.</div>
      </div>

      {st.toUsername && (
        <button className="btn-grad" style={{ marginTop: 18 }} onClick={openChat}>💬 Открыть чат с {to}</button>
      )}
      <button className="btn-solid" style={{ width: '100%', justifyContent: 'center', marginTop: 11 }} disabled={record.isPending} onClick={markPaid}>
        {record.isPending ? 'Сохраняем…' : 'Отметить оплаченным'}
      </button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 14 }}>Отметка закроет долг в балансе у обоих участников</p>
    </Screen>
  )
}
