import { useRef } from 'react'
import { AppIcon } from './icons'
import { useGame, unreadCount } from '../engine/store'
import { DAYS } from '../utils'

const GRID = ['sns', 'mail', 'photos', 'calendar', 'notes', 'settings', 'clock', 'appstore', 'weather', 'someone', 'reminders', 'moabank', 'dating', 'netflix', 'kakao']
const DOCK = ['phone', 'messages', 'safari', 'music']

export default function HomeScreen({ openApp, dimmed }) {
  const { state } = useGame()
  const refs = useRef({})
  const d = new Date()

  const open = (id) => {
    const r = refs.current[id]?.getBoundingClientRect()
    openApp(id, r)
  }
  const icon = (id, extra = {}) => (
    <AppIcon key={id} id={id} badge={unreadCount(state, id)} innerRef={(el) => (refs.current[id] = el)} onClick={() => open(id)} {...extra} />
  )

  const todayEvents = [{ t: '오늘', n: '마케팅팀 내일 회의 준비' }]

  return (
    <div className={`home ${dimmed ? 'home-dim' : ''}`}>
      <div className="widgets">
        <button className="widget" onClick={() => open('calendar')}>
          <div className="w-day">{DAYS[d.getDay()]}요일</div>
          <div className="w-num">{d.getDate()}</div>
          <div className="w-ev">
            <i />
            {todayEvents[0].n}
          </div>
          <div className="w-name">캘린더</div>
        </button>
        <button className="widget" onClick={() => open('notes')}>
          <div className="w-notes-h">메모</div>
          {state.notes.slice(0, 3).map((n) => (
            <div key={n.id} className="w-note">
              {n.title}
            </div>
          ))}
          <div className="w-name">메모</div>
        </button>
      </div>

      <div className="grid">{GRID.map((id) => icon(id))}</div>

      <div className="spacer" />
      <div className="search-pill">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6c6c70" strokeWidth="3" strokeLinecap="round">
          <circle cx="10" cy="10" r="7" />
          <path d="M21 21l-6-6" />
        </svg>
        검색
      </div>
      <div className="dock">{DOCK.map((id) => icon(id, { noLabel: true }))}</div>
    </div>
  )
}
