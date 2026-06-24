import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar, Toggle } from '../ui'

const initial = [
  { id: 'act', label: 'Новые активности', on: true },
  { id: 'rem', label: 'Напоминания (24ч / 2ч)', on: true },
  { id: 'debt', label: 'Напоминания о долгах', on: false },
  { id: 'prompt', label: 'Photo-prompt «сделай фото»', on: true },
  { id: 'photo', label: 'Новые фото в поездке', on: true },
  { id: 'summary', label: 'Travel Summary готов', on: true },
]

export default function NotificationSettings() {
  const nav = useNavigate()
  const [items, setItems] = useState(initial)
  return (
    <Screen nav={false}>
      <TopBar title="Уведомления" onBack={() => nav(-1)} />
      {items.map((it) => (
        <div key={it.id} className="row-item" style={{ padding: '14px 15px' }}>
          <div className="grow"><div className="ttl" style={{ fontSize: 14.5 }}>{it.label}</div></div>
          <Toggle on={it.on} onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, on: !x.on } : x)))} />
        </div>
      ))}
    </Screen>
  )
}
