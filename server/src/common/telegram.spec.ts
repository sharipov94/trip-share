import { createHmac } from 'crypto'
import { validateInitData } from './telegram'

// Собирает валидный initData с корректной HMAC-подписью под заданный токен.
function signInitData(botToken: string, authDate: number, user: object): string {
  const params = new URLSearchParams()
  params.set('auth_date', String(authDate))
  params.set('user', JSON.stringify(user))
  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}

describe('validateInitData', () => {
  const TOKEN = '123456:test-bot-token'
  const TTL = 86400
  const now = () => Math.floor(Date.now() / 1000)

  it('accepts a correctly signed, fresh initData', () => {
    const initData = signInitData(TOKEN, now(), { id: 42, first_name: 'Ann' })
    const user = validateInitData(initData, TOKEN, TTL)
    expect(user.id).toBe(42)
  })

  it('fails closed when the bot token is empty (forgery defense)', () => {
    // Подпись, сделанная под пустой токен, не должна проходить — иначе её мог бы подделать кто угодно.
    const forged = signInitData('', now(), { id: 1 })
    expect(() => validateInitData(forged, '', TTL)).toThrow()
  })

  it('rejects a tampered signature', () => {
    const initData = signInitData(TOKEN, now(), { id: 42 })
    const tampered = initData.replace(/hash=[0-9a-f]+/, 'hash=' + 'a'.repeat(64))
    expect(() => validateInitData(tampered, TOKEN, TTL)).toThrow('неверная подпись')
  })

  it('rejects stale initData (replay protection)', () => {
    const old = now() - TTL - 60
    const initData = signInitData(TOKEN, old, { id: 42 })
    expect(() => validateInitData(initData, TOKEN, TTL)).toThrow()
  })

  it('rejects a different signing token', () => {
    const initData = signInitData(TOKEN, now(), { id: 42 })
    expect(() => validateInitData(initData, 'other:token', TTL)).toThrow('неверная подпись')
  })
})
