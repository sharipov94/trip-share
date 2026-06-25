import { useEffect, useState, type ReactNode } from 'react'
import { tg } from '../lib/tg'
import { ThemeCtx, type Palette } from './palettes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<Palette>(() => {
    const saved = localStorage.getItem('tm_theme') as Palette | null
    if (saved) return saved
    // первый запуск: подстроиться под тему Telegram (свет → пастель, тьма → закат)
    return tg.colorScheme === 'light' ? 'pastel' : 'sunset'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', palette)
    localStorage.setItem('tm_theme', palette)
  }, [palette])
  return <ThemeCtx.Provider value={{ palette, setPalette }}>{children}</ThemeCtx.Provider>
}
