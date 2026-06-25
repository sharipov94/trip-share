const KEY = 'tm_current_trip'

/** id последней открытой поездки: ставится в TripShell при входе,
 *  читается push-экранами (расход/баланс/активность/фото/инвайт/wrapped). */
export const getCurrentTripId = (): string | null => localStorage.getItem(KEY)
export const setCurrentTripId = (id: string): void => localStorage.setItem(KEY, id)
export const clearCurrentTripId = (): void => localStorage.removeItem(KEY)
