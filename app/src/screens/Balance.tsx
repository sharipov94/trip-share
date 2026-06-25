import { useNavigate } from 'react-router-dom'
import { Screen, TopBar, Loading, Empty } from '../components'
import { useActiveTripId, useBalance, useRecordSettlement, useTrip } from '../api/queries'
import { tg } from '../lib/tg'

export default function Balance() {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const { data: settlements, isLoading } = useBalance(tripId)
  const { data: trip } = useTrip(tripId)
  const cur = trip?.currency ?? '€'
  const record = useRecordSettlement(tripId)

  // мой итог: что я должен (from='Ты') и что должны мне (to='Ты')
  const owe = (settlements ?? []).filter((s) => s.from === 'Ты').reduce((a, s) => a + s.amount, 0)
  const owed = (settlements ?? []).filter((s) => s.to === 'Ты').reduce((a, s) => a + s.amount, 0)
  const open = settlements ?? []

  // кредитор подтверждает получение наличных — гасит перевод на бэке
  const markPaid = (st: { fromId: string; toId: string; amount: number }) => {
    if (record.isPending) return
    tg.haptic('light')
    record.mutate({ fromUser: st.fromId, toUser: st.toId, amount: st.amount })
  }

  return (
    <Screen>
      <TopBar title="Баланс" onBack={() => nav(-1)} />

      <div className="debt" style={{ marginBottom: 20 }}>
        <div className="k">Твой итог</div>
        <div className="v">
          {owe > 0 ? <>Ты должен <em>·</em> {cur}{owe.toFixed(2)}</> : owed > 0 ? <>Тебе должны <em>·</em> {cur}{owed.toFixed(2)}</> : 'Всё по нулям 🎉'}
        </div>
      </div>

      <div className="sec"><h2>Минимум переводов</h2><div className="line" /><span className="cnt">{open.length}</span></div>
      {!isLoading && open.length === 0 && <Empty text="Долгов нет 🎉" />}
      {open.length > 0 && <p className="sub" style={{ margin: '0 4px 14px' }}>Долги оптимизированы — меньше переводов между всеми.</p>}

      {isLoading && <Loading />}
      {open.map((st) => (
        <div key={st.id} className="row-item">
          <div className="av" style={{ background: 'var(--g1)', color: 'var(--on-grad)' }}>{st.toInitial}</div>
          <div className="grow">
            <div className="ttl" style={{ fontSize: 15 }}>{st.from} → {st.to}</div>
            <div className="sub">ожидает перевода</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="amt" style={{ marginBottom: 6 }}>{cur}{st.amount.toFixed(2)}</div>
            {st.from === 'Ты' && (
              <button className="btn-solid" style={{ padding: '8px 14px', fontSize: 12.5 }} onClick={() => nav('/settle', { state: { fromId: st.fromId, toId: st.toId, to: st.to, toInitial: st.toInitial, toUsername: st.toUsername, amount: st.amount, cur } })}>Перевести</button>
            )}
            {st.to === 'Ты' && (
              <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} disabled={record.isPending} onClick={() => markPaid(st)}>Оплачено</button>
            )}
          </div>
        </div>
      ))}
    </Screen>
  )
}
