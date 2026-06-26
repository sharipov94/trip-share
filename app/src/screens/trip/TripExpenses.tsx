import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Loading, Empty } from '../../components'
import { useExpenses, useTrip } from '../../api/queries'

export default function TripExpenses() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: expenses, isLoading } = useExpenses(id)
  const { data: trip } = useTrip(id)
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const cur = trip?.currency || '€'
  return (
    <>
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="sub" style={{ margin: 0 }}>Всего потрачено</div><div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>{cur}{total}</div></div>
        <button className="btn-ghost" onClick={() => nav('/balance')}>Баланс →</button>
      </div>
      {isLoading && <Loading />}
      {expenses && expenses.length === 0 && <Empty text="Расходов пока нет" />}
      {expenses?.map((e) => (
        <div key={e.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/expense/' + e.id)}>
          <div className="av" style={{ background: 'var(--g3)', color: 'var(--on-grad)' }}>{e.cat[0]}</div>
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{e.title}</div><div className="sub">{e.cat} · платил {e.payer}</div></div>
          <div className="amt">{e.cur}{e.amount}</div>
        </div>
      ))}
      <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/expense/new')}><Icon.plus /> Новый расход</button>
    </>
  )
}
