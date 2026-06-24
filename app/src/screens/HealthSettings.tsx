import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar, Toggle } from '../ui'

export default function HealthSettings() {
  const nav = useNavigate()
  const [on, setOn] = useState(false)

  return (
    <Screen nav={false}>
      <TopBar title="Здоровье" onBack={() => nav(-1)} />

      <div className="day">
        <div className="lbl">Шаги · дистанция · калории</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 22, marginTop: 8, lineHeight: 1.1 }}>Добавь активность<br />в Travel Story</div>
      </div>

      <div className="row-item" style={{ marginTop: 16, padding: '16px 15px' }}>
        <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>Подключить Health / Fit</div><div className="sub">Apple Health · Google Fit</div></div>
        <Toggle on={on} onClick={() => setOn(!on)} />
      </div>

      <p className="sub" style={{ margin: '14px 4px' }}>
        Данные берём только с твоего согласия и показываем в личной статистике и Wrapped:
        шаги, дистанция, активные минуты, этажи, калории.
      </p>

      {on && <button className="btn-grad" style={{ marginTop: 8 }} onClick={() => nav(-1)}>Готово</button>}
    </Screen>
  )
}
