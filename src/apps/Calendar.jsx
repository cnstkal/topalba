import { useEffect, useRef, useState } from 'react'
import Back from '../components/Back'
import { DAYS } from '../utils'
import { useGame } from '../engine/store'
import './Calendar.css'

const HOUR = 57
const COLORS = [
  { c: '#ff3b30', n: '중요' },
  { c: '#ff9500', n: '업무' },
  { c: '#34c759', n: '개인' },
  { c: '#007aff', n: '일정' },
  { c: '#af52de', n: '기타' },
]
const ALERTS = [
  ['none', '없음'],
  ['0', '일정 시작 시'],
  ['5', '5분 전'],
  ['10', '10분 전'],
  ['15', '15분 전'],
  ['30', '30분 전'],
  ['60', '1시간 전'],
  ['1440', '1일 전'],
]
// 월요일 시작 (아이폰 한국어 캘린더와 동일), 2026~2027 공휴일 (읽기 전용 표시)
const HOL_COLOR = '#af52de'
const HOLIDAYS = {
  '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일', '2026-06-03': '전국동시지방선거', '2026-06-06': '현충일', '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일', '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '크리스마스',
  '2027-01-01': '신정',
}


/* ───────── 날짜 유틸 (모두 'YYYY-MM-DD' / 'HH:mm' 문자열 기준) ───────── */
const pad = (n) => String(n).padStart(2, '0')
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (k, n) => {
  const d = parseKey(k)
  d.setDate(d.getDate() + n)
  return keyOf(d)
}
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(m)}`
}
const fmtHour = (h) => `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`
const fmtDate = (k, withYear) => {
  const d = parseKey(k)
  return `${withYear ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}
const onDay = (e, k) => e.startDate <= k && k <= e.endDate
const evMin = (e, k) => (e.allDay ? -1 : e.startDate < k ? 0 : toMin(e.startTime))
const dayEvents = (events, k) =>
  events.filter((e) => onDay(e, k)).sort((a, b) => evMin(a, k) - evMin(b, k) || a.title.localeCompare(b.title))

function timeLabel(e, k) {
  if (e.allDay) return '종일'
  if (e.startDate === e.endDate) return `${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}`
  if (k === e.startDate) return `${fmtTime(e.startTime)} 시작`
  if (k === e.endDate) return `${fmtTime(e.endTime)} 종료`
  return '종일'
}

/* 시작 > 종료가 되지 않도록 보정 */
function fix(d, changed) {
  const s = `${d.startDate}T${d.allDay ? '00:00' : d.startTime}`
  const e = `${d.endDate}T${d.allDay ? '00:00' : d.endTime}`
  if (e >= s) return d
  if (changed === 'end') return { ...d, endDate: d.startDate, endTime: d.startTime }
  if (d.allDay) return { ...d, endDate: d.startDate }
  const dt = new Date(`${d.startDate}T${d.startTime}`)
  dt.setHours(dt.getHours() + 1)
  return { ...d, endDate: keyOf(dt), endTime: `${pad(dt.getHours())}:${pad(dt.getMinutes())}` }
}

/* 겹치는 일정 나란히 배치 */
function layout(items) {
  const out = []
  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    const lanes = []
    cluster.forEach((it) => {
      let l = lanes.findIndex((end) => end <= it.s)
      if (l < 0) {
        l = lanes.length
        lanes.push(0)
      }
      lanes[l] = it.en
      it.lane = l
    })
    cluster.forEach((it) => out.push({ ...it, lanes: lanes.length }))
    cluster = []
  }
  items.forEach((it) => {
    if (cluster.length && it.s >= clusterEnd) flush()
    cluster.push(it)
    clusterEnd = cluster.length === 1 ? it.en : Math.max(clusterEnd, it.en)
  })
  if (cluster.length) flush()
  return out
}

const alertLabel = (v) => (ALERTS.find((a) => a[0] === String(v)) || ALERTS[0])[1]
const colorName = (c) => (COLORS.find((x) => x.c === c) || COLORS[3]).n

/* ───────── 아이콘 ───────── */
const IcSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </svg>
)
const IcPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/* ───────── 일정 행 ───────── */
function EvRow({ e, k, onOpen }) {
  const sub = [timeLabel(e, k), e.place].filter(Boolean).join(' · ')
  return (
    <button className="ev-row" onClick={() => onOpen(e, k)}>
      <i style={{ background: e.color }} />
      <div>
        <b>{e.title}</b>
        <span>{sub}</span>
      </div>
    </button>
  )
}

/* 날짜별 그룹 (목록 보기, 검색 결과 공용) */
function Groups({ items, onOpen, empty, todayKey }) {
  if (!items.length) return <div className="empty">{empty}</div>
  const groups = []
  items.forEach((it) => {
    const last = groups[groups.length - 1]
    if (last && last.k === it.k) last.list.push(it.e)
    else groups.push({ k: it.k, list: [it.e] })
  })
  return groups.map((g) => (
    <div key={g.k}>
      <div className="cal-list-h">
        {fmtDate(g.k, true)}
        {g.k === todayKey ? ' · 오늘' : ''}
      </div>
      {g.list.map((e) => (
        <EvRow key={e.id + g.k} e={e} k={g.k} onOpen={onOpen} />
      ))}
    </div>
  ))
}

/* ───────── 아이콘 (아이폰 캘린더 스타일) ───────── */
const Svg = ({ children, size = 24, sw = 2.1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const IcChev = () => (
  <Svg size={22} sw={2.6}>
    <path d="M15 4l-8 8 8 8" />
  </Svg>
)
const IcStack = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="17" height="7" rx="2.2" />
    <rect x="3.5" y="13.5" width="17" height="7" rx="2.2" />
    <path d="M7 7h6M7 17h6" />
  </Svg>
)
const IcDayList = () => (
  <Svg>
    <rect x="6.5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M3.2 7.5h.01M3.2 12h.01M3.2 16.5h.01" strokeWidth="3" />
    <path d="M6.5 9h14" />
  </Svg>
)
const IcCal = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="20" height="18" rx="3" fill="currentColor" stroke="none" opacity=".9" />
    <path d="M3 9h20" stroke="#fff" strokeWidth="1.6" />
    <g fill="#fff" stroke="none">
      {[8, 11.5, 15, 18.5].map((x) => [13, 16, 19].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" />))}
    </g>
  </svg>
)
const IcInbox = () => (
  <Svg size={26}>
    <path d="M3.5 13.5l2.4-7.2A2 2 0 017.8 5h8.4a2 2 0 011.9 1.3l2.4 7.2" />
    <path d="M3.5 13.5h5.2a3.3 3.3 0 006.6 0h5.2v4.7A2.3 2.3 0 0118.2 20.5H5.8a2.3 2.3 0 01-2.3-2.3z" />
  </Svg>
)
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.8l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17.4 6.2 20.6l1.3-6.5L2.7 9.6l6.5-.8z" />
  </svg>
)

/* ───────── 연간 보기 ───────── */
function YearView({ Y, todayKey, onPickMonth }) {
  return (
    <div className="c2-year">
      {Array.from({ length: 12 }, (_, m) => {
        const first = (new Date(Y, m, 1).getDay() + 6) % 7
        const dim = new Date(Y, m + 1, 0).getDate()
        const isNow = todayKey.startsWith(`${Y}-${pad(m + 1)}-`)
        return (
          <button key={m} className="c2-mm" onClick={() => onPickMonth(m)}>
            <h4 className={isNow ? 'now' : ''}>{m + 1}월</h4>
            <div className="c2-mm-g">
              {Array.from({ length: first }, (_, i) => (
                <i key={`b${i}`} />
              ))}
              {Array.from({ length: dim }, (_, i) => {
                const k = `${Y}-${pad(m + 1)}-${pad(i + 1)}`
                return (
                  <span key={k} className={k === todayKey ? 'today' : ''}>
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ───────── 월간 보기 ───────── */
function MonthView({ Y, M, events, todayKey, onPick }) {
  const first = (new Date(Y, M, 1).getDay() + 6) % 7
  const dim = new Date(Y, M + 1, 0).getDate()
  const weeks = Math.ceil((first + dim) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = i - first + 1
    return d >= 1 && d <= dim ? keyOf(new Date(Y, M, d)) : null
  })
  return (
    <>
      <div className="c2-wkh">
        {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
          <span key={d} className={i >= 5 ? 'wk' : ''}>
            {d}
          </span>
        ))}
      </div>
      <div className="c2-mgrid" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
        {cells.map((k, i) => {
          if (!k) return <i key={`e${i}`} className="c2-cell" />
          const chips = []
          if (HOLIDAYS[k]) chips.push({ id: 'h', t: HOLIDAYS[k], c: HOL_COLOR })
          dayEvents(events, k).forEach((e) => chips.push({ id: e.id, t: e.title, c: e.color }))
          return (
            <button key={k} className="c2-cell" onClick={() => onPick(k)}>
              <span className={`c2-num ${k === todayKey ? 'today' : ''} ${i % 7 >= 5 ? 'wk' : ''}`}>{parseKey(k).getDate()}</span>
              <span className="c2-chips">
                {chips.slice(0, 3).map((c) => (
                  <em key={c.id} style={{ background: `${c.c}2e`, color: `color-mix(in srgb, ${c.c} 55%, #000)` }}>
                    {c.t}
                  </em>
                ))}
                {chips.length > 3 && <small>+{chips.length - 3}</small>}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ───────── 일간 보기 (주간 스트립 + 시간표) ───────── */
const HourLabel = ({ h }) =>
  h === 12 ? (
    <span className="noon">정오</span>
  ) : h === 0 ? (
    <span>자정</span>
  ) : (
    <span>
      <small>{h < 12 ? '오전' : '오후'}</small>
      <em>{h % 12 || 12}</em>
      <small>시</small>
    </span>
  )

function DayView({ sel, events, todayKey, onOpen, onPick }) {
  const cur = parseKey(sel)
  const weekStart = addDays(sel, -((cur.getDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hol = HOLIDAYS[sel]
  const allDay = events.filter((e) => e.allDay && onDay(e, sel))
  const items = events
    .filter((e) => !e.allDay && onDay(e, sel))
    .map((e) => {
      const s = e.startDate < sel ? 0 : toMin(e.startTime)
      let en = e.endDate > sel ? 1440 : toMin(e.endTime)
      if (en <= s) en = s + 30
      return { e, s, en }
    })
    .sort((a, b) => a.s - b.s)
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 7 * HOUR - 10
  }, [])
  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR

  return (
    <>
      <div className="c2-strip">
        {week.map((k) => {
          const d = parseKey(k)
          return (
            <button key={k} className={`${d.getDay() === 0 || d.getDay() === 6 ? 'wk' : ''} ${k === sel ? 'sel' : ''} ${k === todayKey ? 'today' : ''}`} onClick={() => onPick(k)}>
              <span>{DAYS[d.getDay()]}</span>
              <b>{d.getDate()}</b>
            </button>
          )
        })}
      </div>
      <div className="c2-daytitle">{fmtDate(sel, true)}</div>
      {(hol || allDay.length > 0) && (
        <div className="c2-allday">
          <span className="c2-adl">
            하루
            <br />
            종일
          </span>
          <div>
            {hol && (
              <div className="c2-chip hol">
                <span className="c2-ic">
                  <IcStar />
                </span>
                {hol}
              </div>
            )}
            {allDay.map((e) => (
              <button key={e.id} className="c2-chip" style={{ background: `${e.color}2e`, color: `color-mix(in srgb, ${e.color} 55%, #000)` }} onClick={() => onOpen(e, sel)}>
                <span className="c2-ic" style={{ background: e.color }} />
                {e.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="c2-tl" ref={ref}>
        <div className="c2-tl-in" style={{ height: 24 * HOUR + 100 }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="c2-hl" style={{ top: h * HOUR + 12 }}>
              <HourLabel h={h} />
              <i />
            </div>
          ))}
          <div className="c2-evs" style={{ top: 12 }}>
            {layout(items).map(({ e, s, en, lane, lanes }) => (
              <button
                key={e.id}
                className="c2-evb"
                onClick={() => onOpen(e, sel)}
                style={{
                  top: (s / 60) * HOUR,
                  height: Math.max(((en - s) / 60) * HOUR - 1, 22),
                  left: `${(lane / lanes) * 100}%`,
                  width: `${100 / lanes}%`,
                  background: `${e.color}2e`,
                  borderColor: e.color,
                  color: `color-mix(in srgb, ${e.color} 55%, #000)`,
                }}
              >
                <b>{e.title}</b>
                {en - s >= 45 && <span>{fmtTime(e.startTime)}</span>}
              </button>
            ))}
            {sel === todayKey && <i className="c2-now" style={{ top: nowTop }} />}
          </div>
        </div>
      </div>
    </>
  )
}


/* ───────── 검색 ───────── */
function Search({ events, todayKey, onClose, onOpen }) {
  const [q, setQ] = useState('')
  const text = q.trim().toLowerCase()
  const items = text
    ? events
        .filter((e) => [e.title, e.place, e.note].some((v) => (v || '').toLowerCase().includes(text)))
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.allDay ? '' : a.startTime).localeCompare(b.allDay ? '' : b.startTime))
        .map((e) => ({ k: e.startDate, e }))
    : []
  return (
    <div className="page cal">
      <div className="cal-search-top">
        <div className="cal-sf">
          <IcSearch />
          <input autoFocus value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="제목, 장소, 메모 검색" />
          {q && (
            <button onClick={() => setQ('')} aria-label="지우기">
              ✕
            </button>
          )}
        </div>
        <button className="cal-cancel" onClick={onClose}>
          취소
        </button>
      </div>
      <div className="scroll">
        {text ? (
          <Groups items={items} onOpen={onOpen} empty="검색 결과 없음" todayKey={todayKey} />
        ) : (
          <div className="empty">제목, 장소, 메모로 검색할 수 있어요</div>
        )}
      </div>
    </div>
  )
}

/* ───────── 상세 ───────── */
function Detail({ ev, backLabel, onBack, onEdit, onDelete }) {
  const multi = ev.startDate !== ev.endDate
  const when = (date, time) => (ev.allDay ? fmtDate(date, true) : `${fmtDate(date, true)} ${fmtTime(time)}`)
  return (
    <div className="page cal">
      <div className="nav">
        <Back onClick={onBack}>{backLabel}</Back>
        <button className="nav-btn" onClick={onEdit}>
          편집
        </button>
      </div>
      <div className="scroll ev-detail">
        <div className="cal-dt-head">
          <i style={{ background: ev.color }} />
          <h2>{ev.title}</h2>
        </div>
        <div className="muted">
          {fmtDate(ev.startDate, true)}
          {multi ? ` – ${fmtDate(ev.endDate)}` : ''} · {ev.allDay ? '종일' : timeLabel(ev, ev.startDate)}
        </div>
        <div className="card-list cal-info">
          <div>
            <span>시작</span>
            {when(ev.startDate, ev.startTime)}
          </div>
          <div>
            <span>종료</span>
            {when(ev.endDate, ev.endTime)}
          </div>
          <div>
            <span>종일</span>
            {ev.allDay ? '예' : '아니요'}
          </div>
          <div>
            <span>장소</span>
            {ev.place || '없음'}
          </div>
          <div>
            <span>알림</span>
            {alertLabel(ev.alert)}
          </div>
          <div>
            <span>캘린더</span>
            <em className="cal-cdot" style={{ background: ev.color }} />
            {colorName(ev.color)}
          </div>
          <div>
            <span>메모</span>
            {ev.note || '없음'}
          </div>
        </div>
        <button className="cal-del" onClick={() => onDelete(ev.id)}>
          일정 삭제
        </button>
      </div>
    </div>
  )
}

/* ───────── 추가·편집 시트 ───────── */
function Sheet({ init, onCancel, onSave, onDelete }) {
  const [d, setD] = useState(init)
  const set = (patch, changed) => setD((prev) => fix({ ...prev, ...patch }, changed))
  return (
    <div className="cal-sheet-wrap" onClick={onCancel}>
      <div className="cal-sheet cal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-sheet-nav">
          <button onClick={onCancel}>취소</button>
          <b>{d.id ? '일정 편집' : '새로운 일정'}</b>
          <button className="done" onClick={() => onSave({ ...d, title: d.title.trim() || '새로운 일정' })}>
            완료
          </button>
        </div>
        <div className="cal-sheet-body">
          <input className="cal-title-in" placeholder="제목" value={d.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!d.id} />
          <div className="cal-fr">
            <div className="cal-r">
              <span>종일</span>
              <button className={`switch ${d.allDay ? 'on' : ''}`} onClick={() => set({ allDay: !d.allDay })} aria-label="종일">
                <i />
              </button>
            </div>
            <div className="cal-r">
              <span>시작</span>
              <div className="cal-pair">
                <input type="date" value={d.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value }, 'start')} />
                {!d.allDay && <input type="time" value={d.startTime} onChange={(e) => e.target.value && set({ startTime: e.target.value }, 'start')} />}
              </div>
            </div>
            <div className="cal-r">
              <span>종료</span>
              <div className="cal-pair">
                <input type="date" value={d.endDate} onChange={(e) => e.target.value && set({ endDate: e.target.value }, 'end')} />
                {!d.allDay && <input type="time" value={d.endTime} onChange={(e) => e.target.value && set({ endTime: e.target.value }, 'end')} />}
              </div>
            </div>
            <div className="cal-r">
              <span>알림</span>
              <select value={String(d.alert)} onChange={(e) => set({ alert: e.target.value })}>
                {ALERTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="cal-r">
              <span>캘린더</span>
              <div className="cal-colors">
                {COLORS.map((c) => (
                  <button key={c.c} className={d.color === c.c ? 'on' : ''} style={{ background: c.c, color: c.c }} onClick={() => set({ color: c.c })} aria-label={c.n} />
                ))}
              </div>
            </div>
            <div className="cal-r">
              <span>장소</span>
              <input className="txt" placeholder="장소 추가" value={d.place} onChange={(e) => set({ place: e.target.value })} />
            </div>
            <textarea className="cal-memo" placeholder="메모" value={d.note} onChange={(e) => set({ note: e.target.value })} />
          </div>
          {d.id && (
            <button className="cal-del" onClick={() => onDelete(d.id)}>
              일정 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────── 메인 ───────── */
export default function Calendar() {
  const { state, actions } = useGame()
  const events = Array.isArray(state.calEvents) ? state.calEvents : []
  const todayKey = keyOf(new Date())

  const [view, setView] = useState('month') // year | month | day | list
  const [sel, setSel] = useState(todayKey)
  const [dir, setDir] = useState(1)
  const [detail, setDetail] = useState(null)
  const [edit, setEdit] = useState(null) // { id } — id가 null이면 새 일정
  const [searching, setSearching] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const drag = useRef(null)
  const swiped = useRef(false)

  const cur = parseKey(sel)
  const Y = cur.getFullYear()
  const M = cur.getMonth()

  const pick = (k) => {
    setDir(k >= sel ? 1 : -1)
    setSel(k)
  }
  const clampDate = (y, m, day) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()))
  const move = (n) => {
    const d = parseKey(sel)
    let next
    if (view === 'year') next = clampDate(d.getFullYear() + n, d.getMonth(), d.getDate())
    else if (view === 'month') next = clampDate(d.getFullYear(), d.getMonth() + n, d.getDate())
    else if (view === 'day') next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
    else return
    setDir(n)
    setSel(keyOf(next))
  }
  const openEv = (e, k) => {
    if (k) setSel(k)
    setSearching(false)
    setDetail(e.id)
  }
  const blank = () => {
    const now = new Date()
    const h = sel === todayKey ? Math.min(now.getHours() + 1, 22) : 9
    return { id: null, title: '', startDate: sel, startTime: `${pad(h)}:00`, endDate: sel, endTime: `${pad(h + 1)}:00`, allDay: false, place: '', note: '', alert: '10', color: COLORS[3].c }
  }
  const save = (draft) => {
    actions.saveCalEvent({ ...draft, id: draft.id || `ce${Date.now()}` })
    pick(draft.startDate)
    setEdit(null)
  }
  const remove = (id) => {
    actions.deleteCalEvent(id)
    setConfirmDel(null)
    setEdit(null)
    setDetail(null)
  }

  // 좌우로 밀어 넘기기 (터치·마우스 공용). 넘긴 직후에 발생하는 클릭은 무시
  const swipe = {
    onPointerDown: (e) => {
      drag.current = { x: e.clientX, y: e.clientY }
      swiped.current = false
    },
    onPointerUp: (e) => {
      const d = drag.current
      drag.current = null
      if (!d) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiped.current = true
        move(dx < 0 ? 1 : -1)
      }
    },
    onPointerCancel: () => {
      drag.current = null
    },
    onClickCapture: (e) => {
      if (swiped.current) {
        e.stopPropagation()
        e.preventDefault()
        swiped.current = false
      }
    },
  }

  const ev = detail ? events.find((e) => e.id === detail) : null
  const editInit = edit ? (edit.id ? events.find((e) => e.id === edit.id) : blank()) : null

  let body
  if (searching) {
    body = <Search events={events} todayKey={todayKey} onClose={() => setSearching(false)} onOpen={openEv} />
  } else if (ev) {
    body = <Detail ev={ev} backLabel={`${M + 1}월`} onBack={() => setDetail(null)} onEdit={() => setEdit({ id: ev.id })} onDelete={setConfirmDel} />
  } else {
    const upcoming = events
      .filter((e) => e.endDate >= todayKey)
      .map((e) => ({ k: e.startDate > todayKey ? e.startDate : todayKey, e }))
      .sort((a, b) => a.k.localeCompare(b.k) || evMin(a.e, a.k) - evMin(b.e, b.k))
    const backLabel = view === 'month' ? `${Y}년` : `${M + 1}월`
    const goBack = () => setView(view === 'month' ? 'year' : 'month')
    const toggleLayout = () => setView(view === 'month' ? 'day' : 'month')

    body = (
      <div className="page cal c2">
        <div className="c2-top">
          {view === 'year' ? (
            <span />
          ) : (
            <button className="c2-pill c2-back" onClick={goBack}>
              <IcChev />
              {backLabel}
            </button>
          )}
          <div className="c2-pill c2-tools">
            {(view === 'month' || view === 'day') && (
              <button onClick={toggleLayout} aria-label="보기 전환">
                {view === 'month' ? <IcStack /> : <IcDayList />}
              </button>
            )}
            <button onClick={() => setSearching(true)} aria-label="검색">
              <IcSearch />
            </button>
            <button onClick={() => setEdit({ id: null })} aria-label="새 일정">
              <IcPlus />
            </button>
          </div>
        </div>

        <div className="c2-body" {...swipe}>
          {view === 'year' && (
            <div key={`y${Y}`} className={`c2-pane ${dir > 0 ? 'in-n' : 'in-p'}`}>
              <div className="c2-ytitle">{Y}년</div>
              <YearView
                Y={Y}
                todayKey={todayKey}
                onPickMonth={(m) => {
                  setSel(keyOf(todayKey.startsWith(`${Y}-${pad(m + 1)}-`) ? new Date() : new Date(Y, m, 1)))
                  setView('month')
                }}
              />
            </div>
          )}
          {view === 'month' && (
            <div key={`m${Y}-${M}`} className={`c2-pane ${dir > 0 ? 'in-n' : 'in-p'}`}>
              <div className="c2-mtitle">{M + 1}월</div>
              <MonthView
                Y={Y}
                M={M}
                events={events}
                todayKey={todayKey}
                onPick={(k) => {
                  setSel(k)
                  setView('day')
                }}
              />
            </div>
          )}
          {view === 'day' && <DayView sel={sel} events={events} todayKey={todayKey} onOpen={openEv} onPick={pick} />}
          {view === 'list' && (
            <div className="c2-pane">
              <div className="c2-mtitle">예정된 일정</div>
              <div className="scroll">
                <Groups items={upcoming} onOpen={openEv} empty="예정된 일정 없음" todayKey={todayKey} />
              </div>
            </div>
          )}
        </div>

        <div className="c2-bottom">
          <button className="c2-pill c2-today" onClick={() => pick(todayKey)}>
            오늘
          </button>
          <div className="c2-pill c2-tools">
            <button className={view !== 'list' ? 'on' : ''} onClick={() => setView('month')} aria-label="캘린더">
              <IcCal />
            </button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="예정된 일정">
              <IcInbox />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {body}
      {editInit && <Sheet key={edit.id || 'new'} init={editInit} onCancel={() => setEdit(null)} onSave={save} onDelete={setConfirmDel} />}
      {confirmDel && (
        <div className="alert-wrap">
          <div className="alert">
            <b>일정을 삭제할까요?</b>
            <p>삭제한 일정은 복구할 수 없습니다.</p>
            <div>
              <button onClick={() => setConfirmDel(null)}>취소</button>
              <button style={{ color: '#ff3b30' }} onClick={() => remove(confirmDel)}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
