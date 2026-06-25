// ISO-код валюты → символ для отображения. Неизвестный код показываем как есть.
const SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  GBP: '£',
  GEL: '₾',
  TRY: '₺',
}

export const currencySymbol = (code: string | null | undefined): string =>
  (code && (SYMBOLS[code.toUpperCase()] ?? code)) || '€'
