import { useNavigate } from 'react-router-dom'
import { Screen, Icon, Loading, Empty } from '../ui'
import { useTrips } from '../api/queries'

const statusLabel = { active: '● Активна сейчас', finished: 'Завершена', planning: 'Планируется' }

export default function Trips() {
  const nav = useNavigate()
  const { data: trips, isLoading } = useTrips()
  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Твои</div>
          <div className="title-grad trip" style={{ fontSize: 30 }}>Поездки</div>
        </div>
        <button className="btn-grad" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => nav('/trip/new')}><Icon.plus /> Новая</button>
      </div>

      {isLoading && <Loading />}
      {trips && trips.length === 0 && <Empty text="Пока нет поездок — создай первую" />}
      {trips?.map((t) => (
        <div key={t.id} className={'trip-card ' + t.cls} onClick={() => nav('/trip/' + t.id)}>
          <div className="nm">{t.title}</div>
          <div className="dt">{t.dates}</div>
          <span className="badge" style={{ background: 'rgba(0,0,0,.25)', color: '#fff', marginTop: 12, position: 'relative' }}>{statusLabel[t.status]}</span>
        </div>
      ))}
    </Screen>
  )
}
