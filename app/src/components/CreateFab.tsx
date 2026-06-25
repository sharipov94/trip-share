import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentTripId } from '../api/queries'
import { tg } from '../lib/tg'

export function CreateFab() {
  const nav = useNavigate()
  const tripId = useCurrentTripId()
  const [open, setOpen] = useState(false)

  const go = (path: string) => { setOpen(false); tg.haptic('light'); nav(path) }
  const inTrip = (path: string) => (tripId ? go(path) : go('/trip/new'))

  const actions = [
    { label: '🧳 Новая поездка', run: () => go('/trip/new') },
    { label: '💸 Новый расход', run: () => inTrip('/expense/new') },
    { label: '📅 Новая активность', run: () => inTrip('/activity/new') },
    { label: '📷 Загрузить фото', run: () => inTrip('/upload') },
  ]

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '22px 22px 0 0', padding: '14px 16px calc(env(safe-area-inset-bottom,0px) + 18px)' }}>
            <div className="lbl" style={{ textAlign: 'center', color: 'var(--muted)', margin: '4px 0 12px' }}>Создать</div>
            {actions.map((a) => (
              <button key={a.label} className="btn-solid" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 9 }} onClick={a.run}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
      <button className="fab" aria-label="Создать" onClick={() => { tg.haptic('light'); setOpen(true) }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="url(#ng)" strokeWidth="2.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </>
  )
}
