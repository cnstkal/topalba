import { useRef, useState } from 'react'
import { AppIcon } from './icons'
import { useGame, unreadCount } from '../engine/store'
import { DAYS } from '../utils'

const PAGE1 = ['sns', 'mail', 'photos', 'calendar', 'notes', 'settings', 'clock', 'appstore', 'weather', 'someone', 'reminders', 'maps']
const PAGE2 = ['moabank', 'dating', 'netflix', 'kakao']
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

  const [page, setPage] = useState(0)
  const onScroll = (e) => {
    const el = e.currentTarget
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  const todayEvents = [{ t: '오늘', n: '마케팅팀 내일 회의 준비' }]

  return (
    <div className={`home ${dimmed ? 'home-dim' : ''}`}>
      <div className="home-pages" onScroll={onScroll}>
        <section className="home-page">
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
          <div className="grid">{PAGE1.map((id) => icon(id))}</div>
        </section>
        <section className="home-page">
          <div className="grid">{PAGE2.map((id) => icon(id))}</div>
        </section>
      </div>

      <div className="page-dots">
        <i className={page === 0 ? 'on' : ''} />
        <i className={page === 1 ? 'on' : ''} />
      </div>

      <div className="dock">{DOCK.map((id) => icon(id, { noLabel: true }))}</div>
    </div>
  )
}
