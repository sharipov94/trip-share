// Низкоуровневый клиент: хранение токенов, fetch с Bearer, авто-refresh, mock-флаг.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** Пустой VITE_API_URL → работаем на заглушках (см. api/*.ts). */
export const MOCK = !BASE

/** Текущий пользователь (id из /auth/me) — для разметки «Ты» в балансе и т.п. */
export const session = { userId: '' }

const A = 'tm_access'
const R = 'tm_refresh'

export const tokens = {
  get access() {
    return localStorage.getItem(A)
  },
  get refresh() {
    return localStorage.getItem(R)
  },
  set(t: { access: string; refresh: string }) {
    localStorage.setItem(A, t.access)
    localStorage.setItem(R, t.refresh)
  },
  clear() {
    localStorage.removeItem(A)
    localStorage.removeItem(R)
  },
}

type Opts = { method?: string; body?: unknown; headers?: Record<string, string> }

// эндпоинты, выдающие токены — их refresh'ить нельзя (иначе цикл)
const NO_REFRESH = ['/auth/refresh', '/auth/telegram', '/auth/dev']

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const res = await raw(path, opts)
  // один авто-refresh при 401 (в т.ч. для /auth/me — это обычный защищённый роут)
  if (res.status === 401 && tokens.refresh && !NO_REFRESH.includes(path)) {
    const ok = await tryRefresh()
    if (ok) return unwrap<T>(await raw(path, opts))
  }
  return unwrap<T>(res)
}

function raw(path: string, opts: Opts) {
  return fetch(`${BASE}/api/v1${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(tokens.access ? { authorization: `Bearer ${tokens.access}` } : {}),
      ...opts.headers,
    },
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  })
}

async function tryRefresh(): Promise<boolean> {
  const res = await raw('/auth/refresh', { method: 'POST', body: { refresh: tokens.refresh } })
  if (!res.ok) {
    tokens.clear()
    return false
  }
  tokens.set(await res.json())
  return true
}

/** Загрузка файла (multipart). content-type выставит браузер с boundary. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: 'POST',
    headers: tokens.access ? { authorization: `Bearer ${tokens.access}` } : {},
    body: form,
  })
  return unwrap<T>(res)
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
