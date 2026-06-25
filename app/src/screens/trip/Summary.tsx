import { useNavigate, useParams } from 'react-router-dom'
import { useTrip, useActivities, useExpenses, useMemories } from '../../api/queries'

export default function Summary() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const { data: activities } = useActivities(id)
  const { data: expenses } = useExpenses(id)
  const { data: photos } = useMemories(id)
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  return (
    <>
      <div className="day" onClick={() => nav('/wrapped')} style={{ cursor: 'pointer' }}>
        <div className="lbl">Travel Wrapped</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 24, marginTop: 8, lineHeight: 1.05 }}>История поездки<br />в слайдах →</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        {[
          [String(trip?.members.length ?? 0), 'участников'],
          [String(activities?.length ?? 0), 'активностей'],
          [String(photos?.length ?? 0), 'фото'],
          ['€' + total, 'расходы'],
        ].map(([n, l]) => (
          <div key={l} className="card" style={{ textAlign: 'center', padding: '18px 10px' }}>
            <div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>{n}</div>
            <div className="sub" style={{ margin: 0 }}>{l}</div>
          </div>
        ))}
      </div>
      <button className="btn-grad" style={{ marginTop: 16 }} onClick={() => nav('/wrapped')}>Смотреть Wrapped</button>
    </>
  )
}
