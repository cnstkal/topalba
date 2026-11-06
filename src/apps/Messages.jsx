import { useState } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META, CHARACTERS, ME } from '../data/characters'
import { Avatar } from '../components/Overlays'
import Thread from '../components/Thread'
import { fmtTime } from '../utils'

export default function Messages({ params }) {
  const { state } = useGame()
  const initial = params?.thread && params.thread.startsWith('msg:') ? params.thread : null
  const [tid, setTid] = useState(initial)

  const rows = Object.keys(THREAD_META)
    .filter((id) => THREAD_META[id].app === 'messages' && (state.threads[id] || []).length > 0)
    .map((id) => ({ id, list: state.threads[id] }))
    .sort((a, b) => b.list[b.list.length - 1].ts - a.list[a.list.length - 1].ts)

  if (tid) return <Thread id={tid} onBack={() => setTid(null)} />

  return (
    <div className="page">
      <div className="nav">
        <span className="nav-btn">편집</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </div>
      <div className="large-title">메시지</div>
      <div className="search-field">검색</div>
      <div className="scroll">
        {rows.map(({ id, list }) => {
          const last = list[list.length - 1]
          const unread = list.some((m) => m.unread)
          const meta = THREAD_META[id]
          return (
            <button key={id} className="msg-row" onClick={() => setTid(id)}>
              <div className="dot-col">{unread && <i className="unread-dot" />}</div>
              {meta.group ? <div className="avatar group-av big">{meta.members.length + 1}</div> : <Avatar id={meta.members[0]} size={48} />}
              <div className="msg-main">
                <div className="msg-top">
                  <b>{meta.title}</b>
                  <span>{fmtTime(last.ts)}</span>
                </div>
                <div className="msg-prev">{last.from !== ME && meta.group ? `${CHARACTERS[last.from]?.name}: ` : ''}{last.text}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
