import { useEffect, useRef } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META, CHARACTERS, ME } from '../data/characters'
import { Avatar } from './Overlays'
import { fmtTime } from '../utils'

// 메시지 앱과 SNS DM 이 공용으로 쓰는 대화 화면
export default function Thread({ id, onBack, dm }) {
  const { state, actions } = useGame()
  const meta = THREAD_META[id]
  const msgs = state.threads[id] || []
  const last = msgs[msgs.length - 1]
  const choices = last && last.choices && state.picked[last.id] === undefined ? last.choices : null
  const endRef = useRef(null)

  useEffect(() => {
    actions.markRead(id)
  }, [msgs.length])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs.length, !!choices])

  const lastOut = [...msgs].reverse().find((m) => m.from === ME)

  return (
    <div className={`thread ${dm ? 'thread-dm' : ''}`}>
      <div className="thread-head">
        <button className="back" onClick={onBack}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2L2 10l8 8" />
          </svg>
        </button>
        <div className="thread-who">
          {meta.group ? <div className="avatar group-av">{meta.members.length + 1}</div> : <Avatar id={meta.members[0]} size={40} />}
          <span>{meta.title}</span>
        </div>
      </div>

      <div className="bubbles">
        {msgs.map((m, i) => {
          const mine = m.from === ME
          const prev = msgs[i - 1]
          const showTime = !prev || m.ts - prev.ts > 5 * 60 * 1000
          const sameSender = prev && prev.from === m.from && !showTime
          return (
            <div key={m.id}>
              {showTime && <div className="stamp">{fmtTime(m.ts)}</div>}
              {meta.group && !mine && !sameSender && <div className="sender">{CHARACTERS[m.from]?.name}</div>}
              <div className={`bubble-row ${mine ? 'me' : 'them'}`}>
                <div className={`bubble ${mine ? 'me' : 'them'}`}>{m.text}</div>
              </div>
              {mine && lastOut && lastOut.id === m.id && m.read && <div className="receipt">읽음 {fmtTime(m.ts)}</div>}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {choices && (
        <div className="choices">
          {choices.map((c, i) => (
            <button key={i} onClick={() => actions.choose(id, last.id, i)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="composer">
        <div className="composer-plus">+</div>
        <div className="composer-field">{choices ? '아래 선택지 중에서 답장하세요' : dm ? '메시지 입력...' : 'iMessage'}</div>
      </div>
    </div>
  )
}
