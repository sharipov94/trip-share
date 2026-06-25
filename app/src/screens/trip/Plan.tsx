import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Loading, Empty } from '../../components'
import { useActivities } from '../../api/queries'

export default function Plan() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: activities, isLoading } = useActivities(id)
  return (
    <>
      <div className="sec"><h2>Все активности</h2><div className="line" /><span className="cnt">{activities?.length ?? 0}</span></div>
      {isLoading && <Loading />}
      {activities && activities.length === 0 && <Empty text="Активностей пока нет" />}
      {activities?.map((a) => (
        <div key={a.id} className={'act' + (a.night ? ' night' : '')} style={{ cursor: 'pointer' }} onClick={() => nav('/activity/' + a.id)}>
          <div className="bar" />
          <div className="time"><b>{a.time}</b><s>{a.part}</s></div>
          <div className="body">
            <div className="ttl">{a.title}</div>
            <div className="sub">{a.sub}</div>
            <span className="badge ok">{a.status === 'completed' ? `Завершена ✓ · ${a.going} ходили` : a.status === 'confirmed' ? `Подтверждена · идут ${a.going}` : `Голосование · ${a.going} за`}</span>
          </div>
        </div>
      ))}
      <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/activity/new')}><Icon.plus /> Добавить активность</button>
    </>
  )
}
