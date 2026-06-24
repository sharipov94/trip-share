import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Screen, TopBar } from '../ui'
import { useActiveTripId } from '../api/queries'
import { uploadMemory } from '../lib/uploads'
import { tg } from '../tg'

const phases = [
  { id: 'before_activity', label: 'До активности' },
  { id: 'during_activity', label: 'Во время' },
  { id: 'after_activity', label: 'После активности' },
  { id: 'before_trip', label: 'До поездки' },
  { id: 'after_trip', label: 'После поездки' },
]

export default function PhotoUpload() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const tripId = useActiveTripId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState(phases[1].id)

  const onPick = (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = () => {
    if (!file) return inputRef.current?.click()
    tg.haptic('medium')
    // загрузка в фоне: уходим сразу, фото догрузится и без этого экрана
    uploadMemory(qc, tripId, file, phase)
    nav(-1)
  }

  return (
    <Screen nav={false}>
      <TopBar title="Загрузить фото" onBack={() => nav(-1)} />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div
        className="shot s2"
        style={{ width: '100%', height: 240, borderRadius: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div className="g" />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 38 }}>📷</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Снять или выбрать</div>
            </div>
          </>
        )}
      </div>

      <div className="field" style={{ marginTop: 18 }}>
        <label>Когда снято</label>
        <div className="strip" style={{ gap: 7 }}>
          {phases.map((p) => (
            <button key={p.id} className={p.id === phase ? 'btn-grad' : 'btn-ghost'} style={{ width: 'auto', flexShrink: 0, padding: '10px 14px', fontSize: 12.5 }} onClick={() => setPhase(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>

      <button className="btn-grad" style={{ marginTop: 10 }} onClick={submit}>
        {file ? 'Загрузить' : 'Выбрать фото'}
      </button>
      {file && <p className="sub" style={{ textAlign: 'center', marginTop: 10 }}>Загрузится в фоне — можно сразу вернуться к поездке</p>}
    </Screen>
  )
}
