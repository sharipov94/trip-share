import { NavLink } from 'react-router-dom'
import { Icon } from './icons'
import { CreateFab } from './CreateFab'

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
  // 2 пункта слева, центральный FAB, 2 справа
  const left = [
    { to: '/', icon: Icon.home, label: 'Сегодня', end: true },
    { to: '/trips', icon: Icon.trips, label: 'Поездки' },
  ]
  const right = [
    { to: '/finance', icon: Icon.money, label: 'Финансы' },
    { to: '/profile', icon: Icon.user, label: 'Профиль' },
  ]
  const link = (it: { to: string; icon: typeof Icon.home; label: string; end?: boolean }) => (
    <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? 'on' : '')}>
      <it.icon />
      {it.label}
    </NavLink>
  )
  return (
    <nav className="nav">
      <NavGradDef />
      {left.map(link)}
      <div className="fab-slot" aria-hidden />
      {right.map(link)}
      <CreateFab />
    </nav>
  )
}
