import { useNavigate } from 'react-router-dom'
import { Screen, Empty, Loading, Av } from '../ui'
import { useState } from 'react'
import { useAuth } from '../auth'
import { useActiveTripId, useTrip, useActivities, useExpenses, useBalance } from '../api/queries'

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [vote, setVote] = useState<'go' | 'no' | null>(null)

  const tripId = useActiveTripId()
  const { data: trip, isLoading } = useTrip(tripId)
  const { data: activities } = useActivities(tripId)
  const { data: expenses } = useExpenses(tripId)
  const { data: settlements } = useBalance(tripId)

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const myDebt = settlements?.find((s) => s.from === 'Ты')
  const today = (activities ?? []).slice(0, 3)

  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Привет, {user?.firstName ?? 'путешественник'} 👋</div>
          <div className="title-grad trip">{trip?.title ?? 'TravelMate'}</div>
        </div>
        {trip && trip.members.length > 0 && (
          <div className="avatars">
            {trip.members.slice(0, 4).map((m, i) => (
              <span key={m.id} style={{ marginLeft: i ? -10 : 0, display: 'inline-flex' }}>
                <Av url={m.avatarUrl} initial={m.initial} size={34} bg={['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--soft)'][i % 4]} border="2px solid var(--bg)" />
              </span>
            ))}
          </div>
        )}
      </div>

      {isLoading && <Loading />}

      {!isLoading && !trip && (
        <Empty text="Пока нет активной поездки. Создай первую во вкладке «Поездки»." />
      )}

      {trip && (
        <>
          {/* сводка поездки — реальные цифры, клик открывает поездку */}
          <div className="day" style={{ cursor: 'pointer' }} onClick={() => nav('/trip/' + trip.id)}>
            <div className="row">
              <div>
                <div className="lbl">Поездка{trip.dates ? ' · ' + trip.dates : ''}</div>
                <div className="font-display" style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>{trip.title}</div>
              </div>
              <div className="mini">
                <b>{trip.members.length}</b>участников
                <b style={{ marginTop: 8 }}>€{total}</b>потрачено
              </div>
            </div>
          </div>

          {/* активности */}
          <div className="sec"><h2>Активности</h2><div className="line" /><span className="cnt">{today.length}</span></div>
          {today.length === 0 && <Empty text="Активностей пока нет" />}
          {today.map((a) => (
            <div key={a.id} className={'act' + (a.night ? ' night' : '')} style={{ cursor: 'pointer' }} onClick={() => nav('/activity/' + a.id)}>
              <div className="bar" />
              <div className="time"><b>{a.time || '—'}</b><s>{a.part}</s></div>
              <div className="body">
                <div className="ttl">{a.title}</div>
                <div className="sub">{a.sub}</div>
                {a.status === 'confirmed' ? (
                  <span className="badge ok">Подтверждена</span>
                ) : (
                  <div className="vote">
                    <button className={'go' + (vote === 'go' ? ' sel' : '')} onClick={(e) => { e.stopPropagation(); setVote('go') }}>Иду</button>
                    <button className={'no' + (vote === 'no' ? ' sel' : '')} onClick={(e) => { e.stopPropagation(); setVote('no') }}>Не иду</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* долги — из реального баланса */}
          <div className="sec"><h2>Долги</h2><div className="line" /></div>
          {myDebt ? (
            <div className="debt">
              <div className="k">Надо вернуть</div>
              <div className="v">Ты должен {myDebt.to} <em>·</em> €{myDebt.amount}</div>
              <button className="btn-solid" style={{ marginTop: 15 }} onClick={() => nav('/balance')}>
                Перевести <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          ) : (
            <Empty text="Долгов нет 🎉" />
          )}
        </>
      )}
    </Screen>
  )
}
