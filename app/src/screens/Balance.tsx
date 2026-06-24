import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar, Loading, Empty } from '../ui'
import { useActiveTripId, useBalance } from '../api/queries'

export default function Balance() {
  const nav = useNavigate()
  const [settled, setSettled] = useState<string[]>([])
  const tripId = useActiveTripId()
  const { data: settlements, isLoading } = useBalance(tripId)

  // мой итог: сумма того, что я должен (переводы from='Ты')
  const owe = (settlements ?? []).filter((s) => s.from === 'Ты' && !settled.includes(s.id)).reduce((a, s) => a + s.amount, 0)
  const owed = (settlements ?? []).filter((s) => s.to === 'Ты' && !settled.includes(s.id)).reduce((a, s) => a + s.amount, 0)
  const open = (settlements ?? []).filter((s) => !settled.includes(s.id))

  return (
    <Screen>
      <TopBar title="Баланс" onBack={() => nav(-1)} />

      <div className="debt" style={{ marginBottom: 20 }}>
        <div className="k">Твой итог</div>
        <div className="v">
          {owe > 0 ? <>Ты должен <em>·</em> €{owe.toFixed(2)}</> : owed > 0 ? <>Тебе должны <em>·</em> €{owed.toFixed(2)}</> : 'Всё по нулям 🎉'}
        </div>
      </div>

      <div className="sec"><h2>Минимум переводов</h2><div className="line" /><span className="cnt">{open.length}</span></div>
      {!isLoading && open.length === 0 && <Empty text="Долгов нет 🎉" />}
      {open.length > 0 && <p className="sub" style={{ margin: '0 4px 14px' }}>Долги оптимизированы — меньше переводов между всеми.</p>}

      {isLoading && <Loading />}
      {settlements?.map((st) => {
        const done = settled.includes(st.id)
        return (
          <div key={st.id} className="row-item" style={{ opacity: done ? 0.5 : 1 }}>
            <div className="av" style={{ background: 'var(--g1)', color: 'var(--on-grad)' }}>{st.toInitial}</div>
            <div className="grow">
              <div className="ttl" style={{ fontSize: 15 }}>{st.from} → {st.to}</div>
              <div className="sub">{done ? 'оплачено' : 'ожидает перевода'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="amt" style={{ marginBottom: 6 }}>€{st.amount}</div>
              {!done && st.from === 'Ты' && (
                <button className="btn-solid" style={{ padding: '8px 14px', fontSize: 12.5 }} onClick={() => nav('/settle', { state: { to: st.to, toInitial: st.toInitial, amount: st.amount } })}>Перевести</button>
              )}
              {!done && st.from !== 'Ты' && (
                <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setSettled([...settled, st.id])}>Оплачено</button>
              )}
              {done && <span className="badge ok" style={{ marginTop: 0 }}>Закрыто</span>}
            </div>
          </div>
        )
      })}
    </Screen>
  )
}
