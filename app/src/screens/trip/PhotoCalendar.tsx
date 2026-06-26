import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTrip, useMemories } from '../../api/queries'
import { session } from '../../api/client'
import { buildSlots, slotStatus, slotKeyForUpload, slotKeyFromPhoto, type Slot } from '../../lib/photoSlots'
import { uploadMemory } from '../../lib/uploads'
import { tg } from '../../lib/tg'
import { memories, type Memory } from '../../api/memories'

interface PhotoCalendarProps { tripId: string }

const STATUS_ICON: Record<string, string> = { done: '✓', open: '📷', locked: '○' }

export default function PhotoCalendar({ tripId }: PhotoCalendarProps) {
  const qc = useQueryClient()
  const { data: trip } = useTrip(tripId)
  const { data: photos = [] } = useMemories(tripId)
  const [selected, setSelected] = useState<Slot | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null)

  if (!trip?.startDate || !trip?.endDate) {
    return <p className="sub" style={{ textAlign: 'center', padding: '40px 0' }}>Укажи даты поездки, чтобы увидеть календарь</p>
  }

  const slots = buildSlots(trip.startDate, trip.endDate)
  const myId = session.userId || 'me'
  const startDate = trip.startDate

  const onSlotTap = (slot: Slot) => {
    const st = slotStatus(slot, photos, myId)
    if (st === 'locked') return
    if (st === 'done') { setSelected(slot); return }
    // open → камера
    setPendingSlot(slot)
    tg.haptic('light')
    inputRef.current?.click()
  }

  const onFilePick = (f: File | undefined) => {
    if (!f || !pendingSlot) return
    const { phase, takenAt } = slotKeyForUpload(pendingSlot)
    uploadMemory(qc, tripId, f, phase, takenAt)
    setPendingSlot(null)
  }

  // Фото выбранного слота (только мои)
  const slotPhotos = selected
    ? photos.filter(
        (p) => p.userId === myId && slotKeyFromPhoto(p.phase, p.takenAt, startDate) === selected.key,
      )
    : []

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onFilePick(e.target.files?.[0])}
      />

      {/* горизонтальная лента */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 10, padding: '4px 18px 12px',
        margin: '0 -18px',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
      }}>
        {slots.map((slot) => {
          const st = slotStatus(slot, photos, myId)
          return (
            <div
              key={slot.key}
              onClick={() => onSlotTap(slot)}
              style={{
                flexShrink: 0, scrollSnapAlign: 'center',
                width: 64, borderRadius: 16,
                background: st === 'done' ? 'var(--g1)' : 'var(--card)',
                border: '1px solid var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0 8px',
                cursor: st === 'locked' ? 'default' : 'pointer',
                opacity: st === 'locked' ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, color: st === 'done' ? 'var(--on-grad)' : undefined }}>
                {slot.label}
              </span>
              <span style={{ fontSize: 20, marginTop: 6, color: st === 'done' ? 'var(--on-grad)' : undefined }}>
                {STATUS_ICON[st]}
              </span>
            </div>
          )
        })}
      </div>

      {/* карточка выбранного слота */}
      {selected && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{selected.label === 'До' ? 'До поездки' : selected.label === 'После' ? 'После поездки' : `День ${selected.dayIndex}`}</span>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, width: 'auto' }} onClick={() => setSelected(null)}>✕</button>
          </div>
          {slotPhotos.length > 0 ? (
            <>
              <div className="shot" style={{ width: '100%', height: 260, borderRadius: 20, overflow: 'hidden' }}>
                <img src={slotPhotos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button
                className="btn-ghost"
                style={{ marginTop: 10, width: 'auto', padding: '8px 18px', fontSize: 13 }}
                onClick={async () => {
                  // delete the existing photo optimistically, then open picker
                  const toDelete = slotPhotos[0]
                  qc.setQueryData<Memory[]>(['memories', tripId], (old = []) => old.filter(m => m.id !== toDelete.id))
                  memories.remove(toDelete.id).catch(() => qc.invalidateQueries({ queryKey: ['memories', tripId] }))
                  setPendingSlot(selected)
                  inputRef.current?.click()
                }}
              >
                Заменить фото
              </button>
            </>
          ) : (
            <p className="sub" style={{ textAlign: 'center', padding: '30px 0' }}>Фото ещё нет</p>
          )}
        </div>
      )}
    </>
  )
}
