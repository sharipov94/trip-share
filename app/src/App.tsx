import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tg } from './lib/tg'
import { useAuth } from './auth-context'
import { trips } from './api/trips'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Trips from './screens/Trips'
import Finance from './screens/Finance'
import TripShell from './screens/trip/TripShell'
import Plan from './screens/trip/Plan'
import TripExpenses from './screens/trip/TripExpenses'
import TripPhotos from './screens/trip/TripPhotos'
import Members from './screens/trip/Members'
import Summary from './screens/trip/Summary'
import TripNew from './screens/TripNew'
import TripEdit from './screens/TripEdit'
import Invite from './screens/Invite'
import Splash from './screens/Splash'
import Balance from './screens/Balance'
import ExpenseNew from './screens/ExpenseNew'
import ExpenseDetails from './screens/ExpenseDetails'
import Receipt from './screens/Receipt'
import Settle from './screens/Settle'
import ActivityDetails from './screens/ActivityDetails'
import ActivityNew from './screens/ActivityNew'
import ActivityEdit from './screens/ActivityEdit'
import ActivityComplete from './screens/ActivityComplete'
import PhotoUpload from './screens/PhotoUpload'
import Bingo from './screens/Bingo'
import Wrapped from './screens/Wrapped'
import Profile from './screens/Profile'
import ProfileEdit from './screens/ProfileEdit'
import NotificationSettings from './screens/NotificationSettings'
import HealthSettings from './screens/HealthSettings'

const ROOT = ['/', '/trips', '/finance', '/profile']

/** Управляет нативной кнопкой «Назад» Telegram в зависимости от роута. */
function TelegramChrome() {
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    const back = () => nav(-1)
    if (ROOT.includes(loc.pathname)) {
      tg.backButton.hide()
    } else {
      tg.backButton.show(back)
    }
    return () => tg.backButton.hide(back)
  }, [loc.pathname, nav])
  return null
}

/** Авто-вступление в поездку по инвайт-ссылке (?startapp=token). */
function StartParamJoin() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { ready, user } = useAuth()
  const done = useRef(false)
  useEffect(() => {
    const token = tg.startParam
    if (done.current || !token || !ready || !user) return
    done.current = true
    trips
      .join(token)
      .then((t) => {
        qc.invalidateQueries({ queryKey: ['trips'] })
        nav('/trip/' + t.id)
      })
      .catch(() => {})
  }, [ready, user, nav, qc])
  return null
}

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('tm_onboarded') === '1')
  const finishOnboarding = () => {
    localStorage.setItem('tm_onboarded', '1')
    setOnboarded(true)
  }
  return (
    <div className="page">
      <div className="phone">
        <TelegramChrome />
        <StartParamJoin />
        {!onboarded && <Onboarding onDone={finishOnboarding} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/splash" element={<Splash />} />

          <Route path="/trips" element={<Trips />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/trip/new" element={<TripNew />} />
          <Route path="/trip/:id/edit" element={<TripEdit />} />
          <Route path="/trip/:id" element={<TripShell />}>
            <Route index element={<Navigate to="plan" replace />} />
            <Route path="plan" element={<Plan />} />
            <Route path="expenses" element={<TripExpenses />} />
            <Route path="photos" element={<TripPhotos />} />
            <Route path="members" element={<Members />} />
            <Route path="summary" element={<Summary />} />
          </Route>
          <Route path="/invite" element={<Invite />} />

          <Route path="/expense/new" element={<ExpenseNew />} />
          <Route path="/expense/:id" element={<ExpenseDetails />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/settle" element={<Settle />} />

          <Route path="/activity/new" element={<ActivityNew />} />
          <Route path="/activity/:id/edit" element={<ActivityEdit />} />
          <Route path="/activity/:id/complete" element={<ActivityComplete />} />
          <Route path="/activity/:id" element={<ActivityDetails />} />

          <Route path="/upload" element={<PhotoUpload />} />
          <Route path="/bingo" element={<Bingo />} />

          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="/wrapped/me" element={<Wrapped personal />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/profile/notifications" element={<NotificationSettings />} />
          <Route path="/profile/health" element={<HealthSettings />} />
        </Routes>
      </div>
    </div>
  )
}
