import { useEffect, useRef, useState } from 'react'
import { GameProvider, useGame } from './engine/store'
import StatusBar from './components/StatusBar'
import ControlCenter from './components/ControlCenter'
import { DeviceFX } from './components/CCTools'
import { useDevice } from './engine/device'
import HomeScreen from './components/HomeScreen'
import { LockScreen, Banner, IncomingCall, EndingScreen } from './components/Overlays'
import Messages from './apps/Messages.tsx'
import Sns from './apps/Sns'
import Mail from './apps/Mail'
import Photos from './apps/Photos'
import Calendar from './apps/Calendar'
import Notes from './apps/Notes'
import Safari from './apps/Safari.tsx'
import PhoneApp from './apps/PhoneApp.tsx'
import Settings from './apps/Settings'
import Clock from './apps/Clock'
import Music from './apps/Music.tsx'
import AppStore from './apps/AppStore'
import Weather from './apps/Weather'
import Someone from './apps/Someone'
import Maps from './apps/Maps'
import MoaBank from './apps/MoaBank'
import Gyeol from './apps/Gyeol'
import Netflix from './apps/Netflix'
import KakaoTalk from './apps/KakaoTalk'
import Reminders from './apps/Reminders'
import Stub from './apps/Stub'

const COMPONENTS = {
  messages: Messages,
  sns: Sns,
  mail: Mail,
  photos: Photos,
  calendar: Calendar,
  notes: Notes,
  safari: Safari,
  phone: PhoneApp,
  settings: Settings,
  clock: Clock,
  music: Music,
  appstore: AppStore,
  weather: Weather,
  someone: Someone,
  maps: Maps,
  reminders: Reminders,
  moabank: MoaBank,
  dating: Gyeol,
  netflix: Netflix,
  kakao: KakaoTalk,
}

function Phone() {
  const { state, actions } = useGame()
  const phoneRef = useRef(null)
  const [cur, setCur] = useState(null) // { id, origin, params, closing }
  const [leaving, setLeaving] = useState(false)
  const [cc, setCc] = useState(false)
  const dev = useDevice()
  const edge = useRef(null)

  const openApp = (id, rect, params) => {
    const p = phoneRef.current.getBoundingClientRect()
    const sc = p.width / phoneRef.current.offsetWidth || 1
    const origin = rect ? `${(rect.left + rect.width / 2 - p.left) / sc}px ${(rect.top + rect.height / 2 - p.top) / sc}px` : '50% 90%'
    setCur({ id, origin, params, closing: false, key: Date.now() })
    actions.appSeen(id)
  }

  const closeApp = () => {
    if (!cur || cur.closing) return
    setCur({ ...cur, closing: true })
    setTimeout(() => setCur(null), 320)
  }

  const unlock = () => {
    setLeaving(true)
    setTimeout(() => actions.unlockPhone(), 350)
  }

  const App = cur ? COMPONENTS[cur.id] : null

  return (
    <div className={`phone ${dev.dark ? 'cc-dark' : ''}`} ref={phoneRef}>
      <HomeScreen openApp={openApp} dimmed={!!cur} />

      {cur && (
        <div key={cur.key} className={`app ${cur.closing ? 'app-closing' : ''}`} style={{ transformOrigin: cur.origin }}>
          <div className="app-inner">
            <App params={cur.params} close={closeApp} />
          </div>
        </div>
      )}

      <StatusBar onOpenCC={() => setCc(true)} />
      {/* 오른쪽 상단에서 아래로 스와이프(또는 탭)하면 제어센터 열기 */}
      <div
        className="cc-edge"
        onPointerDown={(e) => { edge.current = [e.clientX, e.clientY]; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => { if (edge.current && e.clientY - edge.current[1] > 18) { edge.current = null; setCc(true) } }}
        onPointerUp={() => { if (edge.current) setCc(true); edge.current = null }}
        onPointerCancel={() => (edge.current = null)}
      />
      <ControlCenter open={cc} onClose={() => setCc(false)} onOpenApp={(id) => openApp(id, null)} />
      <Banner onOpen={(id, params) => openApp(id, null, params)} />
      <IncomingCall />
      {!state.unlocked && <LockScreen onUnlock={unlock} leaving={leaving} />}
      <EndingScreen />
      <DeviceFX />
      <div className="home-bar-zone" onClick={closeApp}>
        <div className="home-bar" />
      </div>
    </div>
  )
}

export default function App() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => {
      if (window.innerWidth <= 500) return setScale(1)
      setScale(Math.min(1, (window.innerHeight - 48) / 900))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <GameProvider>
      <div className="stage">
        <div className="scaler" style={{ transform: `scale(${scale})` }}>
          <Phone />
        </div>
      </div>
    </GameProvider>
  )
}
