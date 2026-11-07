import { useState, useEffect, useMemo, useRef } from 'react'
import { useGame } from '../engine/store'
import { CHARACTERS, CONTACTS } from '../data/characters'
import { Avatar } from '../components/Overlays'
import { fmtTime } from '../utils'
import './PhoneApp.css'

/* ───────── 저장소 ───────── */
const KEY = 'phone-app:v1:'
function load(k, fallback) {
  try {
    const v = localStorage.getItem(KEY + k)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function usePersist(k, init) {
  const [v, setV] = useState(() => load(k, typeof init === 'function' ? init() : init))
  useEffect(() => {
    try {
      localStorage.setItem(KEY + k, JSON.stringify(v))
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [k, v])
  return [v, setV]
}

/* ───────── 초기(가상) 데이터 ───────── */
// [연락처, 종류(in|out|missed), 몇 분 전, 통화 시간(초)]
const SEED_CALLS = [
  ['nae', 'missed', 20, 0], ['hj', 'in', 95, 312], ['boss', 'out', 240, 185], ['yh', 'missed', 400, 0],
  ['wy', 'out', 1000, 64], ['hj', 'out', 1500, 742], ['nae', 'in', 1700, 93], ['boss', 'missed', 1900, 0],
  ['yh', 'in', 2900, 1280], ['hj', 'missed', 3100, 0], ['wy', 'in', 4300, 45], ['nae', 'out', 4500, 230],
  ['boss', 'in', 5800, 128], ['hj', 'in', 7200, 1860], ['yh', 'out', 8700, 77], ['wy', 'missed', 10000, 0],
  ['nae', 'in', 11500, 340], ['boss', 'out', 13000, 52], ['hj', 'out', 14500, 615], ['yh', 'missed', 16000, 0],
  ['wy', 'in', 18000, 402], ['nae', 'missed', 20000, 0], ['hj', 'in', 23000, 95],
]
const SEED_VOICEMAIL = [
  ['boss', 60 * 5, 38, '내일 근무 시간 좀 바꿀 수 있을까? 확인되면 연락 줘.'],
  ['nae', 60 * 26, 21, '언니 아니, 성화야 나 오늘 교대 좀 부탁해도 될까?'],
  ['hj', 60 * 50, 47, '나 오늘 스케줄 끝났다. 시간 되면 전화 줘.'],
  ['wy', 60 * 120, 15, '전화 안 받네. 나중에 다시 걸게.'],
  ['yh', 60 * 300, 29, '이번 주말에 시간 괜찮아? 연락 기다릴게.'],
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

/* ───────── 아이콘 ───────── */
const ICONS = {
  back: ['M15 5l-7 7 7 7'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M6 12h12'],
  star: ['M12 3.5l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.3l-5.4 3 1.1-6.1-4.5-4.3 6.1-.8z'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5V12l3 2'],
  person: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M6.5 18c1-2.6 3-3.6 5.5-3.6s4.5 1 5.5 3.6'],
  keypad: ['M7 5.5h.01M12 5.5h.01M17 5.5h.01M7 10.5h.01M12 10.5h.01M17 10.5h.01M7 15.5h.01M12 15.5h.01M17 15.5h.01M12 20.5h.01'],
  voicemail: ['M7 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8z', 'M17 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8z', 'M7 15h10'],
  msg: ['M4 5.5h16v10H10l-4.5 4v-4H4z'],
  mic: ['M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M6 11a6 6 0 0 0 12 0', 'M12 17v4'],
  speaker: ['M4 9.5v5h4l5 4v-13l-5 4z', 'M16.5 9a4 4 0 0 1 0 6', 'M19 6.5a8 8 0 0 1 0 11'],
  backspace: ['M9 5h11v14H9l-6-7z', 'M12.5 9.5l5 5M17.5 9.5l-5 5'],
  trash: ['M5 7h14M10 7V4.5h4V7', 'M7 7l1 13h8l1-13'],
  up: ['M6 14l6-6 6 6'],
  down: ['M6 10l6 6 6-6'],
  info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v6M12 7.5h.01'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M16.5 16.5L21 21'],
  out: ['M7 17L17 7M9 7h8v8'],
  inn: ['M17 7L7 17M7 9v8h8'],
  close: ['M6 6l12 12M18 6L6 18'],
}
function Icon({ n, size = 24, fill = 'none', sw = 1.8, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={n === 'keypad' ? 3 : sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
const Play = ({ size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
const Pause = ({ size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>

const TABS = [
  ['favorites', '즐겨찾기', 'star'],
  ['recents', '최근 통화', 'clock'],
  ['contacts', '연락처', 'person'],
  ['keypad', '키패드', 'keypad'],
  ['voicemail', '음성 사서함', 'voicemail'],
]
const KEYPAD = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']]

/* ───────── 작은 컴포넌트 ───────── */
function Face({ cid, size = 40 }) {
  if (cid && CHARACTERS[cid]) return <Avatar id={cid} size={size} />
  return (
    <div className="phone-app-face" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {cid ? '' : <Icon n="person" size={size * 0.6} color="#fff" />}
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
  const [list, setList] = useState(false)
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
  const Btn = ({ on, onClick, icon, label }) => (
    <div className="phone-app-call-opt">
      <button type="button" className={on ? 'on' : ''} onClick={onClick} aria-pressed={!!on}>
        <Icon n={icon} size={30} color={on ? '#000' : '#fff'} />
      </button>
      <span>{label}</span>
    </div>
  )

  return (
    <div className="page phone-app phone-app-call">
      <div className="phone-app-call-head">
        <Face cid={target.cid} size={96} />
        <div className="phone-app-call-name">{target.name}</div>
        <div className="phone-app-call-num">{target.number}</div>
        <div className="phone-app-call-state">{connected ? fmtTimer(sec) : '통화 연결 중…'}</div>
      </div>

      {pad ? (
        <div className="phone-app-call-pad">
          <div className="phone-app-call-typed">{typed || ' '}</div>
          <div className="phone-app-keys small">
            {KEYPAD.map(([k, sub]) => (
              <button type="button" key={k} onClick={() => setTyped((s) => (s + k).slice(-16))}>
                <b>{k}</b><i>{sub}</i>
              </button>
            ))}
          </div>
          <button type="button" className="phone-app-link light" onClick={() => setPad(false)}>숨기기</button>
        </div>
      ) : list ? (
        <div className="phone-app-call-list">
          <div className="phone-app-call-list-head">
            <b>연락처</b>
            <button type="button" onClick={() => { setList(false); setPeek(null) }}><Icon n="close" size={20} color="#fff" /></button>
          </div>
          {peek && <div className="phone-app-peek">{peek.name} · {peek.phone}</div>}
          {contacts.map((c) => (
            <button type="button" key={c.id} className="phone-app-call-contact" onClick={() => setPeek(c)}>
              <Face cid={c.id} size={34} /><span>{c.name}</span><em>{c.phone}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="phone-app-call-grid">
          <Btn on={mute} onClick={() => setMute((v) => !v)} icon="mic" label={mute ? '음소거 해제' : '음소거'} />
          <Btn on={false} onClick={() => setPad(true)} icon="keypad" label="키패드" />
          <Btn on={speaker} onClick={() => setSpeaker((v) => !v)} icon="speaker" label="스피커" />
          <Btn on={false} onClick={() => setList(true)} icon="person" label="연락처" />
        </div>
      )}

      <button type="button" className="phone-app-end" onClick={end} aria-label="통화 종료">
        <PhoneGlyph size={32} rotate={135} />
      </button>
    </div>
  )
}

/* ───────── 하위 화면 ───────── */
function Detail({ ctx }) {
  const { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls, msgs, setMsgs, sorted } = ctx
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
  return (
    <div className="phone-app-sub">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-navbtn" onClick={pop}><Icon n="back" size={22} />뒤로</button>
        {cid && (
          <button type="button" className="phone-app-navbtn" onClick={() => (edit ? save() : setEdit(true))}>
            {edit ? '완료' : '편집'}
          </button>
        )}
      </div>
      <div className="phone-app-scroll">
        <div className="phone-app-hero">
          <Face cid={cid} size={96} />
          {edit && isExtra ? (
            <input className="phone-app-input center" value={nm} onChange={(e) => setNm(e.target.value)} aria-label="이름" />
          ) : (
            <h2>{name}</h2>
          )}
        </div>
        <div className="phone-app-actions">
          <button type="button" onClick={() => push({ t: 'compose', key: cid || digitsOf(number), title: name })}>
            <Icon n="msg" size={22} /><span>메시지</span>
          </button>
          <button type="button" onClick={() => startCall({ cid, number })}>
            <PhoneGlyph size={22} color="currentColor" /><span>전화</span>
          </button>
          {cid ? (
            <button type="button" className={favs.includes(cid) ? 'on' : ''} onClick={() => toggleFav(cid)}>
              <Icon n="star" size={22} fill={favs.includes(cid) ? 'currentColor' : 'none'} />
              <span>{favs.includes(cid) ? '즐겨찾기 해제' : '즐겨찾기'}</span>
            </button>
          ) : (
            <button type="button" onClick={addAsContact}>
              <Icon n="plus" size={22} /><span>연락처 추가</span>
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
          <div className="phone-app-card">
            <small>통화 기록</small>
            {history.map((r) => (
              <div key={r.id} className={`phone-app-hist ${r.dir === 'missed' ? 'missed' : ''}`}>
                <span>{r.dir === 'out' ? '발신' : r.dir === 'in' ? '수신' : '부재중'}{r.dur ? ` · ${fmtDur(r.dur)}` : ''}</span>
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
  const { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls, msgs, setMsgs, sorted } = ctx
  const [text, setText] = useState('')
  const list = msgs[top.key] || []
  const send = () => {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => ({ ...m, [top.key]: [...(m[top.key] || []), { id: 'm' + Date.now(), t, ts: Date.now() }] }))
    setText('')
  }
  return (
    <div className="phone-app-sub">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-navbtn" onClick={pop}><Icon n="back" size={22} />뒤로</button>
        <b>{top.title}</b>
        <span style={{ width: 50 }} />
      </div>
      <div className="phone-app-scroll phone-app-bubbles">
        {list.length === 0 && <div className="phone-app-empty">메시지를 입력해 보내 보세요.</div>}
        {list.map((m) => <div key={m.id} className="phone-app-bubble">{m.t}</div>)}
      </div>
      <div className="phone-app-compose">
        <input className="phone-app-input" value={text} placeholder="메시지" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="메시지 입력" />
        <button type="button" disabled={!text.trim()} onClick={send}>보내기</button>
      </div>
    </div>
  )
}

function Pick({ ctx }) {
  const { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls, msgs, setMsgs, sorted } = ctx
  const rest = sorted.filter((c) => !favs.includes(c.id))
  return (
    <div className="phone-app-sub">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-navbtn" onClick={pop}><Icon n="back" size={22} />뒤로</button>
        <b>즐겨찾기 추가</b>
        <span style={{ width: 50 }} />
      </div>
      <div className="phone-app-scroll">
        {rest.length === 0 && <div className="phone-app-empty">추가할 연락처가 없습니다.</div>}
        {rest.map((c) => (
          <button type="button" key={c.id} className="phone-app-row" onClick={() => { toggleFav(c.id); pop() }}>
            <Face cid={c.id} size={40} />
            <div className="phone-app-main"><b>{c.name}</b><span>{c.phone}</span></div>
          </button>
        ))}
      </div>
    </div>
  )
}

function AddContact({ ctx }) {
  const { top, byId, byNumber, extras, setExtras, setOverrides, favs, setFavs, toggleFav, pop, push, setStack, startCall, allCalls, msgs, setMsgs, sorted } = ctx
  const [nm, setNm] = useState('')
  const [ph, setPh] = useState('')
  const ok = nm.trim() && digitsOf(ph).length >= 3
  const save = () => {
    if (!ok) return
    setExtras((l) => [...l, { id: 'c' + Date.now(), name: nm.trim(), phone: formatPhone(ph) }])
    pop()
  }
  return (
    <div className="phone-app-sub">
      <div className="phone-app-nav">
        <button type="button" className="phone-app-navbtn" onClick={pop}>취소</button>
        <b>새로운 연락처</b>
        <button type="button" className="phone-app-navbtn" disabled={!ok} onClick={save}>완료</button>
      </div>
      <div className="phone-app-scroll">
        <div className="phone-app-card">
          <small>이름</small>
          <input className="phone-app-input" value={nm} onChange={(e) => setNm(e.target.value)} aria-label="이름" />
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
  const [editRecents, setEditRecents] = useState(false)
  const [editFavs, setEditFavs] = useState(false)
  const [keys, setKeys] = useState('')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState(null)
  const [playing, setPlaying] = useState(null) // {id, pos}
  const [openVm, setOpenVm] = useState(null)

  const [calls, setCalls] = usePersist('calls', makeCalls)
  const [favs, setFavs] = usePersist('favs', ['hj', 'wy', 'nae'])
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
  const numOf = (r) => byId(r.cid)?.phone || (r.number ? formatPhone(r.number) : '')

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

  const shown = allCalls.filter((r) => filter === 'all' || r.dir === 'missed')

  /* 이동 */
  const push = (s) => setStack((st) => [...st, s])
  const pop = () => setStack((st) => st.slice(0, -1))
  const goTab = (t) => { setTab(t); setStack([]); setQ('') }

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

  /* ───── 탭 화면 ───── */
  const CallBtn = ({ onClick, label }) => (
    <button type="button" className="phone-app-iconbtn" onClick={(e) => { e.stopPropagation(); onClick() }} aria-label={label}>
      <PhoneGlyph size={20} color="currentColor" />
    </button>
  )

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

  const matched = keys ? byNumber(keys) : null

  return (
    <div className="page phone-app">
      {sub || (
        <div className="phone-app-body">
          {tab === 'favorites' && (
            <>
              <div className="phone-app-nav">
                <button type="button" className="phone-app-navbtn" onClick={() => setEditFavs((v) => !v)}>{editFavs ? '완료' : '편집'}</button>
                <button type="button" className="phone-app-navbtn" onClick={() => push({ t: 'pick' })} aria-label="즐겨찾기 추가"><Icon n="plus" size={24} /></button>
              </div>
              <div className="phone-app-title">즐겨찾기</div>
              <div className="phone-app-scroll">
                {favs.length === 0 && <div className="phone-app-empty">즐겨찾기가 없습니다.<br />+ 버튼으로 추가해 보세요.</div>}
                {favs.map((id, i) => {
                  const c = byId(id)
                  if (!c) return null
                  return (
                    <div key={id} className="phone-app-row">
                      {editFavs && (
                        <button type="button" className="phone-app-del" onClick={() => toggleFav(id)} aria-label="즐겨찾기 삭제"><Icon n="minus" size={16} color="#fff" sw={3} /></button>
                      )}
                      <button type="button" className="phone-app-rowmain" onClick={() => push({ t: 'detail', cid: id })}>
                        <Face cid={id} size={44} />
                        <div className="phone-app-main"><b>{c.name}</b><span>{c.phone}</span></div>
                      </button>
                      {editFavs ? (
                        <div className="phone-app-move">
                          <button type="button" disabled={i === 0} onClick={() => moveFav(i, -1)} aria-label="위로"><Icon n="up" size={20} /></button>
                          <button type="button" disabled={i === favs.length - 1} onClick={() => moveFav(i, 1)} aria-label="아래로"><Icon n="down" size={20} /></button>
                        </div>
                      ) : (
                        <CallBtn label={`${c.name}에게 전화`} onClick={() => startCall({ cid: id })} />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {tab === 'recents' && (
            <>
              <div className="phone-app-nav">
                <button type="button" className="phone-app-navbtn" onClick={() => setEditRecents((v) => !v)}>{editRecents ? '완료' : '편집'}</button>
                <div className="phone-app-seg">
                  <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>전체</button>
                  <button type="button" className={filter === 'missed' ? 'on' : ''} onClick={() => setFilter('missed')}>부재중</button>
                </div>
                {editRecents ? (
                  <button type="button" className="phone-app-navbtn red" onClick={clearCalls} disabled={allCalls.length === 0}>지우기</button>
                ) : <span style={{ width: 50 }} />}
              </div>
              <div className="phone-app-title">최근 통화</div>
              <div className="phone-app-scroll">
                {shown.length === 0 && <div className="phone-app-empty">최근 통화가 없습니다.</div>}
                {shown.map((r) => (
                  <div key={r.id} className="phone-app-row">
                    {editRecents && (
                      <button type="button" className="phone-app-del" onClick={() => removeCall(r)} aria-label="기록 삭제"><Icon n="minus" size={16} color="#fff" sw={3} /></button>
                    )}
                    <button type="button" className="phone-app-rowmain" onClick={() => push({ t: 'detail', cid: r.cid, number: r.number })}>
                      <Face cid={r.cid} size={44} />
                      <div className="phone-app-main">
                        <b className={r.dir === 'missed' ? 'red' : ''}>{nameOf(r)}</b>
                        <span className={r.dir === 'missed' ? 'red' : ''}>
                          <Icon n={r.dir === 'out' ? 'out' : 'inn'} size={13} sw={2.4} />
                          {r.dir === 'missed' ? '부재중 전화' : r.dir === 'in' ? '수신 전화' : '발신 전화'}
                          {r.dur ? ` · ${fmtDur(r.dur)}` : ''}
                        </span>
                      </div>
                      <em className="phone-app-time">{r.game ? fmtTime(r.ts) : fmtDate(r.ts)}</em>
                    </button>
                    {!editRecents && <CallBtn label={`${nameOf(r)}에게 다시 전화`} onClick={() => startCall({ cid: r.cid, number: r.number || '' })} />}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'contacts' && (
            <>
              <div className="phone-app-nav">
                <span style={{ width: 50 }} />
                <button type="button" className="phone-app-navbtn" onClick={() => push({ t: 'add' })} aria-label="연락처 추가"><Icon n="plus" size={24} /></button>
              </div>
              <div className="phone-app-title">연락처</div>
              <div className="phone-app-search">
                <Icon n="search" size={16} color="#8e8e93" />
                <input value={q} placeholder="검색" onChange={(e) => setQ(e.target.value)} aria-label="연락처 검색" />
                {q && <button type="button" onClick={() => setQ('')} aria-label="검색어 지우기"><Icon n="close" size={14} color="#8e8e93" /></button>}
              </div>
              <div className="phone-app-scroll">
                {groups.length === 0 && <div className="phone-app-empty">결과 없음</div>}
                {groups.map((g) => (
                  <div key={g.k}>
                    <div className="phone-app-section">{g.k}</div>
                    {g.items.map((c) => (
                      <button type="button" key={c.id} className="phone-app-row" onClick={() => push({ t: 'detail', cid: c.id })}>
                        <Face cid={c.id} size={40} />
                        <div className="phone-app-main"><b>{c.name}</b><span>{c.phone}</span></div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'keypad' && (
            <div className="phone-app-keypad">
              <div className="phone-app-keyout">
                <div className="phone-app-num">{formatPhone(keys) || ' '}</div>
                <div className="phone-app-match">{matched ? matched.name : ' '}</div>
              </div>
              <div className="phone-app-keys">
                {KEYPAD.map(([k, sub]) => (
                  <button type="button" key={k} onClick={() => setKeys((s) => (s + k).slice(0, 15))}>
                    <b>{k}</b><i>{sub}</i>
                  </button>
                ))}
              </div>
              <div className="phone-app-keyfoot">
                <span />
                <button type="button" className="phone-app-green" disabled={!keys} onClick={() => startCall({ number: keys })} aria-label="전화 걸기">
                  <PhoneGlyph size={32} />
                </button>
                <button type="button" className="phone-app-back" style={{ visibility: keys ? 'visible' : 'hidden' }} onClick={() => setKeys((s) => s.slice(0, -1))} aria-label="지우기">
                  <Icon n="backspace" size={28} color="#8e8e93" />
                </button>
              </div>
            </div>
          )}

          {tab === 'voicemail' && (
            <>
              <div className="phone-app-nav"><span /><span /></div>
              <div className="phone-app-title">음성 사서함</div>
              <div className="phone-app-scroll">
                {voicemail.length === 0 && <div className="phone-app-empty">음성 사서함이 비어 있습니다.</div>}
                {voicemail.map((v) => {
                  const c = byId(v.cid)
                  const open = openVm === v.id
                  const isPlaying = playing?.id === v.id
                  const pos = isPlaying ? playing.pos : pausedAt[v.id] || 0
                  return (
                    <div key={v.id} className="phone-app-vm">
                      <button type="button" className="phone-app-vmhead" onClick={() => setOpenVm(open ? null : v.id)} aria-expanded={open}>
                        <i className={`phone-app-dot ${v.played ? 'off' : ''}`} />
                        <div className="phone-app-main">
                          <b>{c?.name || '알 수 없음'}</b>
                          <span>{c?.phone || ''}</span>
                        </div>
                        <em className="phone-app-time">{fmtDate(v.ts)}</em>
                      </button>
                      {open && (
                        <div className="phone-app-player">
                          <div className="phone-app-prog"><div style={{ width: `${Math.min(100, (pos / v.dur) * 100)}%` }} /></div>
                          <div className="phone-app-ptime"><span>{fmtTimer(pos)}</span><span>-{fmtTimer(Math.max(0, v.dur - pos))}</span></div>
                          <div className="phone-app-pbtns">
                            <button type="button" onClick={() => handlePlay(v)} aria-label={isPlaying ? '일시정지' : '재생'}>{isPlaying ? <Pause /> : <Play />}</button>
                            <button type="button" onClick={() => startCall({ cid: v.cid })} aria-label="회신 전화"><PhoneGlyph size={22} color="currentColor" /></button>
                            <button type="button" className="red" onClick={() => removeVm(v.id)} aria-label="삭제"><Icon n="trash" size={22} /></button>
                          </div>
                          <p className="phone-app-trans">{v.text}</p>
                          <small className="phone-app-len">음성 메시지 {fmtDur(v.dur)}</small>
                        </div>
                      )}
                      {!open && <small className="phone-app-len pad">{fmtDur(v.dur)}</small>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="phone-app-tabbar" role="tablist">
        {TABS.map(([id, label, icon]) => (
          <button type="button" key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => goTab(id)}>
            <span className="phone-app-tabicon">
              <Icon n={icon} size={25} fill={id === 'favorites' && tab === id ? 'currentColor' : 'none'} />
              {id === 'voicemail' && unplayed > 0 && <i className="phone-app-badge">{unplayed}</i>}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
