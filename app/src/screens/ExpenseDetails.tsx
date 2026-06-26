import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar, Loading } from '../components'
import { useExpense } from '../api/queries'

const AV = ['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--accent)', 'var(--ok)']

export default function ExpenseDetails() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: e, isLoading } = useExpense(id ?? '')

  if (isLoading || !e) {
    return (
      <Screen nav={false}>
        <TopBar title="Расход" onBack={() => nav(-1)} />
        <Loading />
      </Screen>
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Расход" onBack={() => nav(-1)} />

      <div className="debt" style={{ background: 'var(--g3)' }}>
        <div className="k">{e.title}</div>
        <div className="v">{e.cur}{e.amount}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .9, marginTop: 6, position: 'relative' }}>{e.cat} · платил {e.payer}</div>
      </div>

      <button className="btn-ghost" style={{ width: '100%', margin: '14px 0' }} onClick={() => nav('/receipt')}>🧾 Посмотреть чек</button>

      <div className="sec"><h2>Разделение</h2><div className="line" /><span className="cnt">{e.participants.length}</span></div>
      {e.participants.map((p, i) => (
        <div key={i} className="row-item" style={{ padding: '12px 14px' }}>
          <div className="av" style={{ width: 34, height: 34, fontSize: 13, background: AV[i % 5] }}>{p.initial}</div>
          <div className="grow">
            <div className="ttl" style={{ fontSize: 14.5 }}>{p.name}</div>
            <div className="sub">{p.isPayer ? 'оплатил' : 'должен'}</div>
          </div>
          <div className="amt" style={{ color: p.isPayer ? 'var(--ok)' : 'var(--ink)' }}>{e.cur}{p.amount}</div>
        </div>
      ))}
    </Screen>
  )
}
