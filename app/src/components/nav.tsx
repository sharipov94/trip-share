import { NavLink } from 'react-router-dom'
import { Icon } from './icons'

/* градиент-обводки для активной иконки нав-бара */
export function NavGradDef() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--nav-grad-a)" />
          <stop offset="1" stopColor="var(--nav-grad-b)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function BottomNav() {
  const items = [
    { to: '/', icon: Icon.home, label: 'Сегодня', end: true },
    { to: '/trips', icon: Icon.trips, label: 'Поездки' },
    { to: '/expenses', icon: Icon.money, label: 'Расходы' },
    { to: '/memories', icon: Icon.photo, label: 'Фото' },
    { to: '/profile', icon: Icon.user, label: 'Профиль' },
  ]
  return (
    <nav className="nav">
      <NavGradDef />
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? 'on' : '')}>
          <it.icon />
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
