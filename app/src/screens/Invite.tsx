import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Screen, TopBar, Av } from '../ui'
import { useActiveTripId, useInvite, useTrip } from '../api/queries'

export default function Invite() {
  const nav = useNavigate()
  const [copied, setCopied] = useState(false)
  const tripId = useActiveTripId()
  const { data: trip } = useTrip(tripId)
  const invite = useInvite(tripId)
  useEffect(() => {
    if (tripId) invite.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])
  const link = invite.data?.deepLink ?? 'генерируем ссылку…'

  return (
    <Screen nav={false}>
      <TopBar title="Пригласить" onBack={() => nav(-1)} />

      <div className="day" style={{ textAlign: 'center' }}>
        <div className="lbl">Поделись ссылкой</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{trip?.title ?? 'Поездка'}</div>
      </div>

      <div className="card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="grow" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</div>
        <button className="btn-ghost" style={{ padding: '9px 13px', fontSize: 12.5 }} onClick={() => { navigator.clipboard?.writeText(link); setCopied(true) }}>{copied ? '✓ Скопировано' : 'Копировать'}</button>
      </div>

      <button className="btn-grad" style={{ marginTop: 16 }} onClick={() => window.open('https://t.me/share/url?url=' + encodeURIComponent(link), '_blank')}>📲 Поделиться в Telegram</button>
      <p className="sub" style={{ textAlign: 'center', margin: '14px 0 22px' }}>Выбери контакты прямо в Telegram — список контактов мы не читаем.</p>

      <div className="sec"><h2>Уже в поездке</h2><div className="line" /><span className="cnt">{trip?.members.length ?? 0}</span></div>
      {trip?.members.map((m, i) => (
        <div key={m.id} className="row-item">
          <Av url={m.avatarUrl} initial={m.initial} bg={['var(--accent)', 'var(--ok)', 'var(--chip-bg)'][i % 3]} />
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{m.name}</div><div className="sub">{i === 0 ? 'организатор' : 'участник'}</div></div>
        </div>
      ))}

      <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/trip/' + tripId)}>Готово</button>
    </Screen>
  )
}
