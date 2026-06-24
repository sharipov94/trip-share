import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const nav = useNavigate()
  return (
    <div className="day" style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxShadow: 'none' }}>
      <div className="font-display" style={{ fontWeight: 900, fontSize: 40, letterSpacing: '-1px', textTransform: 'uppercase' }}>
        Travel<br />Mate
      </div>
      <div className="lbl" style={{ marginTop: 14, opacity: .85 }}>Путешествуем вместе</div>
      <div style={{ marginTop: 40, display: 'flex', gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', opacity: .9, animation: `blink 1s ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <button className="btn-solid" style={{ position: 'absolute', bottom: 40, left: 40, right: 40, width: 'auto', justifyContent: 'center' }} onClick={() => nav('/')}>
        Войти через Telegram
      </button>
    </div>
  )
}
