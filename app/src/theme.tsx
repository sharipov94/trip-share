import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { tg } from './tg'

export type Palette = 'sunset' | 'neon' | 'pastel' | 'acid'

export const PALETTES: { id: Palette; name: string; desc: string; grad: string }[] = [
  { id: 'sunset', name: 'Закат', desc: 'тёплая, тёмная', grad: 'linear-gradient(135deg,#ff3d9a,#ff5d73 38%,#ff9d3d)' },
  { id: 'neon', name: 'Неон', desc: 'электрик, тёмная', grad: 'linear-gradient(135deg,#00f5d4,#00bbf9 50%,#9b5de5)' },
  { id: 'pastel', name: 'Пастель', desc: 'нежная, светлая', grad: 'linear-gradient(135deg,#ffafcc,#ffc8dd 40%,#bde0fe)' },
  { id: 'acid', name: 'Кислота', desc: 'дерзкая, тёмная', grad: 'linear-gradient(135deg,#ccff00,#39ff14 45%,#00ffd5)' },
]

type Ctx = { palette: Palette; setPalette: (p: Palette) => void }
const ThemeCtx = createContext<Ctx>({ palette: 'sunset', setPalette: () => {} })

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

export const useTheme = () => useContext(ThemeCtx)
