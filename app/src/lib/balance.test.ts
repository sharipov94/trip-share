import { it, expect } from 'vitest'
import { myBalances, myNet } from './balance'

const rows = [
  { from: 'Ты', to: 'Аня', amount: 42 },
  { from: 'Боб', to: 'Ты', amount: 10 },
  { from: 'Боб', to: 'Аня', amount: 5 },
]

it('myBalances keeps only rows involving me', () => {
  expect(myBalances(rows).map((r) => r.amount).sort((a, b) => a - b)).toEqual([10, 42])
})
it('myNet = owed_to_me - i_owe', () => {
  expect(myNet(rows)).toBe(10 - 42)
})
it('empty → []/0', () => {
  expect(myBalances([])).toEqual([])
  expect(myNet([])).toBe(0)
})
