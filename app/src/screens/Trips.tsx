import { useNavigate } from 'react-router-dom'
import { Screen, Icon, Loading, Empty } from '../components'
import { useTrips } from '../api/queries'
import type { Trip } from '../types'

const statusLabel: Record<Trip['status'], string> = {
  active: '● Активна сейчас',
  finished: 'Завершена',
  planning: 'Планируется',
}

// порядок секций: сначала активные, потом будущие, потом прошедшие
const GROUPS: { status: Trip['status']; title: string }[] = [
  { status: 'active', title: 'Активные' },
  { status: 'planning', title: 'Планируются' },
  { status: 'finished', title: 'Завершённые' },
]

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

      {GROUPS.map(({ status, title }) => {
        const group = trips?.filter((t) => t.status === status) ?? []
        if (group.length === 0) return null
        return (
          <div key={status}>
            <div className="sec"><h2>{title}</h2><div className="line" /><span className="cnt">{group.length}</span></div>
            {group.map((t) => (
              <div key={t.id} className={'trip-card ' + t.cls} onClick={() => nav('/trip/' + t.id)}>
                <div className="nm">{t.title}</div>
                <div className="dt">{t.dates}</div>
                <span className="badge" style={{ background: 'rgba(0,0,0,.25)', color: '#fff', marginTop: 12, position: 'relative' }}>{statusLabel[t.status]}</span>
              </div>
            ))}
          </div>
        )
      })}
    </Screen>
  )
}
