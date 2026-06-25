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
