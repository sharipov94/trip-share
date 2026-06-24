import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Шифрование чувствительных полей (payment_details) на уровне приложения.
// AES-256-GCM, ключ из ENCRYPTION_KEY (32 байта hex). См. docs/09-security.md §3.
const PREFIX = 'enc:v1:'

function key(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? ''
  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY должен быть 32 байта (64 hex)')
  return buf
}

export function encrypt(plain: string | null): string | null {
  if (plain == null || plain === '') return plain
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(value: string | null): string | null {
  if (value == null || !value.startsWith(PREFIX)) return value // legacy/plaintext
  const buf = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
