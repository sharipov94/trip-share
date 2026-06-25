const KEY = 'tm_current_trip'

export const getCurrentTripId = (): string | null => localStorage.getItem(KEY)
export const setCurrentTripId = (id: string): void => localStorage.setItem(KEY, id)
export const clearCurrentTripId = (): void => localStorage.removeItem(KEY)

/** Текущая поездка: сохранённая (если ещё в списке) → первая активная → первая → ''. */
export function resolveCurrentTrip(trips: { id: string; status: string }[]): string {
  const stored = getCurrentTripId()
  if (stored && trips.some((t) => t.id === stored)) return stored
  return trips.find((t) => t.status === 'active')?.id ?? trips[0]?.id ?? ''
}
