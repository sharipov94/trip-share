export type BalanceRow = { from: string; to: string; amount: number; toInitial?: string }
const ME = 'Ты'

/** Только строки баланса, где участвую я («Ты»). */
export const myBalances = (rows: BalanceRow[]): BalanceRow[] =>
  rows.filter((r) => r.from === ME || r.to === ME)

/** Мой нетто-итог: сколько должны мне минус сколько должен я. Плюс = мне должны. */
export const myNet = (rows: BalanceRow[]): number =>
  rows.reduce((n, r) => (r.to === ME ? n + r.amount : r.from === ME ? n - r.amount : n), 0)
