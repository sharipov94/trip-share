// Денежная логика в минимальных единицах (копейки/центы), без float.
// См. docs/05-expenses-and-settlements.md.

export const toCents = (v: string | number): number => Math.round(Number(v) * 100)
export const fromCents = (c: number): string => (c / 100).toFixed(2)

/**
 * Деление суммы на участников методом «largest remainder»:
 * сумма долей всегда равна исходной сумме (ни копейки не теряется/создаётся).
 * Остаток раздаётся по +1 центу первым участникам (детерминированно по userId).
 */
export function splitEqually(amountCents: number, userIds: string[]): Record<string, number> {
  const n = userIds.length
  const out: Record<string, number> = {}
  if (n === 0) return out
  const base = Math.floor(amountCents / n)
  let remainder = amountCents - base * n
  const ordered = [...userIds].sort()
  for (const id of ordered) {
    out[id] = base + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
  }
  return out
}

export interface Transfer {
  from: string
  to: string
  amount: number // cents
}

/**
 * Минимизация переводов (greedy debt simplification).
 * net > 0 — кредитор, net < 0 — должник. Возвращает ≤ N−1 переводов.
 */
export function minimizeTransfers(net: Record<string, number>): Transfer[] {
  const debtors: { id: string; v: number }[] = []
  const creditors: { id: string; v: number }[] = []
  for (const [id, v] of Object.entries(net)) {
    if (v < 0) debtors.push({ id, v: -v })
    else if (v > 0) creditors.push({ id, v })
  }
  debtors.sort((a, b) => b.v - a.v)
  creditors.sort((a, b) => b.v - a.v)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const t = Math.min(debtors[i].v, creditors[j].v)
    if (t > 0) transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: t })
    debtors[i].v -= t
    creditors[j].v -= t
    if (debtors[i].v === 0) i++
    if (creditors[j].v === 0) j++
  }
  return transfers
}
