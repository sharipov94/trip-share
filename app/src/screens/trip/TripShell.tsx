import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../../components'
import { useTrip, useSetCurrentTrip } from '../../api/queries'

const SUB = [
  { to: 'plan', label: 'План' },
  { to: 'expenses', label: 'Расходы' },
  { to: 'photos', label: 'Фото' },
  { to: 'members', label: 'Участники' },
  { to: 'summary', label: 'Итоги' },
]
const STATUS: Record<string, string> = { planning: 'Планируется', active: 'Активна', finished: 'Завершена' }

export default function TripShell() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const setCurrent = useSetCurrentTrip()
  useEffect(() => {
    if (id) setCurrent(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <Screen>
      <TopBar title={trip?.title ?? 'Поездка'} onBack={() => nav('/trips')} />
      {trip && <div className="sub" style={{ margin: '-8px 2px 10px' }}>{STATUS[trip.status]}{trip.dates ? ' · ' + trip.dates : ''}</div>}
      <div className="tabs">
        {SUB.map((s) => (
          <NavLink key={s.to} to={s.to} className={({ isActive }) => (isActive ? 'on' : '')}>{s.label}</NavLink>
        ))}
      </div>
      <Outlet />
    </Screen>
  )
}
