import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { tg } from './tg'

/* ── иконки ── */
const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
export const Icon = {
  home: () => <svg viewBox="0 0 24 24" {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" /></svg>,
  trips: () => <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16M4 12h16M4 17h10" /></svg>,
  money: () => <svg viewBox="0 0 24 24" {...s}><path d="M12 3v18M7 8h7a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h8" /></svg>,
  photo: () => <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 18 5-4 4 3 3-2 4 3" /></svg>,
  user: () => <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>,
  arrow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  cam: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" strokeLinejoin="round" /><circle cx="12" cy="12.5" r="3.4" /></svg>,
  back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 6l-6 6 6 6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" strokeWidth="2.4" strokeLinecap="round" /></svg>,
}

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

/* шапка вложенного экрана с кнопкой назад */
export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 2px 16px' }}>
      {onBack && !tg.available && (
        <button onClick={onBack} className="btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: 13 }}>
          <Icon.back />
        </button>
      )}
      <h1 className="font-display" style={{ fontWeight: 800, fontSize: 19, margin: 0, flex: 1, textTransform: 'uppercase', letterSpacing: '-.3px' }}>
        {title}
      </h1>
      {right}
    </div>
  )
}

/** Аватар: фото из Telegram, иначе кружок с буквой. */
export function Av({ url, initial, size = 40, bg = 'var(--accent)', border }: { url?: string | null; initial: string; size?: number; bg?: string; border?: string }) {
  const common = { width: size, height: size, borderRadius: '50%', flexShrink: 0, border } as const
  if (url) return <img src={url} alt="" style={{ ...common, objectFit: 'cover' }} />
  return <div style={{ ...common, background: bg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.42, color: '#1a1030' }}>{initial}</div>
}

export function Avatar({ initial, bg = 'var(--accent)', size = 40 }: { initial: string; bg?: string; size?: number }) {
  return (
    <div className="av" style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#1a1030' }}>
      {initial}
    </div>
  )
}

/* состояние загрузки / пусто */
export function Loading() {
  return <div className="sub" style={{ textAlign: 'center', padding: '40px 0' }}>Загрузка…</div>
}
export function Empty({ text }: { text: string }) {
  return <div className="sub" style={{ textAlign: 'center', padding: '36px 12px' }}>{text}</div>
}

/* переключатель для настроек */
export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 46, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
        padding: 3, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
        background: on ? 'var(--g1)' : 'var(--soft)', transition: 'background .2s',
      }}
    >
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'block' }} />
    </button>
  )
}

/* обёртка экрана: статус-бар + скролл-контент + нижняя навигация */
export function Screen({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const loc = useLocation()
  return (
    <>
      <div className="screen fade-up" key={loc.pathname}>
        {children}
      </div>
      {nav && <BottomNav />}
    </>
  )
}
