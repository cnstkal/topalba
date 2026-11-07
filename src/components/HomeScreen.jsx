import { useRef } from 'react'
import { AppIcon } from './icons'
import { useGame, unreadCount } from '../engine/store'

const APPS = ['sns', 'mail', 'photos', 'calendar', 'notes', 'settings', 'clock', 'appstore', 'weather', 'someone', 'reminders', 'maps', 'moabank', 'dating', 'netflix', 'kakao']
const DOCK = ['phone', 'messages', 'safari', 'music']

export default function HomeScreen({ openApp, dimmed }) {
  const { state } = useGame()
  const refs = useRef({})

  const open = (id) => {
    const r = refs.current[id]?.getBoundingClientRect()
    openApp(id, r)
  }
  const icon = (id, extra = {}) => (
    <AppIcon key={id} id={id} badge={unreadCount(state, id)} innerRef={(el) => (refs.current[id] = el)} onClick={() => open(id)} {...extra} />
  )

  return (
    <div className={`home ${dimmed ? 'home-dim' : ''}`}>
      <div className="grid">{APPS.map((id) => icon(id))}</div>
      <div className="dock">{DOCK.map((id) => icon(id, { noLabel: true }))}</div>
    </div>
  )
}
