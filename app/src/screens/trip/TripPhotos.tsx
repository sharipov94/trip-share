import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Icon, Empty, Loading } from '../../components'
import { useMemories, useBingo } from '../../api/queries'
import { uploadBingo } from '../../lib/uploads'
import { tg } from '../../lib/tg'

export default function TripPhotos() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { id = '' } = useParams()
  const [seg, setSeg] = useState<'feed' | 'bingo'>('feed')
  const { data: photos } = useMemories(id)
  const { data: bingo, isLoading } = useBingo(id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const pickFor = (key: string) => { setActiveKey(key); inputRef.current?.click() }
  const onPick = (f: File | undefined) => {
    if (!f || !activeKey) return
    tg.haptic('light'); uploadBingo(qc, id, activeKey, f); setActiveKey(null)
  }

  return (
    <>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={seg === 'feed' ? 'on' : ''} onClick={() => setSeg('feed')}>Лента</button>
        <button className={seg === 'bingo' ? 'on' : ''} onClick={() => setSeg('bingo')}>Бинго</button>
      </div>

      {seg === 'feed' && (
        <>
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
          <button className="btn-grad" style={{ marginTop: 14 }} onClick={() => nav('/upload')}><Icon.plus /> Добавить фото</button>
        </>
      )}

      {seg === 'bingo' && (
        <>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />
          {isLoading && <Loading />}
          {bingo && (
            <>
              <div className="day" style={{ textAlign: 'center' }}>
                <div className="lbl">Собрано</div>
                <div className="big">{bingo.completed}<small>/{bingo.total}</small></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 16 }}>
                {bingo.tasks.map((c) => (
                  <div key={c.key} onClick={() => pickFor(c.key)} style={{
                    aspectRatio: '1', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
                    border: '1px solid var(--line)', position: 'relative',
                    background: c.done ? 'var(--g1)' : 'var(--card)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', padding: 9, color: c.done ? 'var(--on-grad)' : 'var(--ink)',
                    fontWeight: 700, fontSize: 11.5, lineHeight: 1.15,
                  }}>
                    {c.photoUrl && <img src={c.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: c.uploading ? 0.55 : 1 }} />}
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
        </>
      )}
    </>
  )
}
