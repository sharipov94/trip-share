import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Screen, Icon } from '../../components'
import { useTrip, useSetCurrentTrip, useUploadCover } from '../../api/queries'
import { tg } from '../../lib/tg'

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
  const setCurrent = useSetCurrentTrip()
  const cover = useUploadCover(id)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (id) setCurrent(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onCover = (f: File | undefined) => {
    if (!f) return
    tg.haptic('light')
    cover.mutate(f)
  }

  return (
    <Screen>
      {/* hero */}
      <div className={'hero ' + (trip?.cls ?? '')} style={trip?.coverUrl ? { backgroundImage: `url(${trip.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <button className="hero-back" aria-label="Назад" onClick={() => nav(-1)}><Icon.back /></button>
        <button className="hero-people" onClick={() => nav(`/trip/${id}/members`)}>
          {trip?.members.length ?? 0} <Icon.user />
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onCover(e.target.files?.[0])} />
        <button className={'hero-cover' + (cover.isPending ? ' busy' : '')} aria-label={trip?.coverUrl ? 'Сменить обложку' : 'Добавить обложку'} disabled={cover.isPending} onClick={() => fileRef.current?.click()}>
          <Icon.cam />
        </button>
        <div className="hero-cap">
          <div className="hero-meta">{trip ? STATUS[trip.status] : ''}{trip?.dates ? ' · ' + trip.dates : ''}</div>
          <h1 className="hero-title">{trip?.title ?? 'Поездка'}</h1>
        </div>
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
