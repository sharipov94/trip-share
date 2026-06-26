import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useActiveTripId, useSummary, useTrip } from '../api/queries'

const DUR = 4500 // авто-переключение слайда, мс

export default function Wrapped({ personal = false }: { personal?: boolean }) {
  const nav = useNavigate()
  const tripId = useActiveTripId()
  const { data: trip } = useTrip(personal ? '' : tripId)
  const { data: slides, isLoading } = useSummary(tripId)
  const [i, setI] = useState(0)

  // авто-прокрутка: каждый слайд держится DUR, на последнем — авто-выход.
  // зависимость от i: ручной тап меняет i → таймер перезапускается.
  useEffect(() => {
    if (!slides || slides.length === 0) return
    const t = setTimeout(() => {
      if (i < slides.length - 1) setI(i + 1)
      else nav(-1)
    }, DUR)
    return () => clearTimeout(t)
  }, [i, slides, nav])

  // gate: трип-Wrapped доступен только для завершённой поездки
  if (!personal && trip && trip.status !== 'finished') {
    return (
      <div className="trip-card g-a" style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none', display: 'grid', placeItems: 'center' }}>
        <div className="wrap-slide" style={{ alignItems: 'center', textAlign: 'center', position: 'static', padding: '40px 30px' }}>
          <div className="wrap-cap">Wrapped будет доступен после завершения поездки</div>
          <button onClick={() => nav(-1)} className="btn-solid" style={{ marginTop: 20 }}>Назад</button>
        </div>
      </div>
    )
  }

  if (isLoading || !slides || slides.length === 0) {
    return (
      <div className="trip-card g-a" style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none', display: 'grid', placeItems: 'center' }}>
        <div className="wrap-slide" style={{ alignItems: 'center', textAlign: 'center', position: 'static', padding: '40px 30px' }}>
          <div className="wrap-cap">{isLoading ? 'Собираем историю…' : 'Пока недостаточно данных для Wrapped'}</div>
          <button onClick={() => nav(-1)} className="btn-solid" style={{ marginTop: 20 }}>Назад</button>
        </div>
      </div>
    )
  }

  const slide = slides[i]
  const header = personal ? 'Личный Wrapped' : 'Travel Wrapped'
  // текстовый слайд (название поездки / имя) начинается с буквы → меньший кегль и перенос;
  // числовые/символьные («143», «€612», «94 км», «👑») остаются крупными.
  const isText = /^\p{L}/u.test(slide.num.trim())
  const showCap = slide.cap && slide.cap.toLowerCase() !== header.toLowerCase()
  const next = () => (i < slides.length - 1 ? setI(i + 1) : nav(-1))
  const prev = () => (i > 0 ? setI(i - 1) : nav(-1))

  return (
    <div className={'trip-card ' + slide.cls} style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none' }}>
      <div className="wrap-bars">
        {slides.map((_, k) => (
          <span className="wrap-bar" key={k}>
            {k < i && <i className="fill done" />}
            {k === i && <i className="fill live" key={i} style={{ animationDuration: `${DUR}ms` }} />}
          </span>
        ))}
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 4 }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={prev} />
        <div style={{ flex: 2, cursor: 'pointer' }} onClick={next} />
      </div>

      <div className="wrap-slide" key={i}>
        <div className="lbl" style={{ opacity: .85 }}>{header}</div>
        <div className={(isText ? 'wrap-title' : 'wrap-num') + ' fade-up'} style={{ marginTop: 10 }}>{slide.num}</div>
        {showCap && <div className="wrap-cap fade-up">{slide.cap}</div>}
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
