import { useNavigate } from 'react-router-dom'
import { Screen } from '../ui'
import { trip } from '../data'

export default function Join() {
  const nav = useNavigate()
  return (
    <Screen nav={false}>
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <div className="lbl" style={{ color: 'var(--muted)' }}>Тебя пригласили в поездку</div>
        <div className="title-grad trip" style={{ fontSize: 34, marginTop: 10 }}>Барселона<br />2027</div>
      </div>

      <div className="card" style={{ marginTop: 26 }}>
        <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div className="sub" style={{ margin: 0 }}>Даты</div><div className="ttl" style={{ fontSize: 15 }}>12–19 июня</div></div>
          <div style={{ textAlign: 'right' }}><div className="sub" style={{ margin: 0 }}>Участники</div><div className="ttl" style={{ fontSize: 15 }}>{trip.members.length} человек</div></div>
        </div>
        <div className="avatars" style={{ marginTop: 16 }}>
          {trip.members.map((m, i) => (
            <span key={m.id} className={['a1', 'a2', 'a3', 'a1', 'a2'][i % 5]}>{m.initial}</span>
          ))}
        </div>
      </div>

      <button className="btn-grad" style={{ marginTop: 26 }} onClick={() => nav('/trip/' + trip.id)}>Присоединиться</button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 14 }}>Регистрация не нужна — входишь через Telegram</p>
    </Screen>
  )
}
