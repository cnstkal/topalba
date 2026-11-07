import { useEffect, useRef, useState } from 'react'
import Back from '../components/Back'
import { DAYS } from '../utils'
import { useGame } from '../engine/store'

const HOUR = 48
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
const VIEWS = [
  ['month', '월'],
  ['week', '주'],
  ['day', '일'],
  ['list', '목록'],
]

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

/* ───────── 주간·일간 시간표 ───────── */
function TimeGrid({ days, events, todayKey, selKey, onOpen, onPickDay }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 7 * HOUR
  }, [])
  const cols = { gridTemplateColumns: `44px repeat(${days.length}, 1fr)` }
  const hasAllDay = days.some((k) => events.some((e) => e.allDay && onDay(e, k)))
  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR

  return (
    <>
      <div className="cal-wk-head" style={cols}>
        <span />
        {days.map((k) => {
          const d = parseKey(k)
          return (
            <button key={k} className={d.getDay() === 0 ? 'sun' : ''} onClick={() => onPickDay(k)}>
              <span>{DAYS[d.getDay()]}</span>
              <span className={`cal-n ${k === todayKey ? 'today' : ''} ${k === selKey && k !== todayKey ? 'pick' : ''}`}>{d.getDate()}</span>
            </button>
          )
        })}
      </div>
      {hasAllDay && (
        <div className="cal-ad" style={cols}>
          <span className="cal-ad-l">종일</span>
          {days.map((k) => (
            <div key={k}>
              {events
                .filter((e) => e.allDay && onDay(e, k))
                .map((e) => (
                  <button key={e.id} style={{ background: e.color }} onClick={() => onOpen(e, k)}>
                    {e.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
      <div className="cal-tg" ref={ref}>
        <div className="cal-tg-in" style={{ height: 24 * HOUR }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="cal-hl" style={{ top: h * HOUR }}>
              {h > 0 && <span>{fmtHour(h)}</span>}
            </div>
          ))}
          <div className="cal-cols" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((k) => {
              const items = events
                .filter((e) => !e.allDay && onDay(e, k))
                .map((e) => {
                  const s = e.startDate < k ? 0 : toMin(e.startTime)
                  let en = e.endDate > k ? 1440 : toMin(e.endTime)
                  if (en <= s) en = s + 30
                  return { e, s, en }
                })
                .sort((a, b) => a.s - b.s)
              return (
                <div key={k} className="cal-col">
                  {layout(items).map(({ e, s, en, lane, lanes }) => (
                    <button
                      key={e.id}
                      className="cal-evb"
                      onClick={() => onOpen(e, k)}
                      style={{
                        top: (s / 60) * HOUR,
                        height: Math.max(((en - s) / 60) * HOUR - 1, 20),
                        left: `${(lane / lanes) * 100}%`,
                        width: `${100 / lanes}%`,
                        background: `${e.color}26`,
                        borderColor: e.color,
                        color: e.color,
                      }}
                    >
                      <b>{e.title}</b>
                      {en - s >= 45 && <span>{fmtTime(e.startTime)}</span>}
                    </button>
                  ))}
                  {k === todayKey && <i className="cal-now" style={{ top: nowTop }} />}
                </div>
              )
            })}
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

  const [view, setView] = useState('month')
  const [sel, setSel] = useState(todayKey)
  const [dir, setDir] = useState(1)
  const [detail, setDetail] = useState(null)
  const [edit, setEdit] = useState(null) // { id } — id가 null이면 새 일정
  const [searching, setSearching] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const touchX = useRef(null)

  const cur = parseKey(sel)
  const Y = cur.getFullYear()
  const M = cur.getMonth()

  const pick = (k) => {
    setDir(k >= sel ? 1 : -1)
    setSel(k)
  }
  const move = (n) => {
    const d = parseKey(sel)
    if (view === 'month') {
      const day = d.getDate()
      d.setDate(1)
      d.setMonth(d.getMonth() + n)
      d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
    } else d.setDate(d.getDate() + n * (view === 'week' ? 7 : 1))
    setDir(n)
    setSel(keyOf(d))
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

  const ev = detail ? events.find((e) => e.id === detail) : null
  const editInit = edit ? (edit.id ? events.find((e) => e.id === edit.id) : blank()) : null

  let body
  if (searching) {
    body = <Search events={events} todayKey={todayKey} onClose={() => setSearching(false)} onOpen={openEv} />
  } else if (ev) {
    body = <Detail ev={ev} backLabel={`${M + 1}월`} onBack={() => setDetail(null)} onEdit={() => setEdit({ id: ev.id })} onDelete={setConfirmDel} />
  } else {
    // 달력 계산
    const first = new Date(Y, M, 1).getDay()
    const dim = new Date(Y, M + 1, 0).getDate()
    const weeks = Math.ceil((first + dim) / 7)
    const cells = Array.from({ length: weeks * 7 }, (_, i) => keyOf(new Date(Y, M, 1 - first + i)))
    const weekStart = addDays(sel, -cur.getDay())
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const selEvs = dayEvents(events, sel)
    const upcoming = events
      .filter((e) => e.endDate >= todayKey)
      .map((e) => ({ k: e.startDate > todayKey ? e.startDate : todayKey, e }))
      .sort((a, b) => a.k.localeCompare(b.k) || evMin(a.e, a.k) - evMin(b.e, b.k))

    const title =
      view === 'month' ? `${M + 1}월` : view === 'week' ? `${M + 1}월` : view === 'day' ? `${M + 1}월 ${cur.getDate()}일` : '예정된 일정'
    const sub = view === 'day' ? `${DAYS[cur.getDay()]}요일` : ''

    body = (
      <div className="page cal">
        <div className="nav">
          {view === 'month' || view === 'list' ? (
            <span className="red-txt">{Y}년</span>
          ) : (
            <Back onClick={() => setView('month')}>{M + 1}월</Back>
          )}
          <div className="cal-nav-r">
            <button onClick={() => setSearching(true)} aria-label="검색">
              <IcSearch />
            </button>
            <button onClick={() => setEdit({ id: null })} aria-label="새 일정">
              <IcPlus />
            </button>
          </div>
        </div>
        <div className="cal-title-row">
          <div className="large-title">
            {title}
            {sub && <small>{sub}</small>}
          </div>
          {view !== 'list' && (
            <div className="cal-arrows">
              <button onClick={() => move(-1)} aria-label="이전">
                ‹
              </button>
              <button onClick={() => move(1)} aria-label="다음">
                ›
              </button>
            </div>
          )}
        </div>
        <div className="seg">
          {VIEWS.map(([v, l]) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {l}
            </button>
          ))}
        </div>

        {view === 'month' && (
          <>
            <div className="cal-week">
              {DAYS.map((d, i) => (
                <span key={d} style={{ color: i === 0 ? '#ff3b30' : undefined }}>
                  {d}
                </span>
              ))}
            </div>
            <div
              className="cal-mgrid"
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current == null) return
                const dx = e.changedTouches[0].clientX - touchX.current
                touchX.current = null
                if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1)
              }}
            >
              <div key={`${Y}-${M}`} className={`cal-grid ${dir > 0 ? 'cal-slide-n' : 'cal-slide-p'}`}>
                {cells.map((k, i) => {
                  const d = parseKey(k)
                  const out = d.getMonth() !== M
                  const colors = [...new Set(events.filter((e) => onDay(e, k)).map((e) => e.color))].slice(0, 3)
                  return (
                    <button key={k} onClick={() => pick(k)} className={k === sel ? 'sel' : ''}>
                      <span className={`cal-n ${k === todayKey ? 'today' : ''} ${i % 7 === 0 ? 'sun' : ''} ${out ? 'out' : ''}`}>{d.getDate()}</span>
                      <span className="cal-dots">
                        {colors.map((c) => (
                          <i key={c} style={{ background: c }} />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="cal-list-h">{fmtDate(sel)}</div>
            <div className="scroll">
              {selEvs.length === 0 && <div className="empty">일정 없음</div>}
              {selEvs.map((e) => (
                <EvRow key={e.id} e={e} k={sel} onOpen={openEv} />
              ))}
            </div>
          </>
        )}

        {view === 'week' && <TimeGrid key="week" days={weekDays} events={events} todayKey={todayKey} selKey={sel} onOpen={openEv} onPickDay={(k) => { pick(k); setView('day') }} />}
        {view === 'day' && <TimeGrid key={`day-${sel}`} days={[sel]} events={events} todayKey={todayKey} selKey={sel} onOpen={openEv} onPickDay={pick} />}
        {view === 'list' && (
          <div className="scroll">
            <Groups items={upcoming} onOpen={openEv} empty="예정된 일정 없음" todayKey={todayKey} />
          </div>
        )}

        <div className="cal-bar">
          <button onClick={() => pick(todayKey)}>오늘</button>
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
