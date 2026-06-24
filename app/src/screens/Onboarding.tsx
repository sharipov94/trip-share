import { useState } from 'react'

const STEPS = [
  { emoji: '🧭', title: 'Вся поездка\nв одном месте', text: 'Планы, активности и голосование — собираем группу без бесконечных чатов.', cls: 'g-a' },
  { emoji: '💸', title: 'Деньги\nбез споров', text: 'Общие расходы, чеки, и баланс «кто кому должен» — считается сам.', cls: 'g-c' },
  { emoji: '📸', title: 'Travel Story\nи моменты', text: 'Фото со всех, момент глазами всей группы и итоговая история поездки.', cls: 'g-b' },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const next = () => (last ? onDone() : setI(i + 1))

  return (
    <div className={'trip-card ' + step.cls} style={{ position: 'absolute', inset: 0, borderRadius: 0, margin: 0, boxShadow: 'none', zIndex: 100 }}>
      <div className="wrap-dots">
        {STEPS.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}
      </div>

      <div className="wrap-slide" key={i} style={{ justifyContent: 'flex-end', paddingBottom: 160 }}>
        <div style={{ fontSize: 64 }}>{step.emoji}</div>
        <div className="wrap-num fade-up" style={{ fontSize: 40, whiteSpace: 'pre-line', lineHeight: .98, marginTop: 16 }}>{step.title}</div>
        <div className="wrap-cap fade-up" style={{ textTransform: 'none', fontWeight: 600, fontSize: 16, opacity: .9, marginTop: 14, maxWidth: '90%' }}>{step.text}</div>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 30, right: 30, zIndex: 6 }}>
        <button className="btn-solid" style={{ width: '100%', justifyContent: 'center' }} onClick={next}>
          {last ? 'Поехали 🚀' : 'Дальше'}
        </button>
        {!last && (
          <button onClick={onDone} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: 'var(--on-grad)', opacity: .7, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Пропустить</button>
        )}
      </div>
    </div>
  )
}
