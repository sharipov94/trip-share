import { useNavigate, useParams } from 'react-router-dom'
import { Empty, Av } from '../../components'
import { useTrip, useActivities, useExpenses, useBalance, useMemories } from '../../api/queries'
import { myBalances, myNet } from '../../lib/balance'

export default function Overview() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const { data: activities } = useActivities(id)
  const { data: expenses } = useExpenses(id)
  const { data: balance } = useBalance(id)
  const { data: photos } = useMemories(id)

  const mine = myBalances(balance ?? [])
  const net = myNet(balance ?? [])
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const cur = trip?.currency || '€'
  const upcoming = (activities ?? []).slice(0, 2)
  const recent = [...(expenses ?? [])].slice(0, 3)

  return (
    <>
      {/* сводка-бар — только на «Обзор» */}
      <div className="pills">
        <div className="pill"><span className="pl">Потрачено</span><b>{cur}{total}</b></div>
        <div className="pill">
          <span className="pl">{net >= 0 ? 'Должны тебе' : 'Ты должен'}</span>
          <b className={net > 0 ? 'pos' : net < 0 ? 'neg' : ''}>{net === 0 ? 'Рассчитано' : cur + Math.abs(net)}</b>
        </div>
        <div className="pill"><span className="pl">Участники</span><b>{trip?.members.length ?? 0}</b></div>
      </div>

      {/* мой баланс — все долги, не только один */}
      <div className="sec"><h2>Мой баланс</h2><div className="line" />
        {mine.length > 0 && <button className="cnt" onClick={() => nav('/balance')}>Все →</button>}
      </div>
      {mine.length === 0 ? <Empty text="Долгов нет 🎉" /> : mine.map((b, i) => {
        const owe = b.from === 'Ты'
        const who = owe ? b.to : b.from
        return (
          <div key={i} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/balance')}>
            <Av initial={who[0]} bg={owe ? 'var(--soft)' : 'var(--ok)'} />
            <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{who}</div>
              <div className="sub">{owe ? 'Ты должен' : 'Должен тебе'}</div></div>
            <div className="amt" style={{ color: owe ? '#e5484d' : 'var(--ok)' }}>{owe ? '-' : '+'}{cur}{b.amount}</div>
          </div>
        )
      })}

      {/* ближайшие активности */}
      <div className="sec"><h2>Ближайшие</h2><div className="line" />
        <button className="cnt" onClick={() => nav(`/trip/${id}/activities`)}>Все →</button></div>
      {upcoming.length === 0 ? (
        <Empty text="Мероприятий пока нет" />
      ) : upcoming.map((a) => (
        <div key={a.id} className={'act' + (a.night ? ' night' : '')} style={{ cursor: 'pointer' }} onClick={() => nav('/activity/' + a.id)}>
          <div className="bar" /><div className="time"><b>{a.time || '—'}</b><s>{a.part}</s></div>
          <div className="body"><div className="ttl">{a.title}</div><div className="sub">{a.sub}</div></div>
        </div>
      ))}

      {/* недавние расходы */}
      <div className="sec"><h2>Недавние расходы</h2><div className="line" />
        <button className="cnt" onClick={() => nav(`/trip/${id}/expenses`)}>Все →</button></div>
      {recent.length === 0 ? (
        <Empty text="Расходов пока нет" />
      ) : recent.map((e) => (
        <div key={e.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/expense/' + e.id)}>
          <div className="av" style={{ background: 'var(--g3)', color: 'var(--on-grad)' }}>{e.cat[0]}</div>
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{e.title}</div><div className="sub">платил {e.payer}</div></div>
          <div className="amt">{e.cur}{e.amount}</div>
        </div>
      ))}

      {/* фото-превью */}
      {photos && photos.length > 0 && (
        <>
          <div className="sec"><h2>Фото</h2><div className="line" />
            <button className="cnt" onClick={() => nav(`/trip/${id}/photos`)}>{photos.length} →</button></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {photos.slice(0, 6).map((p) => (
              <div key={p.id} className="shot" style={{ width: '100%', height: 90 }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* wrapped */}
      <div className="day" onClick={() => nav('/wrapped')} style={{ cursor: 'pointer', marginTop: 16 }}>
        <div className="lbl">Travel Wrapped</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 22, marginTop: 6, lineHeight: 1.05 }}>
          История поездки в слайдах →
        </div>
      </div>
    </>
  )
}
