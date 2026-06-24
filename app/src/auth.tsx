import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth } from './api/endpoints'
import { tokens, MOCK } from './api/client'
import { tg } from './tg'

type User = { id: string; firstName?: string | null; avatarUrl?: string | null; paymentDetails?: string | null }
type AuthState = { ready: boolean; user: User | null; refresh: () => Promise<void> }
const Ctx = createContext<AuthState>({ ready: false, user: null, refresh: async () => {} })

function fromTelegram(): User | null {
  const u = tg.user
  if (!u) return null
  return { id: '', firstName: u.first_name ?? null, avatarUrl: u.photo_url ?? null, paymentDetails: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ ready: boolean; user: User | null }>({ ready: false, user: fromTelegram() })

  const refresh = async () => {
    const me = await auth.me()
    const tgu = tg.user
    // бэкфилл имени/аватара из Telegram, если в БД пусто (чтобы участники видели имя+фото)
    const patch: { firstName?: string; avatarUrl?: string } = {}
    if (!me.firstName && tgu?.first_name) patch.firstName = tgu.first_name
    if (!me.avatarUrl && tgu?.photo_url) patch.avatarUrl = tgu.photo_url
    if (Object.keys(patch).length) auth.updateProfile(patch).catch(() => {})
    setState({
      ready: true,
      user: {
        id: me.id,
        firstName: me.firstName || tgu?.first_name || null,
        avatarUrl: me.avatarUrl || tgu?.photo_url || null,
        paymentDetails: me.paymentDetails ?? null,
      },
    })
  }

  useEffect(() => {
    tg.ready()
    ;(async () => {
      if (MOCK) {
        try { await refresh() } catch { setState({ ready: true, user: null }) }
        return
      }
      const login = async () => {
        if (tg.available) await auth.telegram(tg.initData)
        else await auth.dev()
      }
      try {
        if (!tokens.access) await login()
        await refresh()
      } catch {
        // токен протух ИЛИ ссылается на удалённого юзера → чистим и логинимся заново
        try {
          tokens.clear()
          await login()
          await refresh()
        } catch {
          setState((s) => ({ ready: true, user: s.user ?? fromTelegram() }))
        }
      }
    })()
  }, [])

  return <Ctx.Provider value={{ ...state, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
