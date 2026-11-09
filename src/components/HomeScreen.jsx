import { useRef, useState } from 'react'
import { AppIcon } from './icons'
import { useGame, unreadCount } from '../engine/store'

// 홈 배치: 개별 앱 + 폴더
const FOLDERS = {
  sns: { name: 'SNS', apps: ['sns', 'twitter'] },
  tools: { name: '도구', apps: ['settings', 'clock', 'appstore', 'calendar', 'maps'] },
}
const ITEMS = ['photos', 'notes', 'weather', 'someone', 'moabank', 'dating', 'netflix', 'kakao', 'folder:sns', 'folder:tools']
const DOCK = ['phone', 'messages', 'safari', 'music']

export default function HomeScreen({ openApp, dimmed }) {
  const { state } = useGame()
  const refs = useRef({})
  const [folder, setFolder] = useState(null)

  const open = (id) => {
    const r = refs.current[id]?.getBoundingClientRect()
    openApp(id, r)
  }
  const icon = (id, extra = {}) => (
    <AppIcon key={id} id={id} badge={unreadCount(state, id)} innerRef={(el) => (refs.current[id] = el)} onClick={() => open(id)} {...extra} />
  )
  const folderBadge = (key) => FOLDERS[key].apps.reduce((n, a) => n + unreadCount(state, a), 0)
  const folderTile = (key) => {
    const f = FOLDERS[key]
    const mini = f.apps.slice(0, 9)
    return (
      <div key={key} className="app-icon folder-btn" role="button" aria-label={f.name} onClick={() => setFolder(key)} ref={(el) => (refs.current[key] = el)}>
        <div className="folder-tile">
          {mini.map((a) => (
            <span key={a} className="folder-mini"><AppIcon id={a} size={17} noLabel onClick={() => {}} /></span>
          ))}
          {folderBadge(key) > 0 && <span className="badge">{folderBadge(key)}</span>}
        </div>
        <span className="app-label">{f.name}</span>
      </div>
    )
  }

  return (
    <div className={`home ${dimmed ? 'home-dim' : ''}`}>
      <div className="grid">
        {ITEMS.map((id) => (id.startsWith('folder:') ? folderTile(id.slice(7)) : icon(id)))}
      </div>
      <div className="dock">{DOCK.map((id) => icon(id, { noLabel: true }))}</div>
      {folder && (
        <div className="folder-open" onClick={() => setFolder(null)}>
          <div className="folder-panel" onClick={(e) => e.stopPropagation()}>
            <div className="folder-title">{FOLDERS[folder].name}</div>
            <div className="folder-grid">
              {FOLDERS[folder].apps.map((id) => (
                <AppIcon key={id} id={id} size={60} badge={unreadCount(state, id)} innerRef={(el) => (refs.current[id] = el)} onClick={() => { setFolder(null); open(id) }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
