import { useNavigate } from 'react-router-dom'
import { Screen, Av } from '../components'
import { useTheme, PALETTES, type Palette } from '../theme'
import { useUpdateTheme, useTrips } from '../api/queries'
import { useAuth } from '../auth-context'
import { tg } from '../lib/tg'

export default function Profile() {
  const { palette, setPalette } = useTheme()
  const { user } = useAuth()
  const { data: trips } = useTrips()
  const nav = useNavigate()
  const saveTheme = useUpdateTheme()
  const name = user?.firstName ?? 'Профиль'
  const pick = (p: Palette) => {
    tg.haptic('light')
    setPalette(p) // мгновенно локально
    saveTheme.mutate(p) // и на бэк (fire-and-forget)
  }

  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Профиль</div>
          <div className="title-grad trip" style={{ fontSize: 28 }}>{name}</div>
        </div>
        <Av url={user?.avatarUrl} initial={name[0]} size={52} />
      </div>

      {/* реальная статистика */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="sub" style={{ margin: 0 }}>Поездок</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 22 }}>{trips?.length ?? 0}</div>
      </div>

      {/* palette picker */}
      <div className="sec"><h2>Оформление</h2><div className="line" /></div>
      <div className="pal-grid">
        {PALETTES.map((p) => (
          <div key={p.id} className={'pal' + (palette === p.id ? ' sel' : '')} onClick={() => pick(p.id)}>
            <div className="check">✓</div>
            <div className="swatch" style={{ background: p.grad }} />
            <div className="pname">{p.name}</div>
            <div className="pdesc">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* settings rows */}
      <div className="sec"><h2>Настройки</h2><div className="line" /></div>
      {[
        { t: 'Реквизиты и профиль', to: '/profile/edit' },
        { t: 'Уведомления', to: '/profile/notifications' },
        { t: 'Здоровье (Apple Health / Google Fit)', to: '/profile/health' },
      ].map((r) => (
        <div key={r.to} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav(r.to)}>
          <div className="grow"><div className="ttl" style={{ fontSize: 14.5 }}>{r.t}</div></div>
          <div className="sub" style={{ margin: 0 }}>→</div>
        </div>
      ))}
    </Screen>
  )
}
