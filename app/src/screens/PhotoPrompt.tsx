import { useNavigate } from 'react-router-dom'

export default function PhotoPrompt() {
  const nav = useNavigate()
  return (
    <div className="prompt" style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxShadow: 'none', padding: 30 }}>
      <div className="pulse" />
      <div className="timer" style={{ top: 24, right: 24 }}>⏱ 4:59</div>
      <span className="live"><i />LIVE · СЕЙЧАС</span>
      <h3 style={{ fontSize: 34, marginTop: 20 }}>Сделай фото<br />момента 🔥</h3>
      <p style={{ fontSize: 14, maxWidth: 260 }}>Снимают все одновременно — соберём событие глазами всей группы. Первый получает бейдж дня.</p>
      <button className="snap" style={{ marginTop: 26, fontSize: 16, padding: '16px 30px' }} onClick={() => nav('/moment')}>📸 Снять сейчас</button>
      <button onClick={() => nav(-1)} style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--p-ink)', opacity: .6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Пропустить</button>
    </div>
  )
}
