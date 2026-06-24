import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useActiveTripId, useSummary } from '../api/queries'

export default function Wrapped({ personal = false }: { personal?: boolean }) {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const { data: slides, isLoading } = useSummary(tripId)
  const [i, setI] = useState(0)

  if (isLoading || !slides || slides.length === 0) {
    return (
      <div className="trip-card g-a" style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none', display: 'grid', placeItems: 'center' }}>
        <div className="wrap-slide" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="wrap-cap">{isLoading ? 'Собираем историю…' : 'Пока недостаточно данных для Wrapped'}</div>
          <button onClick={() => nav(-1)} className="btn-solid" style={{ marginTop: 20 }}>Назад</button>
        </div>
      </div>
    )
  }

  const slide = slides[i]
  const next = () => (i < slides.length - 1 ? setI(i + 1) : nav(-1))
  const prev = () => (i > 0 ? setI(i - 1) : nav(-1))

  return (
    <div className={'trip-card ' + slide.cls} style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none' }}>
      <div className="wrap-dots">
        {slides.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 4 }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={prev} />
        <div style={{ flex: 2, cursor: 'pointer' }} onClick={next} />
      </div>

      <div className="wrap-slide" key={i}>
        <div className="lbl" style={{ opacity: .85 }}>{personal ? 'Личный Wrapped' : 'Travel Wrapped'}</div>
        <div className="wrap-num fade-up" style={{ marginTop: 10 }}>{slide.num}</div>
        <div className="wrap-cap fade-up">{slide.cap}</div>
      </div>

      <button
        onClick={() => nav(-1)}
        className="btn-solid"
        style={{ position: 'absolute', bottom: 28, left: 30, right: 30, zIndex: 6, width: 'auto', justifyContent: 'center' }}
      >
        {i === slides.length - 1 ? 'Поделиться историей' : 'Тапни →'}
      </button>
    </div>
  )
}
