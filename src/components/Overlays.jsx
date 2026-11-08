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
  const reject = () => actions.answer(false)
  return (
    <div className="ring ring2">
      <svg className="ring2-wave" width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11v4M7 7v12M11 4v18M15 9v8" /><circle cx="20" cy="18" r="3.6" fill="currentColor" stroke="none" /></svg>
      <svg className="ring2-info" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="15" cy="15" r="12" /><path d="M15 14v7" /><circle cx="15" cy="9.5" r=".9" fill="currentColor" /></svg>
      <div className="ring2-top">
        <div className="ring2-sub">휴대전화</div>
        <div className="ring2-name">{c.name}</div>
      </div>
      <div className="ring2-bottom">
        <div className="ring2-opts">
          <button className="ring2-opt" onClick={reject}>
            <i><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.300 1.200 4.300 3.200 5.800L4.500 21l4.400-2.200c1 .2 2 .3 3.100.3 5.500 0 10-3.600 10-8S17.500 3 12 3z" /></svg></i>
            <span>메시지 보내기</span>
          </button>
          <button className="ring2-opt" onClick={reject}>
            <i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="7.500" /><path d="M12 9v4l2.500 1.500M3.500 6.500L6.500 4M20.500 6.500L17.500 4" /></svg></i>
            <span>나중에 보기</span>
          </button>
        </div>
        <div className="ring2-main">
          <button className="ring2-call" onClick={reject}>
            <i className="red"><svg width="38" height="38" viewBox="0 0 24 24" fill="#fff" style={{ transform: 'rotate(135deg)' }}><path d="M6.600 10.800a15.100 15.100 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25c1.100.37 2.300.57 3.600.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.250.2 2.450.57 3.570a1 1 0 0 1-.25 1z" /></svg></i>
            <span>거절</span>
          </button>
          <button className="ring2-call" onClick={() => actions.answer(true)}>
            <i className="green"><svg width="38" height="38" viewBox="0 0 24 24" fill="#fff"><path d="M6.600 10.800a15.100 15.100 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25c1.100.37 2.300.57 3.600.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.250.2 2.450.57 3.570a1 1 0 0 1-.25 1z" /></svg></i>
            <span>응답</span>
          </button>
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
