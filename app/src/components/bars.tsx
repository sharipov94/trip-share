import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { tg } from '../lib/tg'
import { Icon } from './icons'
import { BottomNav } from './nav'

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
