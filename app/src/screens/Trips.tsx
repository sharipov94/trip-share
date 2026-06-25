import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Screen, Icon, Loading, Empty, Toast } from '../components'
import { useTrips } from '../api/queries'
import type { Trip } from '../types'

const statusLabel: Record<Trip['status'], string> = {
  active: '● Активна сейчас',
  finished: 'Завершена',
  planning: 'Планируется',
}

// порядок вкладок тулбара: активные → будущие → прошедшие
const TABS: { status: Trip['status']; title: string }[] = [
  { status: 'active', title: 'Активные' },
  { status: 'planning', title: 'Планируются' },
  { status: 'finished', title: 'Завершённые' },
]

export default function Trips() {
  const nav = useNavigate()
  const loc = useLocation()
  const { data: trips, isLoading } = useTrips()
  const [tab, setTab] = useState<Trip['status']>('active')
  const [toast, setToast] = useState<string | null>((loc.state as { toast?: string } | null)?.toast ?? null)

  const count = (s: Trip['status']) => trips?.filter((t) => t.status === s).length ?? 0
  const shown = trips?.filter((t) => t.status === tab) ?? []

  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Твои</div>
          <div className="title-grad trip" style={{ fontSize: 30 }}>Поездки</div>
        </div>
        <button className="btn-grad" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => nav('/trip/new')}><Icon.plus /> Новая</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.status} className={tab === t.status ? 'on' : ''} onClick={() => setTab(t.status)}>
            {t.title}{count(t.status) > 0 ? ` ${count(t.status)}` : ''}
          </button>
        ))}
      </div>

      {isLoading && <Loading />}
      {!isLoading && (trips?.length ?? 0) === 0 && <Empty text="Пока нет поездок — создай первую" />}
      {!isLoading && (trips?.length ?? 0) > 0 && shown.length === 0 && (
        <Empty text={`Нет поездок в разделе «${TABS.find((t) => t.status === tab)?.title}»`} />
      )}

      {shown.map((t) => (
        <div key={t.id} className={'trip-card ' + t.cls} onClick={() => nav('/trip/' + t.id)}>
          <div className="nm">{t.title}</div>
          <div className="dt">{t.dates}</div>
          <span className="badge" style={{ background: 'rgba(0,0,0,.25)', color: '#fff', marginTop: 12, position: 'relative' }}>{statusLabel[t.status]}</span>
        </div>
      ))}

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </Screen>
  )
}
