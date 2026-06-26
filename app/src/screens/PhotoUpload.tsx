import { useNavigate, useLocation } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Screen, TopBar } from '../components'
import { useActiveTripId } from '../api/queries'
import { uploadMemory } from '../lib/uploads'
import { tg } from '../lib/tg'

export default function PhotoUpload() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const tripId = useActiveTripId()
  const location = useLocation()
  const slotState = (location.state as { phase?: string; takenAt?: string } | null) ?? {}
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const onPick = (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = () => {
    if (!file) return inputRef.current?.click()
    tg.haptic('medium')
    uploadMemory(qc, tripId, file, slotState.phase, slotState.takenAt)
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

      <button className="btn-grad" style={{ marginTop: 18 }} onClick={submit}>
        {file ? 'Загрузить' : 'Выбрать фото'}
      </button>
      {file && <p className="sub" style={{ textAlign: 'center', marginTop: 10 }}>Загрузится в фоне — можно сразу вернуться к поездке</p>}
    </Screen>
  )
}
