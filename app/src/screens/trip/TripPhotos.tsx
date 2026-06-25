import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Empty } from '../../components'
import { useMemories } from '../../api/queries'

export default function TripPhotos() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: photos } = useMemories(id)
  return (
    <>
      <div style={{ display: 'flex', gap: 9, marginBottom: 14 }}>
        <button className="btn-grad" style={{ flex: 1 }} onClick={() => nav('/upload')}><Icon.plus /> Фото</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => nav('/bingo')}>🎯 Bingo</button>
      </div>
      {(!photos || photos.length === 0) && <Empty text="Фотографий пока нет. Загрузи первое воспоминание 📸" />}
      {photos && photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {photos.map((p) => (
            <div key={p.id} className="shot" style={{ width: '100%', height: 104 }}>
              <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {p.author && <div className="tag">{p.author}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
