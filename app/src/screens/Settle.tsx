import { useNavigate, useLocation } from 'react-router-dom'
import { Screen, TopBar } from '../ui'

export default function Settle() {
  const nav = useNavigate()
  const st = (useLocation().state ?? {}) as { to?: string; toInitial?: string; amount?: number }
  const to = st.to ?? 'Участник'
  const amount = st.amount ?? 0

  return (
    <Screen nav={false}>
      <TopBar title="Перевод" onBack={() => nav(-1)} />

      <div style={{ textAlign: 'center', padding: '20px 0 6px' }}>
        <div className="av" style={{ width: 72, height: 72, margin: '0 auto', background: 'var(--g1)', color: 'var(--on-grad)', fontSize: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{st.toInitial ?? to[0]}</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 40, marginTop: 16 }}>€{amount.toFixed(2)}</div>
        <div className="sub">Ты → {to}</div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="lbl" style={{ color: 'var(--muted)' }}>Реквизиты получателя</div>
        <div className="sub" style={{ marginTop: 6 }}>Реквизиты {to} указаны в его профиле. Открой чат и переведи сумму.</div>
      </div>

      <button className="btn-grad" style={{ marginTop: 18 }}>💬 Открыть чат с {to}</button>
      <button className="btn-solid" style={{ width: '100%', justifyContent: 'center', marginTop: 11 }} onClick={() => nav('/balance')}>Отметить оплаченным</button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 14 }}>Откроется чат Telegram с готовым текстом и суммой</p>
    </Screen>
  )
}
