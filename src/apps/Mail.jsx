import { useState } from 'react'
import { useGame } from '../engine/store'
import { fmtTime } from '../utils'

export default function Mail() {
  const { state, actions } = useGame()
  const [box, setBox] = useState('inbox')
  const [openId, setOpenId] = useState(null)
  const list = box === 'inbox' ? state.mails : state.sent
  const m = [...state.mails, ...state.sent].find((x) => x.id === openId)

  if (m) {
    return (
      <div className="page">
        <div className="nav">
          <button className="back txt" onClick={() => setOpenId(null)}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L2 10l8 8" />
            </svg>
            {box === 'inbox' ? '받은 편지함' : '보낸 편지함'}
          </button>
        </div>
        <div className="scroll mail-detail">
          <h2>{m.subject}</h2>
          <div className="mail-from">
            <div className="mail-av">{(box === 'inbox' ? m.from : m.to).slice(0, 1)}</div>
            <div>
              <b>{box === 'inbox' ? m.from : `받는 사람: ${m.to}`}</b>
              <div className="muted">{m.addr}</div>
            </div>
            <span className="muted r">{fmtTime(m.ts)}</span>
          </div>
          <div className="mail-body">{m.body}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav">
        {box === 'sent' ? (
          <button className="back txt" onClick={() => setBox('inbox')}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L2 10l8 8" />
            </svg>
            받은 편지함
          </button>
        ) : (
          <span />
        )}
        <span className="nav-btn">편집</span>
      </div>
      <div className="large-title">{box === 'inbox' ? '받은 편지함' : '보낸 편지함'}</div>
      <div className="scroll">
        {list.map((x) => (
          <button
            key={x.id}
            className="mail-row"
            onClick={() => {
              setOpenId(x.id)
              if (box === 'inbox') actions.mailRead(x.id)
            }}
          >
            <div className="dot-col">{box === 'inbox' && !x.read && <i className="unread-dot" />}</div>
            <div className="mail-main">
              <div className="msg-top">
                <b>{box === 'inbox' ? x.from : x.to}</b>
                <span>{fmtTime(x.ts)}</span>
              </div>
              <div className="mail-sub">{x.subject}</div>
              <div className="msg-prev">{x.preview}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <button className={box === 'inbox' ? 'on' : ''} onClick={() => setBox('inbox')}>받은 편지함</button>
        <button className={box === 'sent' ? 'on' : ''} onClick={() => setBox('sent')}>보낸 편지함</button>
      </div>
    </div>
  )
}
