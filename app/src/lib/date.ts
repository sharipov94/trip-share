/** Сегодняшняя дата в локальной таймзоне как YYYY-MM-DD (без UTC-сдвига). */
export const todayStr = (): string => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
