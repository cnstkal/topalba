import { useState } from 'react'
import { useGame } from '../engine/store'
import { CHARACTERS, CONTACTS } from '../data/characters'
import { Avatar } from '../components/Overlays'
import { fmtTime } from '../utils'

export default function PhoneApp() {
  const { state } = useGame()
  const [tab, setTab] = useState('recents')
  const [filter, setFilter] = useState('all')
  const [calling, setCalling] = useState(null)
  const [keys, setKeys] = useState('')

  if (calling) {
    const c = CHARACTERS[calling]
    return (
      <div className="calling">
        <Avatar id={calling} size={90} />
        <div className="ring-name">{c.name}</div>
        <div className="ring-sub">연결 중…</div>
        <button className="ring-btn red" onClick={() => setCalling(null)}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" style={{ transform: 'rotate(135deg)' }}>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
          </svg>
        </button>
      </div>
    )
  }

  const recents = state.recents.filter((r) => filter === 'all' || r.missed)

  return (
    <div className="page">
      {tab === 'recents' && (
        <>
          <div className="nav"><span className="nav-btn">편집</span><div className="seg"><button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>전체</button><button className={filter === 'missed' ? 'on' : ''} onClick={() => setFilter('missed')}>부재중</button></div><span style={{ width: 30 }} /></div>
          <div className="large-title">최근 통화</div>
          <div className="scroll">
            {recents.length === 0 && <div className="empty">최근 통화가 없습니다.</div>}
            {recents.map((r) => (
              <button key={r.id} className="call-row" onClick={() => setCalling(r.from)}>
                <div>
                  <b className={r.missed ? 'red-txt' : ''}>{CHARACTERS[r.from]?.name}</b>
                  <span>{r.missed ? '부재중 전화' : '휴대전화'}</span>
                </div>
                <em>{fmtTime(r.ts)}</em>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === 'contacts' && (
        <>
          <div className="nav"><span className="nav-btn">그룹</span><span /></div>
          <div className="large-title">연락처</div>
          <div className="search-field">검색</div>
          <div className="scroll">
            {CONTACTS.map((c) => (
              <button key={c.id} className="msg-row" onClick={() => setCalling(c.id)}>
                <Avatar id={c.id} size={40} />
                <div className="msg-main"><b>{CHARACTERS[c.id].name}</b><div className="msg-prev">{c.phone}</div></div>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === 'keypad' && (
        <div className="keypad-wrap">
          <div className="keys-out">{keys || ' '}</div>
          <div className="keys">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button key={k} onClick={() => setKeys((s) => (s + k).slice(0, 13))}>{k}</button>
            ))}
          </div>
          <button className="ring-btn green" onClick={() => setKeys('')}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>
          </button>
        </div>
      )}
      <div className="toolbar">
        <button className={tab === 'recents' ? 'on' : ''} onClick={() => setTab('recents')}>최근 통화</button>
        <button className={tab === 'contacts' ? 'on' : ''} onClick={() => setTab('contacts')}>연락처</button>
        <button className={tab === 'keypad' ? 'on' : ''} onClick={() => setTab('keypad')}>키패드</button>
      </div>
    </div>
  )
}
