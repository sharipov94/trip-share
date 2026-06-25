import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Screen, TopBar, Av } from '../components'
import { useAuth } from '../auth-context'
import { useUpdateProfile } from '../api/queries'

export default function ProfileEdit() {
  const nav = useNavigate()
  const { user, refresh } = useAuth()
  const update = useUpdateProfile()
  const [name, setName] = useState(user?.firstName ?? '')
  const [pay, setPay] = useState(user?.paymentDetails ?? '')

  // подтягиваем актуальные значения, когда /me догрузился (реквизиты/имя)
  useEffect(() => {
    if (user?.firstName != null) setName(user.firstName)
    if (user?.paymentDetails != null) setPay(user.paymentDetails)
  }, [user?.firstName, user?.paymentDetails])

  const save = () => {
    update.mutate(
      { firstName: name.trim() || undefined, paymentDetails: pay },
      { onSettled: async () => { await refresh(); nav(-1) } },
    )
  }

  return (
    <Screen nav={false}>
      <TopBar title="Профиль" onBack={() => nav(-1)} />

      <div style={{ textAlign: 'center', margin: '6px 0 18px' }}>
        <div style={{ display: 'inline-block' }}><Av url={user?.avatarUrl} initial={(name[0] ?? '?')} size={80} /></div>
        <div className="sub" style={{ marginTop: 10 }}>Фото — из Telegram</div>
      </div>

      <div className="field"><label>Имя</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" /></div>

      <div className="sec"><h2>Реквизиты для переводов</h2><div className="line" /></div>
      <div className="field">
        <label>Карта / телефон / банк</label>
        <input value={pay} onChange={(e) => setPay(e.target.value)} placeholder="Напр. 4276… · Тинькофф" />
      </div>
      <p className="sub" style={{ margin: '0 4px 16px' }}>🔒 Реквизиты видят только те, кому ты переводишь долг. Хранятся в зашифрованном виде.</p>

      <button className="btn-grad" disabled={update.isPending} onClick={save}>
        {update.isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </Screen>
  )
}
