import { useState, useEffect, useMemo, useRef } from 'react'
import { useGame } from '../engine/store'
import { CHARACTERS, CONTACTS, ME, initialOf } from '../data/characters'
import { fmtTime } from '../utils'
import './PhoneApp.css'
import { usePersist as sharedPersist } from '../engine/persist'

/* ───────── 저장소 (키 변경 금지) ───────── */
const usePersist = (k, init) => sharedPersist(k, init, 'phone-app:v2:')

/* ───────── 초기(가상) 데이터 ───────── */
// [연락처, 종류(in|out|missed), 몇 분 전, 통화 시간(초)]
const SEED_CALLS = [
  // 홍중은 드물게 먼저 전화하지만 한 번 통화하면 길게 이어짐
  ['hj', 'in', 95, 312], ['hj', 'in', 1500, 1840], ['hj', 'out', 4200, 960],
  // 윤호는 자주 짧게 통화
  ['yh', 'in', 35, 72], ['yh', 'out', 180, 48], ['yh', 'in', 420, 95], ['yh', 'out', 900, 61],
  ['yh', 'in', 1800, 84], ['yh', 'out', 2600, 55], ['yh', 'in', 3900, 112],
  // 우영은 가끔 짧게
  ['wy', 'in', 1100, 58], ['wy', 'out', 5200, 83],
  // 아빠와 형은 연락이 드묾
  ['dad', 'missed', 9000, 0], ['dad', 'out', 18000, 74], ['bro', 'in', 26000, 0],
  // 단골손님, 광고성 번호, 친구, 알바 관련
  ['regular', 'in', 600, 135], ['nae', 'out', 2400, 92], ['boss', 'missed', 5600, 0],
  ['friend', 'out', 7200, 210], ['regular', 'missed', 10800, 0],
]
const SEED_VOICEMAIL = [
  ['boss', 60 * 5, 38, '이번 주 근무 시간 확인되면 답 주세요.'],
  ['regular', 60 * 26, 21, '사장님, 다음 주에도 예약 가능할까요?'],
  ['hj', 60 * 50, 47, '나 스케줄 끝났어. 시간 되면 전화 줘.'],
  ['wy', 60 * 120, 15, '전화 안 받네. 나중에 다시 걸게.'],
  ['unknown', 60 * 300, 12, '이벤트 안내 전화였습니다.'],
]
const makeCalls = () => {
  const now = Date.now()
  return SEED_CALLS.map(([cid, dir, min, dur], i) => ({
    id: 'seed' + i, cid, number: null, dir, ts: now - min * 60000, dur,
  }))
}
const makeVoicemail = () => {
  const now = Date.now()
  return SEED_VOICEMAIL.map(([cid, min, dur, text], i) => ({
    id: 'vm' + i, cid, ts: now - min * 60000, dur, text, played: i > 2,
  }))
}

/* ───────── 유틸 ───────── */
const digitsOf = (s) => (s || '').replace(/[^0-9*#+]/g, '')
function formatPhone(raw) {
  const d = digitsOf(raw)
  if (/[*#+]/.test(d) || d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`
}
const pad2 = (n) => String(n).padStart(2, '0')
function clock(d) {
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad2(d.getMinutes())}`
}
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
function fmtDate(ts) {
  const d = new Date(ts)
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 864e5)
  if (diff <= 0) return clock(d)
  if (diff === 1) return '어제'
  if (diff < 7) return WEEK[d.getDay()]
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}
const fmtFull = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${clock(d)}`
}
function fmtDur(sec) {
  if (!sec || sec <= 0) return ''
  if (sec < 60) return `${sec}초`
  return `${Math.floor(sec / 60)}분 ${sec % 60}초`
}
const fmtTimer = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`
const CHO = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
function sectionKey(name) {
  const c = (name || '#').charCodeAt(0)
  if (c >= 0xac00 && c <= 0xd7a3) return CHO[Math.floor((c - 0xac00) / 588)]
  return /[a-z]/i.test(name[0]) ? name[0].toUpperCase() : '#'
}
const FILTERS = [
  ['all', '전체 통화'],
  ['missed', '부재중 전화'],
  ['in', '수신 전화'],
  ['out', '발신 전화'],
]

/* ───────── 아이콘 (SVG 통일) ───────── */
const ICONS = {
  back: ['M15 5l-7 7 7 7'],
  keypad: ['M7 5.5h.01M12 5.5h.01M17 5.5h.01M7 10.5h.01M12 10.5h.01M17 10.5h.01M7 15.5h.01M12 15.5h.01M17 15.5h.01M12 20.5h.01'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M6 12h12'],
  star: ['M12 3.4l2.62 5.5 6 .85-4.38 4.2 1.08 6-5.32-2.9-5.32 2.9 1.08-6L3.38 9.75l6-.85z'],
  keypad: ['M7 5.5h.01M12 5.5h.01M17 5.5h.01M7 10.5h.01M12 10.5h.01M17 10.5h.01M7 15.5h.01M12 15.5h.01M17 15.5h.01M12 20.5h.01'],
  person: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M6.5 18c1-2.6 3-3.6 5.5-3.6s4.5 1 5.5 3.6'],
  msg: ['M12 4C7 4 3.5 7.1 3.5 11c0 2.1 1 4 2.7 5.3-.2 1.2-.8 2.3-1.7 3.2 1.9-.1 3.4-.7 4.5-1.6.9.2 1.9.3 3 .3 5 0 8.5-3.1 8.5-7.2S17 4 12 4z'],
  mic: ['M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M6 11a6 6 0 0 0 12 0', 'M12 17v4'],
  micOff: ['M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M6 11a6 6 0 0 0 12 0', 'M12 17v4', 'M4 4l16 16'],
  speaker: ['M4 9.5v5h4l5 4v-13l-5 4z', 'M16.5 9a4 4 0 0 1 0 6', 'M19 6.5a8 8 0 0 1 0 11'],
  video: ['M4 7.5h10a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 15V9A1.5 1.5 0 0 1 4 7.5z', 'M15.5 11l6-3.5v9l-6-3.5'],
  backspace: ['M9 5h11.5v14H9l-6.5-7z', 'M12.5 9.5l5 5M17.5 9.5l-5 5'],
  trash: ['M5 7h14M10 7V4.5h4V7', 'M7 7l1 13h8l1-13', 'M10.5 11v5M13.5 11v5'],
  up: ['M6 14l6-6 6 6'],
  down: ['M6 10l6 6 6-6'],
  left: ['M14 6l-6 6 6 6'],
  right: ['M10 6l6 6-6 6'],
  info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5.5M12 7.6h.01'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M16.5 16.5L21 21'],
  out: ['M7 17L17 7M9 7h8v8'],
  close: ['M6 6l12 12M18 6L6 18'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  filter: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M7.5 9h9M9.5 12h5M11 15h2'],
  share: ['M12 15V4M8 7.5l4-4 4 4', 'M6.5 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-.5'],
  skipBack: ['M4 6v12', 'M20 6.5v11a.5.5 0 0 1-.8.4L9 12.5a.5.5 0 0 1 0-.8l10.2-5.4a.5.5 0 0 1 .8.4z'],
}
function Icon({ n, size = 24, fill = 'none', sw = 1.8, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[n].map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}
const PHONE_D = 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z'
function PhoneGlyph({ size = 24, color = '#fff', rotate = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <path d={PHONE_D} />
    </svg>
  )
}
const Play = ({ size = 30 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 4.6v14.8a.8.8 0 0 0 1.2.7l12-7.4a.8.8 0 0 0 0-1.4l-12-7.4a.8.8 0 0 0-1.2.7z" /></svg>
const Pause = ({ size = 30 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5.5" y="4" width="4.5" height="16" rx="1.2" /><rect x="14" y="4" width="4.5" height="16" rx="1.2" /></svg>

/* 하단 탭 아이콘: 선택 시 채워진 형태 */
function TabIcon({ id, on }) {
  const c = 'currentColor'
  const base = { width: 27, height: 27, viewBox: '0 0 24 24', 'aria-hidden': true }
  const line = { fill: 'none', stroke: c, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  if (id === 'favorites') {
    return <svg {...base}><path d={ICONS.star[0]} {...line} fill={on ? c : 'none'} /></svg>
  }
  if (id === 'recents') {
    return on ? (
      <svg {...base}>
        <circle cx="12" cy="12" r="9.6" fill={c} />
        <path d="M12 6.8V12l3.4 2.1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg {...base}><circle cx="12" cy="12" r="9" {...line} /><path d="M12 7v5l3.4 2.1" {...line} /></svg>
    )
  }
  if (id === 'contacts') {
    return on ? (
      <svg {...base}>
        <circle cx="12" cy="12" r="9.6" fill={c} />
        <circle cx="12" cy="9.5" r="3" fill="#fff" />
        <path d="M6.4 18.3c.9-2.7 3.1-4 5.6-4s4.7 1.3 5.6 4a9.3 9.3 0 0 1-11.2 0z" fill="#fff" />
      </svg>
    ) : (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" {...line} />
        <circle cx="12" cy="9.6" r="2.8" {...line} />
        <path d="M6.6 18c1-2.5 3-3.5 5.4-3.5s4.4 1 5.4 3.5" {...line} />
      </svg>
    )
  }
  if (id === 'keypad') {
    const r = on ? 2.1 : 1.8
    return (
      <svg {...base} fill={c}>
        {[6, 12, 18].flatMap((x) => [5.5, 10.5, 15.5].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />))}
        <circle cx="12" cy="20.5" r={r} />
      </svg>
    )
  }
  const sw = on ? 2.4 : 1.8
  return (
    <svg {...base} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.8" cy="12" r="3.8" /><circle cx="17.2" cy="12" r="3.8" /><path d="M6.8 15.8h10.4" />
    </svg>
  )
}

const TABS = [
  ['favorites', '즐겨찾기'],
  ['recents', '최근 통화'],
  ['contacts', '연락처'],
  ['keypad', '키패드'],
  ['voicemail', '음성 사서함'],
]
const KEYPAD = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']]

/* ───────── 작은 컴포넌트 ───────── */
const tintOf = (cid) => (cid && CHARACTERS[cid]?.tint) || '#9a9aa0'

function Face({ cid, size = 40 }) {
  const known = cid && CHARACTERS[cid]
  const tint = tintOf(cid)
  return (
    <div
      className="phone-app-face"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: `linear-gradient(165deg, color-mix(in srgb, ${tint} 72%, #fff) 0%, ${tint} 100%)`,
      }}
    >
      {known ? (
        <span>{initialOf(cid)}</span>
      ) : (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="15.5" r="6.6" fill="rgba(255,255,255,.92)" />
          <path d="M6.5 38c1.2-7.2 6.5-11 13.5-11s12.3 3.8 13.5 11z" fill="rgba(255,255,255,.92)" />
        </svg>
      )}
    </div>
  )
}

/* 키패드 숫자 버튼 (0 길게 누르면 +) */
function Key({ k, sub, onKey }) {
  const t = useRef(null)
  const long = useRef(false)
  const down = () => {
    long.current = false
    if (k === '0') {
      t.current = setTimeout(() => {
        long.current = true
        onKey('+')
      }, 480)
    }
  }
  const up = () => clearTimeout(t.current)
  return (
    <button
      type="button"
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onClick={() => {
        if (long.current) { long.current = false; return }
        onKey(k)
      }}
      aria-label={k}
    >
      <b>{k}</b><i>{sub}</i>
    </button>
  )
}

function OptBtn({ on, onClick, icon, label, disabled = false }) {
  return (
    <div className={`phone-app-call-opt ${disabled ? 'dis' : ''}`}>
      <button type="button" className={on ? 'on' : ''} onClick={onClick} aria-pressed={!!on} disabled={disabled}>
        <Icon n={icon} size={30} sw={icon === 'keypad' ? 3.4 : 1.9} />
      </button>
      <span>{label}</span>
    </div>
  )
}

/* ───────── 통화 화면 ───────── */
function CallScreen({ target, contacts, onEnd }) {
  const [connected, setConnected] = useState(false)
  const [sec, setSec] = useState(0)
  const [mute, setMute] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const [pad, setPad] = useState(false)
  const [typed, setTyped] = useState('')
  const [list, setList] = useState(null) // null | '통화 추가' | '연락처'
  const [peek, setPeek] = useState(null)
  const secRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 2500)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!connected) return undefined
    const t = setInterval(() => {
      secRef.current += 1
      setSec(secRef.current)
    }, 1000)
    return () => clearInterval(t)
  }, [connected])

  const end = () => onEnd(connected ? secRef.current : 0)
  const known = target.cid && CHARACTERS[target.cid]

  return (
    <div className="page phone-app phone-app-call" style={{ '--tint': tintOf(target.cid) } as any}>
      <div className="phone-app-call-bg" aria-hidden="true">{known ? initialOf(target.cid) : ''}</div>

      <div className="phone-app-call-head">
        <div className="phone-app-call-name">{target.name}</div>
        <div className={`phone-app-call-state ${connected ? 'on' : ''}`}>
          {connected ? fmtTimer(sec) : '통화 연결 중…'}
        </div>
        {target.name !== target.number && <div className="phone-app-call-num">{target.number}</div>}
      </div>

      <div className="phone-app-call-mid">
        {pad ? (
          <div className="phone-app-call-pad">
            <div className="phone-app-call-typed">{typed || ' '}</div>
            <div className="phone-app-keys small">
              {KEYPAD.map(([k, sub]) => (
                <Key key={k} k={k} sub={sub} onKey={(x) => setTyped((s) => (s + x).slice(-16))} />
              ))}
            </div>
            <button type="button" className="phone-app-hide" onClick={() => setPad(false)}>숨기기</button>
          </div>
        ) : list ? (
          <div className="phone-app-call-list">
            <div className="phone-app-call-list-head">
              <b>{list}</b>
              <button type="button" onClick={() => { setList(null); setPeek(null) }} aria-label="닫기"><Icon n="close" size={18} color="#fff" sw={2.2} /></button>
            </div>
            {peek && <div className="phone-app-peek">{peek.name} · {peek.phone}</div>}
            <div className="phone-app-call-list-scroll">
              {contacts.map((c) => (
                <button type="button" key={c.id} className="phone-app-call-contact" onClick={() => setPeek(c)}>
                  <Face cid={c.id} size={36} /><span>{c.name}</span><em>{c.phone}</em>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="phone-app-call-grid">
            <OptBtn on={mute} onClick={() => setMute((v) => !v)} icon={mute ? 'micOff' : 'mic'} label="음소거" />
            <OptBtn on={false} onClick={() => setPad(true)} icon="keypad" label="키패드" />
            <OptBtn on={speaker} onClick={() => setSpeaker((v) => !v)} icon="speaker" label="스피커" />
            <OptBtn on={false} onClick={() => setList('통화 추가')} icon="plus" label="통화 추가" />
            <OptBtn on={false} onClick={() => undefined} icon="video" label="FaceTime" disabled />
            <OptBtn on={false} onClick={() => setList('연락처')} icon="person" label="연락처" />
          </div>
        )}
      </div>

      <button type="button" className="phone-app-end" onClick={end} aria-label="통화 종료">
        <PhoneGlyph size={34} rotate={135} />
      </button>
    </div>
  )
}

/* ───────── 하위 화면 ───────── */
function Detail({ ctx }) {
  const { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls } = ctx
  const c = top.cid ? byId(top.cid) : byNumber(top.number)
  const cid = c?.id || null
  const number = c ? c.phone : formatPhone(top.number || '')
  const name = c ? c.name : number
  const [edit, setEdit] = useState(false)
  const [nm, setNm] = useState(name)
  const [ph, setPh] = useState(number)
  const isExtra = !!extras.find((e) => e.id === cid)
  const history = allCalls.filter((r) => (cid ? r.cid === cid : digitsOf(r.number) === digitsOf(number))).slice(0, 8)
  const save = () => {
    const p = formatPhone(ph) || number
    if (isExtra) setExtras((l) => l.map((e) => (e.id === cid ? { ...e, name: nm.trim() || e.name, phone: p } : e)))
    else setOverrides((o) => ({ ...o, [cid]: { ...o[cid], phone: p } }))
    setEdit(false)
  }
  const removeExtra = () => {
    setExtras((l) => l.filter((e) => e.id !== cid))
    setFavs((f) => f.filter((x) => x !== cid))
    pop()
  }
  const addAsContact = () => {
    const id = 'c' + Date.now()
    setExtras((l) => [...l, { id, name: number, phone: number }])
    setStack((st) => [...st.slice(0, -1), { t: 'detail', cid: id }])
  }
  const isFav = !!cid && favs.includes(cid)
  return (
    <div className="phone-app-sub grouped">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-glass round" onClick={pop} aria-label="뒤로"><Icon n="back" size={22} sw={2.2} /></button>
        {cid ? (
          <button type="button" className="phone-app-glass" onClick={() => (edit ? save() : setEdit(true))}>
            {edit ? '완료' : '편집'}
          </button>
        ) : <span />}
      </div>
      <div className="phone-app-scroll">
        <div className="phone-app-hero">
          <Face cid={cid} size={112} />
          {edit && isExtra ? (
            <input className="phone-app-input center" value={nm} onChange={(e) => setNm(e.target.value)} aria-label="이름" />
          ) : (
            <h2>{name}</h2>
          )}
        </div>
        <div className="phone-app-actions">
          <button type="button" onClick={() => push({ t: 'compose', key: cid || digitsOf(number), title: name })}>
            <Icon n="msg" size={24} fill="currentColor" sw={0} /><span>메시지</span>
          </button>
          <button type="button" onClick={() => startCall({ cid, number })}>
            <PhoneGlyph size={24} color="currentColor" /><span>전화</span>
          </button>
          {cid ? (
            <button type="button" className={isFav ? 'on' : ''} onClick={() => toggleFav(cid)}>
              <Icon n="star" size={24} fill={isFav ? 'currentColor' : 'none'} /><span>{isFav ? '즐겨찾기 해제' : '즐겨찾기'}</span>
            </button>
          ) : (
            <button type="button" onClick={addAsContact}>
              <Icon n="plus" size={24} sw={2} /><span>연락처 추가</span>
            </button>
          )}
        </div>

        <div className="phone-app-card">
          <small>휴대전화</small>
          {edit && cid ? (
            <input className="phone-app-input" value={ph} inputMode="tel" onChange={(e) => setPh(e.target.value)} aria-label="전화번호" />
          ) : (
            <button type="button" className="phone-app-plain" onClick={() => startCall({ cid, number })}>{number}</button>
          )}
        </div>

        {history.length > 0 && (
          <div className="phone-app-card list">
            <small>최근 통화</small>
            {history.map((r) => (
              <div key={r.id} className={`phone-app-hist ${r.dir === 'missed' ? 'missed' : ''}`}>
                <div>
                  <b>{r.dir === 'out' ? '발신 전화' : r.dir === 'in' ? '수신 전화' : '부재중 전화'}</b>
                  {r.dur ? <span>{fmtDur(r.dur)}</span> : null}
                </div>
                <em>{r.game ? fmtTime(r.ts) : fmtFull(r.ts)}</em>
              </div>
            ))}
          </div>
        )}
        {edit && isExtra && (
          <button type="button" className="phone-app-danger" onClick={removeExtra}>연락처 삭제</button>
        )}
      </div>
    </div>
  )
}

function Compose({ ctx }) {
  const { top, msgs, setMsgs, pop } = ctx
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const list = msgs[top.key] || []
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [list.length])
  const send = () => {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => ({ ...m, [top.key]: [...(m[top.key] || []), { id: 'm' + Date.now(), t, ts: Date.now() }] }))
    setText('')
  }
  return (
    <div className="phone-app-sub nobar">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-glass round" onClick={pop} aria-label="뒤로"><Icon n="back" size={22} sw={2.2} /></button>
        <b className="phone-app-navtitle show">{top.title}</b>
        <span style={{ width: 40 }} />
      </div>
      <div className="phone-app-scroll phone-app-bubbles">
        {list.length === 0 && <div className="phone-app-empty">메시지를 입력해 보내 보세요.</div>}
        {list.map((m) => <div key={m.id} className="phone-app-bubble">{m.t}</div>)}
        <div ref={endRef} />
      </div>
      <div className="phone-app-compose">
        <input className="phone-app-msginput" value={text} placeholder="메시지" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="메시지 입력" />
        <button type="button" className="phone-app-send" disabled={!text.trim()} onClick={send} aria-label="보내기">
          <Icon n="up" size={18} color="#fff" sw={2.8} />
        </button>
      </div>
    </div>
  )
}

function Pick({ ctx }) {
  const { favs, toggleFav, pop, sorted } = ctx
  const rest = sorted.filter((c) => !favs.includes(c.id))
  return (
    <div className="phone-app-sub">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-glass round" onClick={pop} aria-label="뒤로"><Icon n="back" size={22} sw={2.2} /></button>
        <b className="phone-app-navtitle show">즐겨찾기 추가</b>
        <span style={{ width: 40 }} />
      </div>
      <div className="phone-app-scroll">
        {rest.length === 0 && <div className="phone-app-empty">추가할 연락처가 없습니다.</div>}
        {rest.map((c) => (
          <button type="button" key={c.id} className="phone-app-row phone-app-btnrow" onClick={() => { toggleFav(c.id); pop() }}>
            <Face cid={c.id} size={44} />
            <div className="phone-app-main"><b>{c.name}</b><span>{c.phone}</span></div>
          </button>
        ))}
      </div>
    </div>
  )
}

function AddContact({ ctx }) {
  const { top, setExtras, pop } = ctx
  const [nm, setNm] = useState('')
  const [ph, setPh] = useState(top.phone || '')
  const ok = nm.trim() && digitsOf(ph).length >= 3
  const save = () => {
    if (!ok) return
    setExtras((l) => [...l, { id: 'c' + Date.now(), name: nm.trim(), phone: formatPhone(ph) }])
    pop()
  }
  return (
    <div className="phone-app-sub grouped nobar">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-glass" onClick={pop}>취소</button>
        <b className="phone-app-navtitle show">새로운 연락처</b>
        <button type="button" className="phone-app-glass strong" disabled={!ok} onClick={save}>완료</button>
      </div>
      <div className="phone-app-scroll">
        <div className="phone-app-hero small">
          <Face cid={null} size={88} />
        </div>
        <div className="phone-app-card">
          <small>이름</small>
          <input className="phone-app-input" value={nm} onChange={(e) => setNm(e.target.value)} aria-label="이름" autoFocus />
        </div>
        <div className="phone-app-card">
          <small>전화번호</small>
          <input className="phone-app-input" value={ph} inputMode="tel" onChange={(e) => setPh(e.target.value)} aria-label="전화번호" />
        </div>
      </div>
    </div>
  )
}

/* ───────── 메인 ───────── */
export default function PhoneApp() {
  const game = useGame()
  const gameRecents = game?.state?.recents || []

  const [tab, setTab] = useState('recents')
  const [stack, setStack] = useState([])
  const [filter, setFilter] = useState('all')
  const [menu, setMenu] = useState(false)
  const [editRecents, setEditRecents] = useState(false)
  const [editFavs, setEditFavs] = useState(false)
  const [keys, setKeys] = useState('')
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [target, setTarget] = useState(null)
  const [playing, setPlaying] = useState(null) // {id, pos}
  const [openVm, setOpenVm] = useState(null)
  const contactsRef = useRef(null)

  const [calls, setCalls] = usePersist('calls', makeCalls)
  const [favs, setFavs] = usePersist('favs', ['hj', 'yh', 'wy'])
  const [extras, setExtras] = usePersist('extras', [])
  const [overrides, setOverrides] = usePersist('overrides', {})
  const [deletedGame, setDeletedGame] = usePersist('deletedGame', [])
  const [voicemail, setVoicemail] = usePersist('voicemail', makeVoicemail)
  const [msgs, setMsgs] = usePersist('msgs', {})

  const contacts = useMemo(
    () => CONTACTS.map((c) => ({
      id: c.id,
      name: overrides[c.id]?.name || CHARACTERS[c.id]?.name || c.id,
      phone: overrides[c.id]?.phone || c.phone,
    })).concat(extras),
    [extras, overrides],
  )
  const byId = (id) => contacts.find((c) => c.id === id)
  const byNumber = (n) => contacts.find((c) => digitsOf(c.phone) === digitsOf(n))
  const nameOf = (r) => byId(r.cid)?.name || (r.number ? formatPhone(r.number) : '알 수 없음')

  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [contacts],
  )

  /* 통화 기록 (게임 내 부재중/수신 기록 + 사용자 기록) */
  const allCalls = useMemo(() => {
    const g = gameRecents
      .filter((r) => !deletedGame.includes(String(r.id)))
      .map((r) => ({ id: 'g' + r.id, gid: String(r.id), cid: r.from, number: null, dir: r.missed ? 'missed' : 'in', ts: r.ts, dur: 0, game: true }))
    const mine = [...calls].sort((a, b) => b.ts - a.ts)
    return [...g, ...mine]
  }, [gameRecents, deletedGame, calls])

  const qs = q.trim().toLowerCase()
  const shown = allCalls.filter((r) => {
    if (filter !== 'all' && r.dir !== filter) return false
    if (!qs) return true
    return nameOf(r).toLowerCase().includes(qs) || (digitsOf(qs) && digitsOf(byId(r.cid)?.phone || r.number).includes(digitsOf(qs)))
  })

  /* 이동 */
  const push = (s) => { setScrolled(false); setStack((st) => [...st, s]) }
  const pop = () => { setScrolled(false); setStack((st) => st.slice(0, -1)) }
  const goTab = (t) => { setTab(t); setStack([]); setQ(''); setScrolled(false); setMenu(false); setEditRecents(false); setEditFavs(false) }
  const onScroll = (e) => {
    const s = e.currentTarget.scrollTop > 34
    if (s !== scrolled) setScrolled(s)
  }

  /* 발신 */
  const startCall = ({ cid = null, number = '' }) => {
    const c = cid ? byId(cid) : byNumber(number)
    setTarget({
      cid: c ? c.id : null,
      number: c ? c.phone : formatPhone(number),
      name: c ? c.name : formatPhone(number),
      raw: c ? null : number,
      ts: Date.now(),
    })
  }
  const endCall = (dur) => {
    if (target) {
      setCalls((l) => [
        { id: 'c' + target.ts, cid: target.cid, number: target.raw, dir: 'out', ts: target.ts, dur },
        ...l,
      ])
    }
    setTarget(null)
    setKeys('')
  }

  /* 즐겨찾기 */
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  const moveFav = (i, d) => setFavs((f) => {
    const n = [...f]
    const j = i + d
    if (j < 0 || j >= n.length) return f
    ;[n[i], n[j]] = [n[j], n[i]]
    return n
  })

  /* 최근 통화 삭제 */
  const removeCall = (r) => {
    if (r.game) setDeletedGame((d) => [...d, r.gid])
    else setCalls((l) => l.filter((x) => x.id !== r.id))
  }
  const clearCalls = () => {
    setCalls([])
    setDeletedGame(gameRecents.map((r) => String(r.id)))
    setEditRecents(false)
  }

  /* 음성 사서함 재생 */
  useEffect(() => {
    if (!playing) return undefined
    const vm = voicemail.find((v) => v.id === playing.id)
    if (!vm) { setPlaying(null); return undefined }
    const t = setInterval(() => {
      setPlaying((p) => {
        if (!p) return p
        if (p.pos + 1 >= vm.dur) return { id: p.id, pos: vm.dur, done: true }
        return { ...p, pos: p.pos + 1 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [playing?.id, playing?.done, voicemail]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (playing?.done) setPlaying(null)
  }, [playing?.done]) // eslint-disable-line react-hooks/exhaustive-deps

  const [pausedAt, setPausedAt] = useState({})
  const handlePlay = (vm) => {
    if (playing && playing.id === vm.id) {
      setPausedAt((m) => ({ ...m, [vm.id]: playing.pos }))
      setPlaying(null)
      setVoicemail((l) => l.map((v) => (v.id === vm.id ? { ...v, played: true } : v)))
    } else {
      setVoicemail((l) => l.map((v) => (v.id === vm.id ? { ...v, played: true } : v)))
      setPlaying({ id: vm.id, pos: pausedAt[vm.id] && pausedAt[vm.id] < vm.dur ? pausedAt[vm.id] : 0 })
    }
  }
  const removeVm = (id) => {
    if (playing?.id === id) setPlaying(null)
    if (openVm === id) setOpenVm(null)
    setVoicemail((l) => l.filter((v) => v.id !== id))
  }
  const unplayed = voicemail.filter((v) => !v.played).length

  /* 발신 화면 */
  if (target) return <CallScreen target={target} contacts={contacts} onEnd={endCall} />

  /* ───── 하위 화면 ───── */
  const top = stack[stack.length - 1]
  const ctx = { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls, msgs, setMsgs, sorted }
  let sub = null

  if (top?.t === 'detail') {
    sub = <Detail ctx={ctx} />
  } else if (top?.t === 'compose') {
    sub = <Compose ctx={ctx} />
  } else if (top?.t === 'pick') {
    sub = <Pick ctx={ctx} />
  } else if (top?.t === 'add') {
    sub = <AddContact ctx={ctx} />
  }
  const hideBar = top?.t === 'compose' || top?.t === 'add'

  /* ───── 탭 화면 ───── */
  const filteredContacts = sorted.filter((c) => {
    const s = q.trim().toLowerCase()
    return !s || c.name.toLowerCase().includes(s) || digitsOf(c.phone).includes(digitsOf(s) || '\u0000')
  })
  const groups = []
  filteredContacts.forEach((c) => {
    const k = sectionKey(c.name)
    const g = groups.find((x) => x.k === k)
    if (g) g.items.push(c)
    else groups.push({ k, items: [c] })
  })
  const jump = (k) => {
    const el = contactsRef.current?.querySelector(`[data-sec="${k}"]`)
    if (el && contactsRef.current) contactsRef.current.scrollTo({ top: el.offsetTop - 2, behavior: 'smooth' })
  }

  const matched = keys ? byNumber(keys) : null
  const filterLabel = FILTERS.find((f) => f[0] === filter)?.[1]

  const searchBar = (ph = '검색') => (
    <div className="phone-app-search">
      <Icon n="search" size={17} color="#8e8e93" sw={2.1} />
      <input value={q} placeholder={ph} onChange={(e) => setQ(e.target.value)} aria-label={ph} />
      {q && <button type="button" onClick={() => setQ('')} aria-label="검색어 지우기"><Icon n="close" size={13} color="#fff" sw={3} /></button>}
    </div>
  )

  return (
    <div className="page phone-app">
      {sub ? (
        <div key={stack.length} className="phone-app-stackwrap">{sub}</div>
      ) : (
        <div className="phone-app-body" key={tab}>
          {tab === 'favorites' && (
            <>
              <div className={`phone-app-nav ${scrolled ? 'line' : ''}`}>
                <button type="button" className="phone-app-glass" onClick={() => setEditFavs((v) => !v)}>{editFavs ? '완료' : '편집'}</button>
                <b className={`phone-app-navtitle ${scrolled ? 'show' : ''}`}>즐겨찾기</b>
                <button type="button" className="phone-app-glass round" onClick={() => push({ t: 'pick' })} aria-label="즐겨찾기 추가"><Icon n="plus" size={22} sw={2.2} /></button>
              </div>
              <div className="phone-app-scroll" onScroll={onScroll}>
                <div className="phone-app-title">즐겨찾기</div>
                {favs.length === 0 && <div className="phone-app-empty">즐겨찾기가 없습니다.<br />+ 버튼으로 추가해 보세요.</div>}
                <div className="phone-app-grid">
                  {favs.map((id, i) => {
                    const c = byId(id)
                    if (!c) return null
                    return (
                      <div key={id} className="phone-app-fav">
                        <div className="phone-app-favface">
                          <button type="button" className="phone-app-favtap" onClick={() => (editFavs ? undefined : startCall({ cid: id }))} aria-label={`${c.name}에게 전화`}>
                            <Face cid={id} size={92} />
                          </button>
                          {editFavs && (
                            <button type="button" className="phone-app-del badge" onClick={() => toggleFav(id)} aria-label="즐겨찾기 삭제"><Icon n="minus" size={14} color="#fff" sw={3.2} /></button>
                          )}
                        </div>
                        <button type="button" className="phone-app-favname" onClick={() => push({ t: 'detail', cid: id })}>{c.name}</button>
                        {editFavs && (
                          <div className="phone-app-move">
                            <button type="button" disabled={i === 0} onClick={() => moveFav(i, -1)} aria-label="앞으로"><Icon n="left" size={20} sw={2.2} /></button>
                            <button type="button" disabled={i === favs.length - 1} onClick={() => moveFav(i, 1)} aria-label="뒤로"><Icon n="right" size={20} sw={2.2} /></button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'recents' && (
            <>
              <div className={`phone-app-nav ${scrolled ? 'line' : ''}`}>
                <button type="button" className="phone-app-glass" onClick={() => setEditRecents((v) => !v)}>{editRecents ? '완료' : '편집'}</button>
                <b className={`phone-app-navtitle ${scrolled ? 'show' : ''}`}>{filter === 'all' ? '최근 통화' : filterLabel}</b>
                {editRecents ? (
                  <button type="button" className="phone-app-glass danger" onClick={clearCalls} disabled={allCalls.length === 0}>지우기</button>
                ) : (
                  <button type="button" className={`phone-app-glass round ${filter !== 'all' ? 'active' : ''}`} onClick={() => setMenu((v) => !v)} aria-label="필터" aria-expanded={menu}>
                    <Icon n="filter" size={24} sw={1.7} />
                  </button>
                )}
              </div>
              {menu && (
                <>
                  <div className="phone-app-scrim" onClick={() => setMenu(false)} />
                  <div className="phone-app-menu" role="menu">
                    {FILTERS.map(([id, label]) => (
                      <button type="button" key={id} role="menuitemradio" aria-checked={filter === id} onClick={() => { setFilter(id); setMenu(false) }}>
                        <span className="chk">{filter === id && <Icon n="check" size={18} sw={2.6} />}</span>{label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="phone-app-scroll" onScroll={onScroll}>
                <div className="phone-app-title">{filter === 'all' ? '최근 통화' : filterLabel}</div>
                {searchBar()}
                {shown.length === 0 && <div className="phone-app-empty">{qs ? '결과 없음' : '최근 통화가 없습니다.'}</div>}
                {shown.map((r) => (
                  <div key={r.id} className="phone-app-row">
                    {editRecents && (
                      <button type="button" className="phone-app-del" onClick={() => removeCall(r)} aria-label="기록 삭제"><Icon n="minus" size={14} color="#fff" sw={3.2} /></button>
                    )}
                    <button type="button" className="phone-app-rowmain" onClick={() => (editRecents ? push({ t: 'detail', cid: r.cid, number: r.number }) : startCall({ cid: r.cid, number: r.number || '' }))}>
                      <Face cid={r.cid} size={44} />
                      <div className="phone-app-main">
                        <b className={r.dir === 'missed' ? 'red' : ''}>{nameOf(r)}</b>
                        <span>
                          {r.dir === 'out' && <Icon n="out" size={13} sw={2.4} />}
                          {r.dir === 'missed' ? '부재중 전화' : '휴대전화'}
                        </span>
                      </div>
                      <em className="phone-app-time">{r.game ? fmtTime(r.ts) : fmtDate(r.ts)}</em>
                    </button>
                    {!editRecents && (
                      <button type="button" className="phone-app-info" onClick={() => push({ t: 'detail', cid: r.cid, number: r.number })} aria-label={`${nameOf(r)} 상세 정보`}>
                        <Icon n="info" size={23} sw={1.7} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'contacts' && (
            <>
              <div className={`phone-app-nav ${scrolled ? 'line' : ''}`}>
                <span style={{ width: 40 }} />
                <b className={`phone-app-navtitle ${scrolled ? 'show' : ''}`}>연락처</b>
                <button type="button" className="phone-app-glass round" onClick={() => push({ t: 'add' })} aria-label="연락처 추가"><Icon n="plus" size={22} sw={2.2} /></button>
              </div>
              <div className="phone-app-scroll rel" ref={contactsRef} onScroll={onScroll}>
                <div className="phone-app-title">연락처</div>
                {searchBar()}
                {!q && (
                  <div className="phone-app-mycard">
                    <Face cid={ME} size={58} />
                    <div className="phone-app-main"><b>{CHARACTERS[ME]?.name || '나'}</b><span>내 카드</span></div>
                  </div>
                )}
                {groups.length === 0 && <div className="phone-app-empty">결과 없음</div>}
                {groups.map((g) => (
                  <div key={g.k} data-sec={g.k}>
                    <div className="phone-app-section">{g.k}</div>
                    {g.items.map((c) => (
                      <button type="button" key={c.id} className="phone-app-cname" onClick={() => push({ t: 'detail', cid: c.id })}>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
                <div className="phone-app-count">연락처 {filteredContacts.length}명</div>
              </div>
              {!q && groups.length > 1 && (
                <div className="phone-app-index" aria-label="초성 색인">
                  {groups.map((g) => (
                    <button type="button" key={g.k} onClick={() => jump(g.k)} aria-label={`${g.k}로 이동`}>{g.k}</button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'keypad' && (
            <div className="phone-app-keypad">
              <div className="phone-app-keyout">
                <div className="phone-app-num">{formatPhone(keys) || ' '}</div>
                <div className="phone-app-match">
                  {matched ? matched.name : keys ? (
                    <button type="button" onClick={() => push({ t: 'add', phone: keys })}>번호 추가</button>
                  ) : ' '}
                </div>
              </div>
              <div className="phone-app-keys">
                {KEYPAD.map(([k, sub]) => (
                  <Key key={k} k={k} sub={sub} onKey={(x) => setKeys((s) => (s + x).slice(0, 15))} />
                ))}
              </div>
              <div className="phone-app-keyfoot">
                <span />
                <button type="button" className="phone-app-green" disabled={!keys} onClick={() => startCall({ number: keys })} aria-label="전화 걸기">
                  <PhoneGlyph size={36} />
                </button>
                <button type="button" className="phone-app-back" style={{ visibility: keys ? 'visible' : 'hidden' }} onClick={() => setKeys((s) => s.slice(0, -1))} aria-label="지우기">
                  <Icon n="backspace" size={30} color="#8e8e93" sw={1.6} />
                </button>
              </div>
            </div>
          )}

          {tab === 'voicemail' && (
            <>
              <div className={`phone-app-nav ${scrolled ? 'line' : ''}`}>
                <span style={{ width: 40 }} />
                <b className={`phone-app-navtitle ${scrolled ? 'show' : ''}`}>음성 사서함</b>
                <span style={{ width: 40 }} />
              </div>
              <div className="phone-app-scroll" onScroll={onScroll}>
                <div className="phone-app-title">음성 사서함</div>
                {voicemail.length === 0 && <div className="phone-app-empty">음성 사서함이 비어 있습니다.</div>}
                {voicemail.map((v) => {
                  const c = byId(v.cid)
                  const open = openVm === v.id
                  const isPlaying = playing?.id === v.id
                  const pos = isPlaying ? playing.pos : pausedAt[v.id] || 0
                  return (
                    <div key={v.id} className={`phone-app-vm ${open ? 'open' : ''}`}>
                      <button type="button" className="phone-app-vmhead" onClick={() => setOpenVm(open ? null : v.id)} aria-expanded={open}>
                        <i className={`phone-app-dot ${v.played ? 'off' : ''}`} />
                        <div className="phone-app-main">
                          <b>{c?.name || '알 수 없음'}</b>
                          <span>휴대전화 · {fmtDur(v.dur)}</span>
                        </div>
                        <em className="phone-app-time">{fmtDate(v.ts)}</em>
                        <span className={`phone-app-chev ${open ? 'open' : ''}`}><Icon n="right" size={16} sw={2.4} /></span>
                      </button>
                      {open && (
                        <div className="phone-app-player">
                          <div className="phone-app-prog">
                            <div className="fill" style={{ width: `${Math.min(100, (pos / v.dur) * 100)}%` }} />
                            <div className="thumb" style={{ left: `${Math.min(100, (pos / v.dur) * 100)}%` }} />
                          </div>
                          <div className="phone-app-ptime"><span>{fmtTimer(pos)}</span><span>-{fmtTimer(Math.max(0, v.dur - pos))}</span></div>
                          <div className="phone-app-pbtns">
                            <button type="button" onClick={() => startCall({ cid: v.cid })} aria-label="회신 전화"><PhoneGlyph size={22} color="currentColor" /></button>
                            <button type="button" className="main" onClick={() => handlePlay(v)} aria-label={isPlaying ? '일시정지' : '재생'}>{isPlaying ? <Pause /> : <Play />}</button>
                            <button type="button" className="red" onClick={() => removeVm(v.id)} aria-label="삭제"><Icon n="trash" size={23} /></button>
                          </div>
                          <div className="phone-app-trans">
                            <small>음성 메시지 텍스트 변환</small>
                            <p>{v.text}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {!hideBar && (
        <div className="phone-app-tabbar" role="tablist">
          {TABS.map(([id, label]) => (
            <button type="button" key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => goTab(id)}>
              <span className="phone-app-tabicon">
                <TabIcon id={id} on={tab === id} />
                {id === 'voicemail' && unplayed > 0 && <i className="phone-app-badge">{unplayed}</i>}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
