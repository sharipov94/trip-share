import { useNavigate } from 'react-router-dom'
import { Screen, Loading, Empty } from '../components'
import { useAllExpenses } from '../api/queries'

export default function Finance() {
  const nav = useNavigate()
  const { data: items, isLoading } = useAllExpenses()
  const all = items ?? []

  // итоги по валютам (без конвертации — см. spec §6)
  const totals: Record<string, number> = {}
  for (const e of all) totals[e.cur] = (totals[e.cur] ?? 0) + e.amount

  // разбивка по категориям (по первой валюте для простоты отображения)
  const byCat: Record<string, number> = {}
  for (const e of all) byCat[e.cat] = (byCat[e.cat] ?? 0) + e.amount
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const catMax = cats[0]?.[1] ?? 1

  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Все поездки</div>
          <div className="title-grad trip" style={{ fontSize: 30 }}>Финансы</div>
        </div>
      </div>

      {isLoading && <Loading />}
      {!isLoading && all.length === 0 && <Empty text="Расходов пока нет ни в одной поездке" />}

      {all.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="sub" style={{ margin: '0 0 8px' }}>Всего потрачено</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(totals).map(([cur, sum]) => (
                <div key={cur} className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>{cur}{sum.toFixed(0)}</div>
              ))}
            </div>
          </div>

          {cats.length > 0 && (
            <>
              <div className="sec"><h2>По категориям</h2><div className="line" /><span className="cnt">{cats.length}</span></div>
              {cats.map(([cat, sum]) => (
                <div key={cat} style={{ margin: '0 2px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>
                    <span>{cat}</span><span>{Math.round(sum)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: 'var(--soft)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(6, (sum / catMax) * 100)}%`, background: 'var(--g1)' }} />
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="sec"><h2>Все расходы</h2><div className="line" /><span className="cnt">{all.length}</span></div>
          {all.map((e) => (
            <div key={e.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/expense/' + e.id)}>
              <div className="av" style={{ background: 'var(--g3)', color: 'var(--on-grad)' }}>{e.cat[0]}</div>
              <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{e.title}</div><div className="sub">{e.tripTitle} · {e.cat}</div></div>
              <div className="amt">{e.cur}{e.amount}</div>
            </div>
          ))}
        </>
      )}
    </Screen>
  )
}
