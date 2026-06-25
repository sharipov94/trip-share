import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Screen, Icon, Loading, Empty, Toast, Av } from '../components'
import { useTrips } from '../api/queries'
import { useAuth } from '../auth-context'
import type { Trip } from '../types'

const SECTIONS: { status: Trip['status']; title: string }[] = [
  { status: 'active', title: 'Активные' },
  { status: 'planning', title: 'Планируется' },
  { status: 'finished', title: 'Завершённые' },
]
const statusLabel: Record<Trip['status'], string> = {
  active: '● Активна', finished: 'Завершена', planning: 'Планируется',
}

export default function Trips() {
  const nav = useNavigate()
  const loc = useLocation()
  const { user } = useAuth()
  const { data: trips, isLoading } = useTrips()
  const [toast, setToast] = useState<string | null>((loc.state as { toast?: string } | null)?.toast ?? null)
  const name = (user?.firstName ?? 'путешественник').split(' ')[0]

  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">С возвращением,</div>
          <div className="title-grad trip" style={{ fontSize: 30 }}>{name}</div>
        </div>
        <Av url={user?.avatarUrl} initial={name[0]} size={44} />
      </div>

      {isLoading && <Loading />}
      {!isLoading && (trips?.length ?? 0) === 0 && <Empty text="Пока нет поездок — создай первую" />}

      {SECTIONS.map((sec) => {
        const list = trips?.filter((t) => t.status === sec.status) ?? []
        if (list.length === 0) return null
        return (
          <div key={sec.status}>
            <div className="sec"><h2>{sec.title}</h2><div className="line" /><span className="cnt">{list.length}</span></div>
            {list.map((t) => (
              <div key={t.id} className={'trip-card ' + t.cls} onClick={() => nav('/trip/' + t.id)}>
                <div className="nm">{t.title}</div>
                <div className="dt">{t.dates}</div>
                <span className="badge" style={{ background: 'rgba(0,0,0,.25)', color: '#fff', marginTop: 12, position: 'relative' }}>{statusLabel[t.status]}</span>
              </div>
            ))}
          </div>
        )
      })}

      <button className="btn-grad" style={{ marginTop: 10 }} onClick={() => nav('/trip/new')}><Icon.plus /> Новая поездка</button>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </Screen>
  )
}
