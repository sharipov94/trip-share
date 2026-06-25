/** Аватар: фото из Telegram, иначе кружок с буквой. */
export function Av({ url, initial, size = 40, bg = 'var(--accent)', border }: { url?: string | null; initial: string; size?: number; bg?: string; border?: string }) {
  const common = { width: size, height: size, borderRadius: '50%', flexShrink: 0, border } as const
  if (url) return <img src={url} alt="" style={{ ...common, objectFit: 'cover' }} />
  return <div style={{ ...common, background: bg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.42, color: '#1a1030' }}>{initial}</div>
}

export function Avatar({ initial, bg = 'var(--accent)', size = 40 }: { initial: string; bg?: string; size?: number }) {
  return (
    <div className="av" style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#1a1030' }}>
      {initial}
    </div>
  )
}
