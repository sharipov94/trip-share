import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar } from '../ui'
import { moment } from '../data'

export default function Moment() {
  const nav = useNavigate()
  const [active, setActive] = useState(0)
  const cur = moment.shots[active]

  return (
    <Screen nav={false}>
      <TopBar title="Момент" onBack={() => nav(-1)} />

      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 22, textTransform: 'uppercase' }}>{moment.title}</div>
        <div className="moment-h" style={{ justifyContent: 'center', margin: '6px 0 16px' }}>
          <span>{moment.count} РАКУРСОВ ОДНОГО СОБЫТИЯ ✦</span>
        </div>
      </div>

      {/* big current shot */}
      <div className={'shot ' + cur.cls} style={{ width: '100%', height: 360, borderRadius: 26 }}>
        <div className="g" />
        <div className="tag" style={{ fontSize: 13, padding: '6px 12px' }}>📸 {cur.author}</div>
      </div>

      {/* thumbnails */}
      <div className="strip" style={{ marginTop: 14 }}>
        {moment.shots.map((sh, i) => (
          <div
            key={sh.id}
            className={'shot ' + sh.cls}
            style={{ width: 70, height: 90, outline: i === active ? '2.5px solid var(--accent)' : 'none' }}
            onClick={() => setActive(i)}
          >
            <div className="g" /><div className="tag" style={{ fontSize: 9, padding: '2px 6px' }}>{sh.author}</div>
          </div>
        ))}
      </div>

      <div className="prompt" style={{ marginTop: 22 }}>
        <div className="pulse" />
        <h3 style={{ marginTop: 0 }}>Добавь свой<br />ракурс 🔥</h3>
        <p>Чем больше людей — тем живее момент</p>
        <button className="snap">+ Моё фото</button>
      </div>
    </Screen>
  )
}
