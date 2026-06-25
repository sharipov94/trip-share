import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Av } from '../../components'
import { useTrip } from '../../api/queries'

const AV = ['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--accent)', 'var(--ok)']

export default function Members() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  return (
    <>
      <button className="btn-grad" style={{ margin: '4px 0 6px' }} onClick={() => nav('/invite')}><Icon.plus /> Пригласить участников</button>
      <button className="btn-ghost" style={{ width: '100%', marginBottom: 6 }} onClick={() => nav('/trip/' + id + '/edit')}>Изменить поездку</button>
      <div className="sec"><h2>Участники</h2><div className="line" /><span className="cnt">{trip?.members.length ?? 0}</span></div>
      {trip?.members.map((m, i) => (
        <div key={m.id} className="row-item">
          <Av url={m.avatarUrl} initial={m.initial} bg={AV[i % 5]} />
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{m.name}</div><div className="sub">{i === 0 ? 'организатор' : 'участник'}</div></div>
        </div>
      ))}
    </>
  )
}
