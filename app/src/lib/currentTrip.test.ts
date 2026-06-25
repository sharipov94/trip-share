import { describe, it, expect, beforeEach } from 'vitest'
import { getCurrentTripId, setCurrentTripId, clearCurrentTripId, resolveCurrentTrip } from './currentTrip'

describe('currentTrip', () => {
  beforeEach(() => localStorage.clear())

  it('persists and reads the id', () => {
    setCurrentTripId('t1')
    expect(getCurrentTripId()).toBe('t1')
    clearCurrentTripId()
    expect(getCurrentTripId()).toBe(null)
  })

  it('resolves stored id when still present', () => {
    setCurrentTripId('t2')
    expect(resolveCurrentTrip([{ id: 't1', status: 'active' }, { id: 't2', status: 'finished' }])).toBe('t2')
  })

  it('falls back to first active when stored id is gone', () => {
    setCurrentTripId('missing')
    expect(resolveCurrentTrip([{ id: 't1', status: 'planning' }, { id: 't2', status: 'active' }])).toBe('t2')
  })

  it('falls back to first trip when none active', () => {
    expect(resolveCurrentTrip([{ id: 't1', status: 'planning' }])).toBe('t1')
  })

  it('returns empty string for no trips', () => {
    expect(resolveCurrentTrip([])).toBe('')
  })
})
