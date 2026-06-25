// Кросс-доменные frontend-типы (view-модели). Backend-формы живут в api/_internal.ts.

export type Trip = {
  id: string
  title: string
  dates: string
  startDate?: string | null
  endDate?: string | null
  status: 'active' | 'finished' | 'planning'
  cls: string
  day: number
  totalDays: number
  stats: { km: number; photos: number }
  members: { id: string; name: string; initial: string; avatarUrl?: string | null }[]
}
