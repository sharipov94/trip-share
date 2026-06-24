import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Screen, TopBar, Loading } from '../ui'
import { useActiveTripId, useBingo } from '../api/queries'
import { uploadBingo } from '../lib/uploads'
import { tg } from '../tg'

export default function Bingo() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const tripId = useActiveTripId()
  const { data, isLoading } = useBingo(tripId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const pickFor = (key: string) => {
    setActiveKey(key)
    inputRef.current?.click()
  }
  const onPick = (f: File | undefined) => {
    if (!f || !activeKey) return
    tg.haptic('light')
    uploadBingo(qc, tripId, activeKey, f)
    setActiveKey(null)
  }

  return (
    <Screen nav={false}>
      <TopBar title="Bingo поездки" onBack={() => nav(-1)} />
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />

      {isLoading && <Loading />}
      {data && (
        <>
          <div className="day" style={{ textAlign: 'center' }}>
            <div className="lbl">Собрано</div>
            <div className="big">{data.completed}<small>/{data.total}</small></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 16 }}>
            {data.tasks.map((c) => (
              <div
                key={c.key}
                onClick={() => pickFor(c.key)}
                style={{
                  aspectRatio: '1', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
                  border: '1px solid var(--line)', position: 'relative',
                  background: c.done ? 'var(--g1)' : 'var(--card)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  textAlign: 'center', padding: 9, color: c.done ? 'var(--on-grad)' : 'var(--ink)',
                  fontWeight: 700, fontSize: 11.5, lineHeight: 1.15,
                }}
              >
                {c.photoUrl && (
                  <img src={c.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: (c as any).uploading ? 0.55 : 1 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, textShadow: c.photoUrl ? '0 1px 4px rgba(0,0,0,.6)' : 'none', color: c.photoUrl ? '#fff' : undefined }}>
                  {c.done && !c.photoUrl && <div style={{ fontSize: 18, marginBottom: 3 }}>✓</div>}
                  {c.text}
                </div>
              </div>
            ))}
          </div>
          <p className="sub" style={{ textAlign: 'center', marginTop: 16 }}>Тапни клетку и загрузи фото-кадр</p>
        </>
      )}
    </Screen>
  )
}
