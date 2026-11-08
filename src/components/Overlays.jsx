import { useEffect, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { CHARACTERS, initialOf } from '../data/characters'
import { ENDINGS } from '../data/endings'
import { APPS, Glyph } from './icons'
import { DAYS } from '../utils'

export function Avatar({ id, size = 40 }) {
  const c = CHARACTERS[id] || CHARACTERS.unknown
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(${c.tint}, ${c.tint}cc)` }}>
      {initialOf(id)}
    </div>
  )
}

export function LockScreen({ onUnlock, leaving }) {
  const d = new Date()
  const h = d.getHours() % 12 || 12
  const m = String(d.getMinutes()).padStart(2, '0')
  return (
    <div className={`lock ${leaving ? 'lock-out' : ''}`} onClick={onUnlock}>
      <div className="lock-date">
        {d.getMonth() + 1}월 {d.getDate()}일 {DAYS[d.getDay()]}요일
      </div>
      <div className="lock-time">
        {h}:{m}
      </div>
      <div className="lock-hint">위로 쓸어 올리거나 화면을 눌러 잠금 해제</div>
    </div>
  )
}

// 알림 배너 (화면 상단에서 내려옴, 위로 밀어 올리면 사라짐)
export function Banner({ onOpen }) {
  const { state, actions } = useGame()
  const b = state.banner
  const [dy, setDy] = useState(0)
  const [drag, setDrag] = useState(false)
  const [out, setOut] = useState(false)
  const y0 = useRef(null)
  const moved = useRef(false)
  const leave = () => { setOut(true); setTimeout(() => actions.dismissBanner(), 280) }
  useEffect(() => {
    setDy(0); setDrag(false); setOut(false); y0.current = null; moved.current = false
    if (!b) return
    const id = setTimeout(leave, 4200)
    return () => clearTimeout(id)
  }, [b?.id])
  if (!b) return null
  const a = APPS[b.app]
  const down = (e) => { if (out) return; y0.current = e.clientY; moved.current = false; setDrag(true); try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* 무시 */ } }
  const move = (e) => {
    if (y0.current == null) return
    const d = e.clientY - y0.current
    if (Math.abs(d) > 6) moved.current = true
    setDy(d < 0 ? d : d * 0.2)
  }
  const up = () => {
    if (y0.current == null) return
    y0.current = null; setDrag(false)
    if (dy < -28) leave(); else setDy(0)
  }
  return (
    <button
      key={b.id}
      className="banner"
      style={{
        transform: out ? 'translateY(-140px) scale(.96)' : `translateY(${dy}px)`,
        opacity: out ? 0 : 1,
        transition: drag ? 'none' : 'transform .28s cubic-bezier(.3,.8,.3,1), opacity .28s',
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={() => {
        if (moved.current || out) return
        actions.dismissBanner()
        onOpen(b.app, { thread: b.thread })
      }}
    >
      <div className="banner-icon" style={{ background: a?.bg }}>
        <div style={{ transform: 'scale(.46)', transformOrigin: 'top left', width: 60, height: 60 }}>
          <Glyph id={b.app} />
        </div>
      </div>
      <div className="banner-text">
        <b>{b.title}</b>
        <span>{b.body}</span>
      </div>
      <em>지금</em>
    </button>
  )
}

export function IncomingCall() {
  const { state, actions } = useGame()
  const r = state.ringing
  if (!r) return null
  const c = CHARACTERS[r.from]
  return (
    <div className="ring">
      <div className="ring-top">
        <Avatar id={r.from} size={84} />
        <div className="ring-name">{c.name}</div>
        <div className="ring-sub">휴대전화</div>
      </div>
      <div className="ring-actions">
        <div>
          <button className="ring-btn red" onClick={() => actions.answer(false)}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" style={{ transform: 'rotate(135deg)' }}>
              <path d="M6.600 10.800a15.100 15.100 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25c1.100.37 2.300.57 3.600.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.250.2 2.450.57 3.570a1 1 0 0 1-.25 1z" />
            </svg>
          </button>
          <span>거절</span>
        </div>
        <div>
          <button className="ring-btn green" onClick={() => actions.answer(true)}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
              <path d="M6.600 10.800a15.100 15.100 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25c1.100.37 2.300.57 3.600.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.250.2 2.450.57 3.570a1 1 0 0 1-.25 1z" />
            </svg>
          </button>
          <span>수락</span>
        </div>
      </div>
    </div>
  )
}

export function EndingScreen() {
  const { state, actions } = useGame()
  if (!state.ending) return null
  const e = ENDINGS.find((x) => x.id === state.ending)
  return (
    <div className="ending">
      <div className="ending-small">THE END</div>
      <div className="ending-title">{e.title}</div>
      <div className="ending-desc">{e.description}</div>
      <button className="ending-btn" onClick={actions.reset}>
        처음부터 다시 시작
      </button>
    </div>
  )
}
