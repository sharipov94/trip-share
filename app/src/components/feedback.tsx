import { useEffect } from 'react'

/* всплывающее уведомление, само исчезает */
export function Toast({ text, onDone, ms = 2400 }: { text: string; onDone: () => void; ms?: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, ms)
    return () => clearTimeout(t)
  }, [onDone, ms])
  return (
    <div
      style={{
        position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        transform: 'translateX(-50%)', zIndex: 50, maxWidth: '86%',
        background: 'var(--ink)', color: 'var(--bg)', padding: '12px 18px', borderRadius: 14,
        fontSize: 13.5, fontWeight: 700, boxShadow: '0 8px 28px rgba(0,0,0,.28)', textAlign: 'center',
      }}
    >
      {text}
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
