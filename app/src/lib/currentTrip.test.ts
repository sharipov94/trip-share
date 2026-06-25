import { describe, it, expect, beforeEach } from 'vitest'
import { getCurrentTripId, setCurrentTripId, clearCurrentTripId } from './currentTrip'

describe('currentTrip (last-opened)', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing stored', () => {
    expect(getCurrentTripId()).toBeNull()
  })

  it('round-trips the last-opened trip id', () => {
    setCurrentTripId('t9')
    expect(getCurrentTripId()).toBe('t9')
    clearCurrentTripId()
    expect(getCurrentTripId()).toBeNull()
  })
})
