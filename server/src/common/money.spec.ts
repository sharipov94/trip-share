import { toCents, fromCents, splitEqually, minimizeTransfers } from './money'

describe('money', () => {
  describe('toCents / fromCents', () => {
    it('converts to/from minor units without float drift', () => {
      expect(toCents('10.10')).toBe(1010)
      expect(toCents(0.1 + 0.2)).toBe(30)
      expect(fromCents(1010)).toBe('10.10')
    })
  })

  describe('splitEqually', () => {
    it('splits evenly when the amount divides cleanly', () => {
      expect(splitEqually(900, ['a', 'b', 'c'])).toEqual({ a: 300, b: 300, c: 300 })
    })

    it('hands the remainder out deterministically and conserves the total', () => {
      const out = splitEqually(1000, ['c', 'a', 'b'])
      expect(out).toEqual({ a: 334, b: 333, c: 333 })
      const sum = Object.values(out).reduce((s, v) => s + v, 0)
      expect(sum).toBe(1000)
    })

    it('returns an empty split for zero participants', () => {
      expect(splitEqually(500, [])).toEqual({})
    })
  })

  describe('minimizeTransfers', () => {
    it('settles balances and conserves the moved amount', () => {
      const transfers = minimizeTransfers({ a: -100, b: -50, c: 150 })
      const moved = transfers.reduce((s, t) => s + t.amount, 0)
      expect(moved).toBe(150)
    })

    it('uses at most N-1 transfers', () => {
      const transfers = minimizeTransfers({ a: -100, b: -50, c: 75, d: 75 })
      expect(transfers.length).toBeLessThanOrEqual(3)
    })
  })
})
