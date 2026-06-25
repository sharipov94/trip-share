// Обёртка над Telegram WebApp (window.Telegram.WebApp).
// Всё в try/catch — вне Telegram приложение работает как обычный сайт.

type Haptic = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

interface Inset { top: number; bottom: number; left: number; right: number }
export interface TgUser { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string }
interface WebApp {
  initData: string
  initDataUnsafe?: { user?: TgUser; start_param?: string }
  colorScheme: 'light' | 'dark'
  platform: string
  safeAreaInset?: Inset
  contentSafeAreaInset?: Inset
  ready(): void
  expand(): void
  openTelegramLink?(url: string): void
  onEvent?(e: string, cb: () => void): void
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void }
  HapticFeedback?: { impactOccurred(style: Haptic): void; notificationOccurred(t: 'error' | 'success' | 'warning'): void }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp }
  }
}

const wa: WebApp | undefined =
  typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

export const tg = {
  /** true только когда запущено реально из Telegram (есть initData). */
  get available() {
    return !!wa && !!wa.initData
  },
  get initData() {
    return wa?.initData ?? ''
  },
  get colorScheme(): 'light' | 'dark' {
    return wa?.colorScheme ?? 'dark'
  },
  /** Данные пользователя из Telegram (имя, фото) — клиентский источник. */
  get user(): TgUser | null {
    return wa?.initDataUnsafe?.user ?? null
  },
  /** start_param из deep-link (?startapp=…) — токен инвайта. */
  get startParam(): string | null {
    return wa?.initDataUnsafe?.start_param ?? null
  },
  ready() {
    try {
      wa?.ready()
      wa?.expand()
      this.applyInsets()
      wa?.onEvent?.('safeAreaChanged', () => this.applyInsets())
      wa?.onEvent?.('contentSafeAreaChanged', () => this.applyInsets())
      wa?.onEvent?.('viewportChanged', () => this.applyInsets())
    } catch {
      /* noop */
    }
  },
  /** Отступ сверху под статус-бар + чроме Telegram (кнопки Закрыть/⋯). */
  applyInsets() {
    const top = (wa?.safeAreaInset?.top ?? 0) + (wa?.contentSafeAreaInset?.top ?? 0)
    // в Telegram гарантируем клиренс под кнопки, даже если инсеты не пришли; в браузере — лёгкий отступ
    const v = wa?.initData ? Math.max(top, 96) : Math.max(top, 14)
    document.documentElement.style.setProperty('--tg-top', v + 'px')
  },
  /** Открыть t.me-ссылку внутри Telegram (или новой вкладкой в браузере). */
  openTelegramLink(url: string) {
    try {
      if (wa?.openTelegramLink) wa.openTelegramLink(url)
      else window.open(url, '_blank')
    } catch {
      /* noop */
    }
  },
  haptic(style: Haptic = 'light') {
    try {
      wa?.HapticFeedback?.impactOccurred(style)
    } catch {
      /* noop */
    }
  },
  backButton: {
    show(cb: () => void) {
      try {
        wa?.BackButton.onClick(cb)
        wa?.BackButton.show()
      } catch {
        /* noop */
      }
    },
    hide(cb?: () => void) {
      try {
        wa?.BackButton.hide()
        if (cb) wa?.BackButton.offClick(cb)
      } catch {
        /* noop */
      }
    },
  },
}
