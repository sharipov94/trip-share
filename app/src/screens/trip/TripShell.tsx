import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Screen, Icon } from '../../components'
import { useTrip, useExpenses, useBalance, useSetCurrentTrip } from '../../api/queries'
import { myNet } from '../../lib/balance'

const SUB = [
  { to: 'overview', label: 'Обзор' },
  { to: 'expenses', label: 'Расходы' },
  { to: 'activities', label: 'Активности' },
  { to: 'photos', label: 'Фото' },
]
const STATUS: Record<string, string> = { planning: 'Планируется', active: 'Активна', finished: 'Завершена' }

export default function TripShell() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const { data: expenses } = useExpenses(id)
  const { data: balance } = useBalance(id)
  const setCurrent = useSetCurrentTrip()
  useEffect(() => {
    if (id) setCurrent(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const net = myNet(balance ?? [])
  const cur = trip?.currency || '€'

  return (
    <Screen>
      {/* hero */}
      <div className={'hero ' + (trip?.cls ?? '')}>
        <button className="hero-back" aria-label="Назад" onClick={() => nav(-1)}><Icon.back /></button>
        <button className="hero-people" onClick={() => nav(`/trip/${id}/members`)}>
          {trip?.members.length ?? 0} <Icon.user />
        </button>
        <div className="hero-cap">
          <div className="hero-meta">{trip ? STATUS[trip.status] : ''}{trip?.dates ? ' · ' + trip.dates : ''}</div>
          <h1 className="hero-title">{trip?.title ?? 'Поездка'}</h1>
        </div>
      </div>

      {/* summary pills */}
      <div className="pills">
        <div className="pill"><span className="pl">Потрачено</span><b>{cur}{total}</b></div>
        <div className="pill">
          <span className="pl">{net >= 0 ? 'Должны тебе' : 'Ты должен'}</span>
          <b className={net > 0 ? 'pos' : net < 0 ? 'neg' : ''}>{net === 0 ? 'Рассчитано' : cur + Math.abs(net)}</b>
        </div>
        <div className="pill"><span className="pl">Участники</span><b>{trip?.members.length ?? 0}</b></div>
      </div>

      <div className="tabs">
        {SUB.map((s) => (
          <NavLink key={s.to} to={s.to} className={({ isActive }) => (isActive ? 'on' : '')}>{s.label}</NavLink>
        ))}
      </div>
      <Outlet />
    </Screen>
  )
}
