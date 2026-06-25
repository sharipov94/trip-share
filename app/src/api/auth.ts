import { api, MOCK, tokens, session } from './client'
import { wait, clearUserCache } from './_internal'

export const auth = {
  async telegram(initData: string) {
    const r = await api<{ access: string; refresh: string; user: { id: string } }>(
      '/auth/telegram', { method: 'POST', body: { initData } },
    )
    tokens.set({ access: r.access, refresh: r.refresh })
    session.userId = r.user.id
    return r
  },
  async dev(firstName = 'Никита') {
    if (MOCK) return wait({ user: { id: 'me', firstName } })
    const r = await api<{ access: string; refresh: string; user: { id: string } }>(
      '/auth/dev', { method: 'POST', body: { firstName } },
    )
    tokens.set({ access: r.access, refresh: r.refresh })
    session.userId = r.user.id
    return r
  },
  async me() {
    if (MOCK) return wait({ id: 'me', firstName: 'Никита', avatarUrl: null, paymentDetails: null })
    const u = await api<{ id: string; firstName: string | null; avatarUrl: string | null; paymentDetails: string | null }>('/auth/me')
    session.userId = u.id
    return u
  },
  async updateTheme(theme: string) {
    if (MOCK) return wait({ ok: true })
    return api('/users/me', { method: 'PATCH', body: { theme } })
  },
  async updateProfile(body: { firstName?: string; paymentDetails?: string; avatarUrl?: string }) {
    if (MOCK) return wait({ ok: true })
    const r = await api('/users/me', { method: 'PATCH', body })
    clearUserCache() // имя/аватар могли измениться — сбросим кэш участников
    return r
  },
}
