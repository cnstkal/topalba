import { Component, useEffect, useRef, useState } from 'react'
import { GameProvider, useGame } from './engine/store'
import StatusBar from './components/StatusBar'
import ControlCenter from './components/ControlCenter'
import { DeviceFX } from './components/CCTools'
import { useDevice } from './engine/device'
import HomeScreen from './components/HomeScreen'
import { LockScreen, Banner, IncomingCall, EndingScreen } from './components/Overlays'
import Messages from './apps/Messages.tsx'
import Sns from './apps/Sns'
import Photos from './apps/Photos'
import Calendar from './apps/Calendar'
import Notes from './apps/Notes'
import Safari from './apps/Safari.tsx'
import PhoneApp from './apps/PhoneApp.tsx'
import Settings from './apps/Settings'
import Clock from './apps/Clock'
import Music from './apps/Music.tsx'
import AppStore from './apps/AppStore.tsx'
import Weather from './apps/Weather'
import Someone from './apps/Someone'
import Maps from './apps/Maps'
import MoaBank from './apps/MoaBank'
import Gyeol from './apps/Gyeol'
import Netflix from './apps/Netflix'
import KakaoTalk from './apps/KakaoTalk'
import Twitter from './apps/Twitter.tsx'
import Stub from './apps/Stub'
import Tetris from './apps/Tetris'

const COMPONENTS = {
  messages: Messages,
  sns: Sns,
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
  moabank: MoaBank,
  dating: Gyeol,
  netflix: Netflix,
  kakao: KakaoTalk,
  twitter: Twitter,
  tetris: Tetris,
}

// 한 앱이 오류로 멈춰도 전체 화면이 아니라 그 앱만 닫히도록 격리
class AppBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('앱 오류:', error, info)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#fff', color: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, textAlign: 'center' }}>
        <b style={{ fontSize: 18 }}>앱을 불러오지 못했어요</b>
        <span style={{ fontSize: 13, color: '#666' }}>일시적인 오류예요. 닫고 다시 열어 주세요.</span>
        <span style={{ fontSize: 11, color: '#999', wordBreak: 'break-all' }}>{String(this.state.error?.message || this.state.error)}</span>
        <button onClick={this.props.onClose} style={{ padding: '12px 22px', borderRadius: 12, background: '#007aff', color: '#fff', fontSize: 16 }}>닫기</button>
      </div>
    )
  }
}

function Phone() {
  const { state, actions } = useGame()
  const phoneRef = useRef(null)
  const [cur, setCur] = useState(null) // { id, origin, params, closing }
  const [leaving, setLeaving] = useState(false)
  const [drop, setDrop] = useState(false)
  const barY = useRef(null)
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
    if (!cur) {
      // 홈 화면에서 홈 바를 누르면 잠금 화면으로 돌아감
      setLeaving(false)
      actions.lockPhone()
      return
    }
    if (cur.closing) return
    setCur({ ...cur, closing: true })
    setTimeout(() => setCur(null), 320)
  }

  const unlock = () => {
    setLeaving(true)
    setTimeout(() => { actions.unlockPhone(); setDrop(false) }, 350)
  }
  // 홈 화면에서 상단바 시간을 누르면 잠금화면이 위에서 내려옴
  const pullLock = () => {
    if (cur || !state.unlocked) return
    setLeaving(false)
    setDrop(true)
    actions.lockPhone()
  }

  const App = cur ? COMPONENTS[cur.id] : null

  return (
    <div className={`phone ${dev.dark ? 'cc-dark' : ''}`} ref={phoneRef}>
      <HomeScreen openApp={openApp} dimmed={!!cur} />

      {cur && (
        <div key={cur.key} className={`app ${cur.closing ? 'app-closing' : ''}`} style={{ transformOrigin: cur.origin }}>
          <div className="app-inner">
            <AppBoundary onClose={closeApp}>
              {App ? <App params={cur.params} close={closeApp} /> : null}
            </AppBoundary>
          </div>
        </div>
      )}

      <StatusBar onOpenCC={() => setCc(true)} onLock={pullLock} />
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
      {!state.unlocked && <LockScreen onUnlock={unlock} leaving={leaving} drop={drop} />}
      <EndingScreen />
      <DeviceFX />
      <div
        className="home-bar-zone"
        onClick={closeApp}
        onPointerDown={(e) => { barY.current = e.clientY }}
        onPointerUp={(e) => {
          // 하단 인디케이터를 위로 올리면 잠금 해제(홈 화면으로)
          if (barY.current !== null && barY.current - e.clientY > 40 && !state.unlocked) unlock()
          barY.current = null
        }}
      >
        <div className="home-bar" />
      </div>
    </div>
  )
}

export default function App() {
  // 새 배포 버전을 감지하면 앱 코드를 자동 갱신한다. 사용자 저장 데이터(localStorage)는 건드리지 않는다.
  useEffect(() => {
    let active = true
    const checkForUpdate = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (!data.version || !active) return
        const key = 'topalba-deployed-version'
        const current = sessionStorage.getItem(key)
        if (!current) {
          sessionStorage.setItem(key, data.version)
        } else if (current !== data.version) {
          sessionStorage.setItem(key, data.version)
          // GitHub Pages처럼 응답 헤더 설정이 제한된 호스트에서도 새 HTML을 받도록 URL에 버전값 추가
          const freshUrl = new URL(window.location.href)
          freshUrl.searchParams.set('__appv', data.version)
          window.location.replace(freshUrl.toString())
        }
      } catch {
        // 네트워크가 불안정하면 다음 확인 시 다시 시도
      }
    }
    checkForUpdate()
    const interval = window.setInterval(checkForUpdate, 60_000)
    const onFocus = () => checkForUpdate()
    const onVisibility = () => { if (document.visibilityState === 'visible') checkForUpdate() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

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
