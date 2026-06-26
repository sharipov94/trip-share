import { describe, it, expect } from 'vitest'
import { buildSlots, slotStatus, slotKeyForUpload, slotKeyFromPhoto } from './photoSlots'
import type { Memory } from '../api/memories'

const START = '2027-06-12'
const END   = '2027-06-14'  // 3 дня: 12, 13, 14

describe('buildSlots', () => {
  it('returns before_trip + 3 days + after_trip', () => {
    const slots = buildSlots(START, END)
    expect(slots.map((s) => s.key)).toEqual([
      'before_trip', 'day_1', 'day_2', 'day_3', 'after_trip',
    ])
  })

  it('day slots have correct labels', () => {
    const slots = buildSlots(START, END)
    expect(slots[1].label).toBe('Д1')
    expect(slots[3].label).toBe('Д3')
  })

  it('before_trip label is До', () => {
    expect(buildSlots(START, END)[0].label).toBe('До')
  })

  it('after_trip label is После', () => {
    const slots = buildSlots(START, END)
    expect(slots[slots.length - 1].label).toBe('После')
  })
})

describe('slotStatus', () => {
  const slots = buildSlots(START, END)
  const beforeSlot = slots[0]   // before_trip
  const day1Slot   = slots[1]   // day_1 = 2027-06-12
  const day2Slot   = slots[2]   // day_2 = 2027-06-13

  const myPhoto: Memory = {
    id: 'p1', url: '', author: 'Me', phase: 'before_trip', takenAt: '2027-06-10T12:00:00Z', userId: 'me',
  }
  const otherPhoto: Memory = {
    id: 'p2', url: '', author: 'Аня', phase: 'during_trip', takenAt: '2027-06-12T12:00:00Z', userId: 'other',
  }

  it('locked when slot date is in the future', () => {
    const past = new Date('2026-01-01')
    expect(slotStatus(beforeSlot, [], 'me', past)).toBe('locked')
  })

  it('open when slot is due and no photo from me', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(beforeSlot, [], 'me', future)).toBe('open')
  })

  it('done when I have a photo for this slot', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(beforeSlot, [myPhoto], 'me', future)).toBe('done')
  })

  it('open (not done) when only others have a photo', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(day1Slot, [otherPhoto], 'me', future)).toBe('open')
  })
})

describe('slotKeyForUpload', () => {
  it('before_trip returns correct phase and midnight date', () => {
    const slots = buildSlots(START, END)
    const r = slotKeyForUpload(slots[0])
    expect(r.phase).toBe('before_trip')
    expect(r.takenAt).toContain('2027-06-12')
  })

  it('day_2 returns during_trip and day 2 date', () => {
    const slots = buildSlots(START, END)
    const r = slotKeyForUpload(slots[2])
    expect(r.phase).toBe('during_trip')
    expect(r.takenAt).toContain('2027-06-13')
  })
})

describe('slotKeyFromPhoto', () => {
  it('maps before_trip phase to before_trip key', () => {
    expect(slotKeyFromPhoto('before_trip', null, START)).toBe('before_trip')
  })

  it('maps during_trip + day 1 date to day_1', () => {
    expect(slotKeyFromPhoto('during_trip', '2027-06-12T12:00:00Z', START)).toBe('day_1')
  })

  it('maps during_trip + day 2 date to day_2', () => {
    expect(slotKeyFromPhoto('during_trip', '2027-06-13T06:00:00Z', START)).toBe('day_2')
  })

  it('maps after_trip phase to after_trip key', () => {
    expect(slotKeyFromPhoto('after_trip', null, START)).toBe('after_trip')
  })
})
