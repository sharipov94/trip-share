import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar, Icon, Loading, Empty, Av } from '../components'
import { useTrip, useTrips, useActivities, useExpenses, useMemories } from '../api/queries'

type Tab = 'overview' | 'activities' | 'expenses' | 'memories' | 'summary'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'activities', label: 'Активности' },
  { id: 'expenses', label: 'Расходы' },
  { id: 'memories', label: 'Фото' },
  { id: 'summary', label: 'Итоги' },
]
const AV = ['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--accent)', 'var(--ok)']
const STATUS_LABEL: Record<string, string> = { planning: 'Планируется', active: 'Активна', finished: 'Завершена' }

export default function TripDetails({
  initialTab = 'overview',
  showTabs = true,
  excludeTabs = [],
}: {
  initialTab?: Tab
  showTabs?: boolean
  excludeTabs?: Tab[]
}) {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: list } = useTrips()
  const tripId = id ?? list?.[0]?.id ?? ''
  const { data: trip } = useTrip(tripId)
  const { data: activities, isLoading: actLoading } = useActivities(tripId)
  const { data: expenses, isLoading: expLoading } = useExpenses(tripId)
  const { data: photos } = useMemories(tripId)

  const [tab, setTab] = useState<Tab>(initialTab)
  useEffect(() => setTab(initialTab), [initialTab])

  const visibleTabs = TABS.filter((t) => !excludeTabs.includes(t.id))
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0

  return (
    <Screen>
      <TopBar title={trip?.title ?? 'Поездка'} onBack={() => nav('/trips')} />
      {showTabs && (
        <div className="tabs">
          {visibleTabs.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      )}

      {tab === 'overview' && (
        <>
          <div className="day">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="lbl">{STATUS_LABEL[trip?.status ?? 'planning']}{trip?.dates ? ' · ' + trip.dates : ''}</div>
                <div className="font-display" style={{ fontWeight: 900, fontSize: 24, marginTop: 8, lineHeight: 1.05, position: 'relative' }}>{trip?.title}</div>
              </div>
              <button onClick={() => nav('/trip/' + tripId + '/edit')} className="btn-solid" style={{ padding: '8px 12px', fontSize: 13, position: 'relative' }}>Изменить</button>
            </div>
          </div>
          <button className="btn-grad" style={{ margin: '4px 0 6px' }} onClick={() => nav('/invite')}><Icon.plus /> Пригласить участников</button>
          <div className="sec"><h2>Участники</h2><div className="line" /><span className="cnt">{trip?.members.length ?? 0}</span></div>
          {trip?.members.map((m, i) => (
            <div key={m.id} className="row-item">
              <Av url={m.avatarUrl} initial={m.initial} bg={AV[i % 5]} />
              <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{m.name}</div><div className="sub">{i === 0 ? 'организатор' : 'участник'}</div></div>
            </div>
          ))}
        </>
      )}

      {tab === 'activities' && (
        <>
          <div className="sec"><h2>Все активности</h2><div className="line" /><span className="cnt">{activities?.length ?? 0}</span></div>
          {actLoading && <Loading />}
          {activities && activities.length === 0 && <Empty text="Активностей пока нет" />}
          {activities?.map((a) => (
            <div key={a.id} className={'act' + (a.night ? ' night' : '')} style={{ cursor: 'pointer' }} onClick={() => nav('/activity/' + a.id)}>
              <div className="bar" />
              <div className="time"><b>{a.time}</b><s>{a.part}</s></div>
              <div className="body">
                <div className="ttl">{a.title}</div>
                <div className="sub">{a.sub}</div>
                <span className="badge ok">{a.status === 'completed' ? `Завершена ✓ · ${a.going} ходили` : a.status === 'confirmed' ? `Подтверждена · идут ${a.going}` : `Голосование · ${a.going} за`}</span>
              </div>
            </div>
          ))}
          <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/activity/new')}><Icon.plus /> Добавить активность</button>
        </>
      )}

      {tab === 'expenses' && (
        <>
          <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div className="sub" style={{ margin: 0 }}>Всего потрачено</div><div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>€{total}</div></div>
            <button className="btn-ghost" onClick={() => nav('/balance')}>Баланс →</button>
          </div>
          {expLoading && <Loading />}
          {expenses && expenses.length === 0 && <Empty text="Расходов пока нет" />}
          {expenses?.map((e) => (
            <div key={e.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/expense/' + e.id)}>
              <div className="av" style={{ background: 'var(--g3)', color: 'var(--on-grad)' }}>{e.cat[0]}</div>
              <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{e.title}</div><div className="sub">{e.cat} · платил {e.payer}</div></div>
              <div className="amt">{e.cur}{e.amount}</div>
            </div>
          ))}
          <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/expense/new')}><Icon.plus /> Новый расход</button>
        </>
      )}

      {tab === 'memories' && (
        <>
          <div style={{ display: 'flex', gap: 9, marginBottom: 14 }}>
            <button className="btn-grad" style={{ flex: 1 }} onClick={() => nav('/upload')}><Icon.plus /> Фото</button>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => nav('/bingo')}>🎯 Bingo</button>
          </div>
          {(!photos || photos.length === 0) && <Empty text="Фотографий пока нет. Загрузи первое воспоминание 📸" />}
          {photos && photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {photos.map((p) => (
                <div key={p.id} className="shot" style={{ width: '100%', height: 104 }}>
                  <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.author && <div className="tag">{p.author}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'summary' && (
        <>
          <div className="day" onClick={() => nav('/wrapped')} style={{ cursor: 'pointer' }}>
            <div className="lbl">Travel Wrapped</div>
            <div className="font-display" style={{ fontWeight: 900, fontSize: 24, marginTop: 8, lineHeight: 1.05 }}>История поездки<br />в слайдах →</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            {[
              [String(trip?.members.length ?? 0), 'участников'],
              [String(activities?.length ?? 0), 'активностей'],
              [String(photos?.length ?? 0), 'фото'],
              ['€' + total, 'расходы'],
            ].map(([n, l]) => (
              <div key={l} className="card" style={{ textAlign: 'center', padding: '18px 10px' }}>
                <div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>{n}</div>
                <div className="sub" style={{ margin: 0 }}>{l}</div>
              </div>
            ))}
          </div>
          <button className="btn-grad" style={{ marginTop: 16 }} onClick={() => nav('/wrapped')}>Смотреть Wrapped</button>
        </>
      )}
    </Screen>
  )
}
