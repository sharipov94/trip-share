import { describe, it, expect } from 'vitest'
import { getTrip, tripList } from './data'

describe('getTrip', () => {
  it('returns the trip matching the given id', () => {
    expect(getTrip('alps').id).toBe('alps')
  })

  it('falls back to the first trip for an unknown id', () => {
    expect(getTrip('does-not-exist')).toBe(tripList[0])
  })

  it('falls back to the first trip when id is undefined', () => {
    expect(getTrip()).toBe(tripList[0])
  })
})
