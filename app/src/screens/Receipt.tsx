import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { Screen, TopBar } from '../ui'
import { useActiveTripId, useReceiptOcr } from '../api/queries'
import { tg } from '../tg'

export default function Receipt() {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const ocr = useReceiptOcr(tripId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const onPick = (f: File | undefined) => {
    if (!f) return
    setPreview(URL.createObjectURL(f))
    tg.haptic('medium')
    ocr.mutate(f)
  }

  const data = ocr.data

  return (
    <Screen nav={false}>
      <TopBar title="Чек · OCR" onBack={() => nav(-1)} />

      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />

      <div className="shot s3" style={{ width: '100%', height: 170, borderRadius: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden' }} onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div className="g" />
            <div style={{ position: 'relative', zIndex: 2, color: '#fff', fontWeight: 800, fontSize: 13, background: 'rgba(0,0,0,.35)', padding: '6px 12px', borderRadius: 10, backdropFilter: 'blur(6px)' }}>🧾 Снять / выбрать чек</div>
          </>
        )}
      </div>

      {ocr.isPending && (
        <div className="card" style={{ textAlign: 'center', marginTop: 16 }}>
          <div className="lbl" style={{ color: 'var(--accent)' }}>● Распознаём чек…</div>
        </div>
      )}

      {ocr.isError && (
        <div className="card" style={{ textAlign: 'center', marginTop: 16 }}>
          <div className="sub" style={{ margin: 0 }}>Не удалось распознать. Попробуй другое фото.</div>
        </div>
      )}

      {data && (
        <>
          <div className="sec"><h2>Позиции</h2><div className="line" /><span className="cnt">{data.items.length}</span></div>
          {data.items.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: '20px 0' }}>Позиции не распознались — введи вручную</div>}
          {data.items.map((r, i) => (
            <div key={i} className="row-item" style={{ padding: '12px 14px' }}>
              <div className="grow"><div className="ttl" style={{ fontSize: 14.5 }}>{r.name}</div></div>
              <div className="amt">€{r.price}</div>
            </div>
          ))}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div className="lbl" style={{ color: 'var(--muted)' }}>Итого распознано</div>
            <div className="font-display" style={{ fontWeight: 900, fontSize: 22 }}>€{data.total}</div>
          </div>
          <button className="btn-grad" style={{ marginTop: 14 }} onClick={() => nav(-1)}>Использовать сумму</button>
        </>
      )}
    </Screen>
  )
}
