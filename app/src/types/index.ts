// Кросс-доменные frontend-типы (view-модели). Backend-формы живут в api/_internal.ts.

export type Trip = {
  id: string
  title: string
  dates: string
  startDate?: string | null
  endDate?: string | null
  status: 'active' | 'finished' | 'planning'
  cls: string
  currency: string
  members: { id: string; name: string; initial: string; avatarUrl?: string | null }[]
}

// View-модель строки активности (списки на Home и в TripDetails).
export type ActivityItem = {
  id: string
  title: string
  time: string
  part: string
  sub: string
  status: 'voting' | 'confirmed' | 'completed'
  going: number
  night: boolean
}
