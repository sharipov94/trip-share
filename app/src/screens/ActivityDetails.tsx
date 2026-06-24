import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Screen, TopBar, Empty, Loading, Av } from '../ui'
import { useActivity, useVote, useComments, useAddComment } from '../api/queries'
import { tg } from '../tg'

const AV = ['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--accent)', 'var(--ok)']

export default function ActivityDetails() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data: act, isLoading } = useActivity(id ?? '')
  const { data: comments } = useComments(id ?? '')
  const addComment = useAddComment(id ?? '')
  const [text, setText] = useState('')
  const [vote, setVote] = useState<'go' | 'no' | null>(null)
  const voteMut = useVote(id ?? '')
  const cast = (v: 'go' | 'no') => {
    tg.haptic('light')
    setVote(v)
    voteMut.mutate(v === 'go' ? 'going' : 'not_going')
  }
  const send = () => {
    const body = text.trim()
    if (!body) return
    tg.haptic('light')
    setText('')
    addComment.mutate(body)
  }

  return (
    <Screen nav={false}>
      <TopBar title="Активность" onBack={() => nav(-1)} right={
        act ? <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12.5 }} onClick={() => nav('/activity/' + id + '/edit')}>Изменить</button> : undefined
      } />
      {isLoading && <Loading />}
      {act && (
        <>
          <div className="day">
            {act.time && <div className="lbl">{act.time}</div>}
            <div className="font-display" style={{ fontWeight: 900, fontSize: 26, marginTop: 8, lineHeight: 1.05 }}>{act.title}</div>
            {act.sub && <div style={{ fontSize: 13, fontWeight: 600, opacity: .9, marginTop: 6 }}>{act.sub}</div>}
          </div>

          <div className="vote" style={{ marginTop: 16 }}>
            <button className={'go' + (vote === 'go' ? ' sel' : '')} style={vote === 'go' ? { filter: 'brightness(1.1)' } : undefined} onClick={() => cast('go')}>Иду</button>
            <button className={'no' + (vote === 'no' ? ' sel' : '')} style={vote === 'no' ? { background: 'var(--soft)', color: 'var(--ink)', outline: '2px solid var(--accent)' } : undefined} onClick={() => cast('no')}>Не иду</button>
          </div>

          <div className="sec"><h2>Кто идёт</h2><div className="line" /><span className="cnt">{act.going.length}</span></div>
          {act.going.length === 0 && <Empty text="Пока никто не отметился" />}
          {act.going.map((p, i) => (
            <div key={i} className="row-item" style={{ padding: '11px 14px' }}>
              <Av url={p.avatarUrl} initial={p.initial} size={34} bg={AV[i % 5]} />
              <div className="grow"><div className="ttl" style={{ fontSize: 14.5 }}>{p.name}</div></div>
              <div className="sub" style={{ margin: 0, color: 'var(--ok)', fontWeight: 700 }}>идёт</div>
            </div>
          ))}

          <div className="sec"><h2>Комментарии</h2><div className="line" /><span className="cnt">{comments?.length ?? 0}</span></div>
          {comments && comments.length === 0 && <Empty text="Комментариев пока нет" />}
          {comments?.map((c, i) => (
            <div key={c.id} className="card" style={{ marginBottom: 9, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <Av url={c.avatarUrl} initial={c.initial} size={32} bg={AV[i % 5]} />
              <div><div className="ttl" style={{ fontSize: 13.5 }}>{c.author}</div><div className="sub" style={{ marginTop: 2 }}>{c.body}</div></div>
            </div>
          ))}
          <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Написать…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }} />
            <button className="btn-grad" style={{ width: 'auto', padding: '9px 16px' }} disabled={addComment.isPending} onClick={send}>↑</button>
          </div>

          <button className="btn-grad" style={{ width: '100%', marginTop: 14 }} onClick={() => nav('/activity/' + id + '/complete')}>Завершить и внести стоимость</button>
        </>
      )}
    </Screen>
  )
}
