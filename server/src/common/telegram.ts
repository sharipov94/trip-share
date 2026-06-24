import { createHmac } from 'crypto'

export interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  photo_url?: string
}

/**
 * Валидация Telegram WebApp initData (см. docs/07-auth.md).
 * Проверяет HMAC-подпись и возраст auth_date (replay-защита).
 * Возвращает данные пользователя или бросает при невалидности.
 */
export function validateInitData(
  initData: string,
  botToken: string,
  ttlSeconds: number,
): TelegramUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('initData: hash отсутствует')
  params.delete('hash')

  // data_check_string: пары key=value, отсортированные по ключу, через \n
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (!timingSafeEqualHex(computed, hash)) {
    throw new Error('initData: неверная подпись')
  }

  const authDate = Number(params.get('auth_date') ?? 0)
  if (!authDate || Date.now() / 1000 - authDate > ttlSeconds) {
    throw new Error('initData: устарел (replay-защита)')
  }

  const userRaw = params.get('user')
  if (!userRaw) throw new Error('initData: нет user')
  return JSON.parse(userRaw) as TelegramUser
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
