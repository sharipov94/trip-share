import { createContext, useContext } from 'react'

export type Palette = 'sunset' | 'neon' | 'pastel' | 'acid'

export const PALETTES: { id: Palette; name: string; desc: string; grad: string }[] = [
  { id: 'sunset', name: 'Закат', desc: 'тёплая, тёмная', grad: 'linear-gradient(135deg,#ff3d9a,#ff5d73 38%,#ff9d3d)' },
  { id: 'neon', name: 'Неон', desc: 'электрик, тёмная', grad: 'linear-gradient(135deg,#00f5d4,#00bbf9 50%,#9b5de5)' },
  { id: 'pastel', name: 'Пастель', desc: 'нежная, светлая', grad: 'linear-gradient(135deg,#ffafcc,#ffc8dd 40%,#bde0fe)' },
  { id: 'acid', name: 'Кислота', desc: 'дерзкая, тёмная', grad: 'linear-gradient(135deg,#ccff00,#39ff14 45%,#00ffd5)' },
]

export type ThemeCtxValue = { palette: Palette; setPalette: (p: Palette) => void }
export const ThemeCtx = createContext<ThemeCtxValue>({ palette: 'sunset', setPalette: () => {} })

export const useTheme = () => useContext(ThemeCtx)
