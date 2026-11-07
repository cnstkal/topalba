import { useEffect, useRef, useState } from 'react'
import { DAYS } from '../utils'

/* ───────────────────────── 상수·유틸 ───────────────────────── */
const LS = 'private-clock-v1' // 시계 앱 전용 저장 키 (게임 저장 데이터와 분리)
const ITEM = 36
const HOME = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'
  } catch (e) {
    return 'Asia/Seoul'
  }
})()

const CATALOG = [
  ['서울', 'Asia/Seoul'], ['뉴욕', 'America/New_York'], ['런던', 'Europe/London'], ['도쿄', 'Asia/Tokyo'],
  ['파리', 'Europe/Paris'], ['베를린', 'Europe/Berlin'], ['로마', 'Europe/Rome'], ['마드리드', 'Europe/Madrid'],
  ['이스탄불', 'Europe/Istanbul'], ['모스크바', 'Europe/Moscow'], ['카이로', 'Africa/Cairo'], ['요하네스버그', 'Africa/Johannesburg'],
  ['두바이', 'Asia/Dubai'], ['뭄바이', 'Asia/Kolkata'], ['방콕', 'Asia/Bangkok'], ['호치민', 'Asia/Ho_Chi_Minh'],
  ['자카르타', 'Asia/Jakarta'], ['싱가포르', 'Asia/Singapore'], ['홍콩', 'Asia/Hong_Kong'], ['타이베이', 'Asia/Taipei'],
  ['상하이', 'Asia/Shanghai'], ['마닐라', 'Asia/Manila'], ['시드니', 'Australia/Sydney'], ['오클랜드', 'Pacific/Auckland'],
  ['호놀룰루', 'Pacific/Honolulu'], ['로스앤젤레스', 'America/Los_Angeles'], ['덴버', 'America/Denver'], ['시카고', 'America/Chicago'],
  ['토론토', 'America/Toronto'], ['멕시코시티', 'America/Mexico_City'], ['상파울루', 'America/Sao_Paulo'], ['부에노스아이레스', 'America/Argentina/Buenos_Aires'],
]
const TZ_NAME = {}
CATALOG.forEach(([n, z]) => (TZ_NAME[z] = n))

const pad = (n) => String(n).padStart(2, '0')
const fmt12 = (h, m) => `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(m)}`

/* 실제 시간대 기준 '벽시계 시각'을 UTC 값으로 환산 */
const fmtCache = {}
function wall(ms, tz) {
  let f = fmtCache[tz]
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    fmtCache[tz] = f
  }
  const p = {}
  f.formatToParts(ms).forEach((x) => (p[x.type] = x.value))
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
}

function cityInfo(tz, now) {
  const cw = wall(now, tz)
  const hw = wall(now, HOME)
  const dd = Math.floor(cw / 864e5) - Math.floor(hw / 864e5)
  const diff = Math.round(((cw - hw) / 3600000) * 4) / 4
  const d = new Date(cw)
  return {
    h: d.getUTCHours(),
    m: d.getUTCMinutes(),
    day: dd === 0 ? '오늘' : dd > 0 ? '내일' : '어제',
    diff: `${diff >= 0 ? '+' : '-'}${Math.abs(diff)}시간`,
  }
}

const repText = (r) => {
  if (!r.length) return ''
  if (r.length === 7) return '매일'
  const s = [...r].sort().join(',')
  if (s === '1,2,3,4,5') return '평일'
  if (s === '0,6') return '주말'
  return [...r].sort().map((i) => DAYS[i]).join(', ')
}

function fmtSw(ms) {
  const cs = Math.floor(ms / 10)
  const c = cs % 100
  const s = Math.floor(cs / 100) % 60
  const m = Math.floor(cs / 6000) % 60
  const h = Math.floor(cs / 360000)
  return `${h ? `${h}:${pad(m)}` : pad(m)}:${pad(s)}.${pad(c)}`
}

function fmtRemain(ms) {
  const t = Math.ceil(ms / 1000)
  const h = Math.floor(t / 3600)
  const m = Math.floor(t / 60) % 60
  const s = t % 60
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/* ───────────────────────── 상태 저장소 (모듈 단위) ─────────────────────────
   시간 계산은 모두 타임스탬프(Date.now) 기준이라 화면 이동·앱 종료·재렌더링에도 오차가 쌓이지 않는다. */
const DEF = () => ({
  cities: ['Asia/Seoul', 'America/New_York', 'Europe/London', 'Asia/Tokyo'],
  alarms: [{ id: 'al-wake', h: 7, m: 0, label: '기상', repeat: [1, 2, 3, 4, 5], on: false, last: '' }],
  snoozes: [],
  sw: { acc: 0, start: null, laps: [] },
  timer: { state: 'idle', total: 0, end: null, remain: 0 },
  last: [0, 5, 0],
})

function load() {
  const d = DEF()
  try {
    const r = JSON.parse(localStorage.getItem(LS))
    if (r && typeof r === 'object') {
      return {
        cities: Array.isArray(r.cities) ? r.cities.filter((z) => TZ_NAME[z]) : d.cities,
        alarms: Array.isArray(r.alarms) ? r.alarms : d.alarms,
        snoozes: Array.isArray(r.snoozes) ? r.snoozes : [],
        sw: { ...d.sw, ...(r.sw || {}) },
        timer: { ...d.timer, ...(r.timer || {}) },
        last: Array.isArray(r.last) && r.last.length === 3 ? r.last : d.last,
      }
    }
  } catch (e) {
    /* 손상된 데이터는 기본값 사용 */
  }
  return d
}

const store = { s: load(), subs: new Set(), rings: [], mounted: 0 }
const emit = () => store.subs.forEach((f) => f())
function commit(fn) {
  store.s = fn(store.s)
  try {
    localStorage.setItem(LS, JSON.stringify(store.s))
  } catch (e) {
    /* 저장 공간 부족 등은 무시 */
  }
  emit()
}
function useStore() {
  const [, set] = useState(0)
  useEffect(() => {
    const f = () => set((n) => n + 1)
    store.subs.add(f)
    return () => store.subs.delete(f)
  }, [])
  return store.s
}

/* 화면 갱신용 틱 (표시만 갱신하고 값은 항상 Date.now()에서 계산) */
function useTick(mode) {
  const [, set] = useState(0)
  useEffect(() => {
    if (!mode) return undefined
    let id
    if (mode === 'raf') {
      const loop = () => {
        set((n) => n + 1)
        id = requestAnimationFrame(loop)
      }
      id = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(id)
    }
    const step = () => {
      set((n) => n + 1)
      id = setTimeout(step, 1000 - (Date.now() % 1000) + 10)
    }
    id = setTimeout(step, 1000 - (Date.now() % 1000) + 10)
    return () => clearTimeout(id)
  }, [mode])
}

/* ───────────────────────── 알람·타이머 울림 처리 ───────────────────────── */
function beep(n) {
  try {
    const A = window.AudioContext || window.webkitAudioContext
    const c = new A()
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator()
      const g = c.createGain()
      o.frequency.value = 880
      g.gain.value = 0.07
      o.connect(g)
      g.connect(c.destination)
      o.start(c.currentTime + i * 0.4)
      o.stop(c.currentTime + i * 0.4 + 0.2)
    }
    setTimeout(() => c.close(), n * 400 + 500)
  } catch (e) {
    /* 오디오가 막힌 환경은 무시 */
  }
}

const BANNER_ICON =
  '<svg width="30" height="30" viewBox="0 0 30 30"><rect width="30" height="30" fill="#ff9500"/><circle cx="15" cy="16" r="7" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M15 12v4.2l2.4 1.6M7.5 9.5l2.6-2.2M22.5 9.5l-2.6-2.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>'

/* 시계 앱이 닫혀 있을 때는 폰 화면 위에 알림 배너로 표시 */
function toast(info) {
  const phone = document.querySelector('.phone')
  if (!phone) return
  const el = document.createElement('div')
  el.className = 'banner'
  const ic = document.createElement('div')
  ic.className = 'banner-icon'
  ic.innerHTML = BANNER_ICON
  const tx = document.createElement('div')
  tx.className = 'banner-text'
  const b = document.createElement('b')
  b.textContent = info.kind === 'alarm' ? '알람' : '타이머'
  const sp = document.createElement('span')
  sp.textContent = info.kind === 'alarm' ? `${info.label} · ${fmt12(info.h, info.m)}` : '타이머가 완료되었습니다'
  tx.appendChild(b)
  tx.appendChild(sp)
  el.appendChild(ic)
  el.appendChild(tx)
  el.onclick = () => el.remove()
  setTimeout(() => el.remove(), 8000)
  phone.appendChild(el)
}

function fire(info) {
  beep(info.kind === 'alarm' ? 4 : 3)
  if (store.mounted > 0) {
    store.rings.push(info)
    emit()
  } else toast(info)
}

function tick() {
  const now = Date.now()
  const d = new Date(now)
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
  const s = store.s
  const fires = []
  let changed = false

  const alarms = s.alarms.map((a) => {
    if (!a.on || a.last === stamp || a.h !== d.getHours() || a.m !== d.getMinutes()) return a
    if (a.repeat.length && !a.repeat.includes(d.getDay())) return a
    fires.push({ kind: 'alarm', id: a.id, label: a.label || '알람', h: a.h, m: a.m })
    changed = true
    return { ...a, last: stamp, on: a.repeat.length > 0 } // 반복 없는 알람은 울린 뒤 꺼짐
  })

  const due = s.snoozes.filter((z) => z.at <= now)
  const snoozes = due.length ? s.snoozes.filter((z) => z.at > now) : s.snoozes
  due.forEach((z) => {
    fires.push({ kind: 'alarm', id: z.id, label: z.label, h: z.h, m: z.m })
    changed = true
  })

  let timer = s.timer
  if (timer.state === 'run' && timer.end <= now) {
    timer = { state: 'idle', total: 0, end: null, remain: 0 }
    fires.push({ kind: 'timer' })
    changed = true
  }

  if (changed) commit((p) => ({ ...p, alarms, snoozes, timer }))
  fires.forEach(fire)
}

if (typeof window !== 'undefined') {
  if (window.__ckSched) clearInterval(window.__ckSched)
  window.__ckSched = setInterval(tick, 1000)
}

/* ───────────────────────── 아이콘 ───────────────────────── */
const Ic = ({ children, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const TAB_ICON = {
  world: (
    <Ic>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18" />
    </Ic>
  ),
  alarm: (
    <Ic>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.6 1.8M4 6.2L7.2 3.6M20 6.2l-3.2-2.6" />
    </Ic>
  ),
  sw: (
    <Ic>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9.6M9.6 3h4.8M12 3v3M18.2 6.6l1.3-1.3" />
    </Ic>
  ),
  timer: (
    <Ic>
      <path d="M6.5 3h11M6.5 21h11M7.6 3c0 5 4.4 6 4.4 9s-4.4 4-4.4 9M16.4 3c0 5-4.4 6-4.4 9s4.4 4 4.4 9" />
    </Ic>
  ),
}
const TABS = [
  ['world', '세계 시계'],
  ['alarm', '알람'],
  ['sw', '스톱워치'],
  ['timer', '타이머'],
]
const Plus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/* ───────────────────────── 휠 피커 ───────────────────────── */
function Wheel({ items, index, onChange, width = 72, unit }) {
  const ref = useRef(null)
  const timer = useRef(0)
  const cur = useRef(index)
  cur.current = index
  useEffect(() => {
    ref.current.scrollTop = index * ITEM
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onScroll = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const i = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM)))
      if (i !== cur.current) onChange(i)
    }, 70)
  }
  return (
    <>
      <div className="ck-wheel" ref={ref} onScroll={onScroll} style={{ width }}>
        {items.map((x, i) => (
          <div key={i} className={i === index ? 'on' : ''} onClick={() => ref.current.scrollTo({ top: i * ITEM, behavior: 'smooth' })}>
            {x}
          </div>
        ))}
      </div>
      {unit && <span className="ck-unit">{unit}</span>}
    </>
  )
}
const range = (n, from = 0) => Array.from({ length: n }, (_, i) => String(i + from))
const MIN60 = Array.from({ length: 60 }, (_, i) => pad(i))

/* ───────────────────────── 세계 시계 ───────────────────────── */
function World() {
  const st = useStore()
  useTick('sec')
  const [edit, setEdit] = useState(false)
  const [conf, setConf] = useState(null)
  const [adding, setAdding] = useState(false)
  const now = Date.now()
  return (
    <>
      <div className="nav">
        <button className="nav-btn" onClick={() => { setEdit(!edit); setConf(null) }}>{edit ? '완료' : '편집'}</button>
        <button className="nav-btn" onClick={() => setAdding(true)} aria-label="도시 추가"><Plus /></button>
      </div>
      <div className="large-title">세계 시계</div>
      <div className="scroll">
        {st.cities.length === 0 && <div className="empty">도시 없음</div>}
        {st.cities.map((tz) => {
          const c = cityInfo(tz, now)
          return (
            <div key={tz} className="ck-row">
              {edit && <button className="ck-minus" onClick={() => setConf(conf === tz ? null : tz)} aria-label="삭제 표시">−</button>}
              <div className="ck-city">
                <span>{c.day}, {c.diff}</span>
                <b>{TZ_NAME[tz]}</b>
              </div>
              {conf === tz ? (
                <button className="ck-del" onClick={() => { commit((p) => ({ ...p, cities: p.cities.filter((z) => z !== tz) })); setConf(null) }}>삭제</button>
              ) : (
                <div className="ck-time"><small>{c.h < 12 ? '오전' : '오후'}</small>{c.h % 12 || 12}:{pad(c.m)}</div>
              )}
            </div>
          )
        })}
      </div>
      {adding && <AddCity cities={st.cities} onClose={() => setAdding(false)} />}
    </>
  )
}

function AddCity({ cities, onClose }) {
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const list = CATALOG.filter(([n, z]) => !cities.includes(z) && (!t || n.includes(t) || z.toLowerCase().includes(t)))
  const now = Date.now()
  return (
    <div className="ck-sheet-wrap" onClick={onClose}>
      <div className="ck-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ck-sheet-nav"><button onClick={onClose}>취소</button><b>도시 선택</b><span /></div>
        <div className="ck-search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" autoFocus /></div>
        <div className="ck-sheet-body">
          {list.length === 0 && <div className="empty">결과 없음</div>}
          {list.map(([n, z]) => (
            <button key={z} className="ck-pick" onClick={() => { commit((p) => ({ ...p, cities: [...p.cities, z] })); onClose() }}>
              <b>{n}</b>
              <span>{cityInfo(z, now).diff}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 알람 ───────────────────────── */
function Alarms() {
  const st = useStore()
  const [edit, setEdit] = useState(false)
  const [conf, setConf] = useState(null)
  const [sheet, setSheet] = useState(null) // 알람 객체 또는 'new'
  const list = [...st.alarms].sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m))
  const toggle = (id) => commit((p) => ({ ...p, alarms: p.alarms.map((a) => (a.id === id ? { ...a, on: !a.on, last: '' } : a)) }))
  return (
    <>
      <div className="nav">
        <button className="nav-btn" onClick={() => { setEdit(!edit); setConf(null) }}>{edit ? '완료' : '편집'}</button>
        <button className="nav-btn" onClick={() => setSheet('new')} aria-label="알람 추가"><Plus /></button>
      </div>
      <div className="large-title">알람</div>
      <div className="scroll">
        <div className="ck-sec">기타</div>
        {list.length === 0 && <div className="empty">알람 없음</div>}
        {list.map((a) => {
          const sub = [a.label || '알람', repText(a.repeat)].filter(Boolean).join(', ')
          return (
            <div key={a.id} className={`ck-row ck-al ${a.on ? '' : 'off'}`}>
              {edit && <button className="ck-minus" onClick={() => setConf(conf === a.id ? null : a.id)} aria-label="삭제 표시">−</button>}
              <button className="ck-al-main" onClick={() => setSheet(a)}>
                <div className="ck-time"><small>{a.h < 12 ? '오전' : '오후'}</small>{a.h % 12 || 12}:{pad(a.m)}</div>
                <span>{sub}</span>
              </button>
              {conf === a.id ? (
                <button className="ck-del" onClick={() => { commit((p) => ({ ...p, alarms: p.alarms.filter((x) => x.id !== a.id), snoozes: p.snoozes.filter((z) => z.id !== a.id) })); setConf(null) }}>삭제</button>
              ) : (
                <div className={`ck-sw ${a.on ? 'on' : ''}`} role="switch" aria-checked={a.on} onClick={() => toggle(a.id)}><i /></div>
              )}
            </div>
          )
        })}
      </div>
      {sheet && <AlarmSheet init={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} />}
    </>
  )
}

function AlarmSheet({ init, onClose }) {
  const [d, setD] = useState(() => {
    if (init) return { ...init }
    const n = new Date()
    return { id: null, h: n.getHours(), m: n.getMinutes(), label: '알람', repeat: [], on: true, last: '' }
  })
  const ap = d.h >= 12 ? 1 : 0
  const hi = (d.h % 12 || 12) - 1
  const setTime = (a, h, m) => setD((p) => ({ ...p, h: ((h + 1) % 12) + a * 12, m }))
  const save = () => {
    const a = { ...d, on: true, last: '', label: d.label.trim(), repeat: [...d.repeat].sort() }
    commit((p) => ({
      ...p,
      alarms: a.id ? p.alarms.map((x) => (x.id === a.id ? a : x)) : [...p.alarms, { ...a, id: `al${Date.now()}` }],
      snoozes: a.id ? p.snoozes.filter((z) => z.id !== a.id) : p.snoozes,
    }))
    onClose()
  }
  const del = () => {
    commit((p) => ({ ...p, alarms: p.alarms.filter((x) => x.id !== d.id), snoozes: p.snoozes.filter((z) => z.id !== d.id) }))
    onClose()
  }
  return (
    <div className="ck-sheet-wrap" onClick={onClose}>
      <div className="ck-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ck-sheet-nav">
          <button onClick={onClose}>취소</button>
          <b>{d.id ? '알람 편집' : '알람 추가'}</b>
          <button className="done" onClick={save}>저장</button>
        </div>
        <div className="ck-sheet-body">
          <div className="ck-picker">
            <div className="ck-band" />
            <Wheel items={['오전', '오후']} index={ap} width={78} onChange={(i) => setTime(i, hi, d.m)} />
            <Wheel items={range(12, 1)} index={hi} width={70} onChange={(i) => setTime(ap, i, d.m)} />
            <Wheel items={MIN60} index={d.m} width={70} onChange={(i) => setTime(ap, hi, i)} />
          </div>
          <div className="ck-group">
            <div className="ck-fr">
              <span>반복</span>
              <div className="ck-days">
                {DAYS.map((x, i) => (
                  <button key={x} className={d.repeat.includes(i) ? 'on' : ''} onClick={() => setD((p) => ({ ...p, repeat: p.repeat.includes(i) ? p.repeat.filter((v) => v !== i) : [...p.repeat, i] }))}>{x}</button>
                ))}
              </div>
            </div>
            <div className="ck-fr">
              <span>레이블</span>
              <input className="ck-txt" value={d.label} onChange={(e) => setD((p) => ({ ...p, label: e.target.value }))} placeholder="알람" />
            </div>
          </div>
          {d.id && <button className="ck-delbtn" onClick={del}>알람 삭제</button>}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 스톱워치 ───────────────────────── */
const swElapsed = (sw) => sw.acc + (sw.start ? Date.now() - sw.start : 0)

function SwTime({ sw }) {
  useTick(sw.start ? 'raf' : null)
  const t = fmtSw(swElapsed(sw))
  return <div className={`ck-swt ${t.length > 8 ? 'long' : ''}`}>{t}</div>
}
function LiveLap({ sw, n, base }) {
  useTick(sw.start ? 'raf' : null)
  return (
    <div className="ck-lap">
      <span>랩 {n}</span>
      <em>{fmtSw(swElapsed(sw) - base)}</em>
    </div>
  )
}

function Stopwatch() {
  const { sw } = useStore()
  const running = !!sw.start
  const started = running || sw.acc > 0
  const upd = (fn) => commit((p) => ({ ...p, sw: fn(p.sw) }))
  const start = () => upd((s) => ({ ...s, start: Date.now() }))
  const stop = () => upd((s) => ({ ...s, acc: swElapsed(s), start: null }))
  const lap = () => upd((s) => ({ ...s, laps: [...s.laps, swElapsed(s)] }))
  const reset = () => upd(() => ({ acc: 0, start: null, laps: [] }))

  const times = sw.laps.map((t, i) => t - (i ? sw.laps[i - 1] : 0))
  const fast = times.length > 1 ? Math.min(...times) : -1
  const slow = times.length > 1 ? Math.max(...times) : -1
  const base = sw.laps.length ? sw.laps[sw.laps.length - 1] : 0

  return (
    <div className="ck-swwrap">
      <SwTime sw={sw} />
      <div className="ck-btns">
        {running ? <button className="ck-cb d" onClick={lap}>랩</button> : started ? <button className="ck-cb d" onClick={reset}>재설정</button> : <button className="ck-cb d dis" disabled>랩</button>}
        {running ? <button className="ck-cb r" onClick={stop}>중단</button> : <button className="ck-cb g" onClick={start}>시작</button>}
      </div>
      <div className="ck-laps">
        {started && <LiveLap sw={sw} n={sw.laps.length + 1} base={base} />}
        {[...times].reverse().map((t, k) => {
          const i = times.length - 1 - k
          return (
            <div key={i} className={`ck-lap ${t === fast ? 'fast' : t === slow ? 'slow' : ''}`}>
              <span>랩 {i + 1}</span>
              <em>{fmtSw(t)}</em>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────── 타이머 ───────────────────────── */
const R = 140
const C = 2 * Math.PI * R

function Timer() {
  const { timer, last } = useStore()
  const live = timer.state === 'run'
  useTick(live ? 'raf' : null)
  const [v, setV] = useState(last)
  const upd = (patch) => commit((p) => ({ ...p, timer: { ...p.timer, ...patch } }))

  if (timer.state === 'idle') {
    const total = (v[0] * 3600 + v[1] * 60 + v[2]) * 1000
    const start = () => {
      if (!total) return
      commit((p) => ({ ...p, last: v, timer: { state: 'run', total, end: Date.now() + total, remain: total } }))
    }
    const set = (k) => (i) => setV((p) => p.map((x, j) => (j === k ? i : x)))
    return (
      <div className="ck-tmwrap">
        <div className="ck-picker tm">
          <div className="ck-band" />
          <Wheel items={range(24)} index={v[0]} width={64} unit="시간" onChange={set(0)} />
          <Wheel items={range(60)} index={v[1]} width={64} unit="분" onChange={set(1)} />
          <Wheel items={range(60)} index={v[2]} width={64} unit="초" onChange={set(2)} />
        </div>
        <div className="ck-btns">
          <button className="ck-cb d dis" disabled>취소</button>
          <button className={`ck-cb g ${total ? '' : 'dis'}`} disabled={!total} onClick={start}>시작</button>
        </div>
      </div>
    )
  }

  const rem = live ? Math.max(0, timer.end - Date.now()) : timer.remain
  const frac = timer.total ? Math.min(1, rem / timer.total) : 0
  const endAt = new Date(Date.now() + rem)
  const txt = fmtRemain(rem)
  return (
    <div className="ck-tmwrap">
      <div className="ck-ring">
        <svg viewBox="0 0 300 300">
          <circle cx="150" cy="150" r={R} fill="none" stroke="#e9e9eb" strokeWidth="10" />
          <circle cx="150" cy="150" r={R} fill="none" stroke="#ff9500" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 150 150)" />
        </svg>
        <div className="ck-ring-in">
          <div className={`ck-ring-t ${txt.length > 5 ? 'long' : ''}`}>{txt}</div>
          <div className="ck-ring-s">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2v3.6l-1.9 3.2a.9.9 0 0 0 .8 1.4h14.6a.9.9 0 0 0 .8-1.4l-1.9-3.2V9A6.2 6.2 0 0 0 12 2.8zM9.7 18.6a2.3 2.3 0 0 0 4.6 0z" /></svg>
            {live ? fmt12(endAt.getHours(), endAt.getMinutes()) : '일시정지됨'}
          </div>
        </div>
      </div>
      <div className="ck-btns">
        <button className="ck-cb d" onClick={() => upd({ state: 'idle', total: 0, end: null, remain: 0 })}>취소</button>
        {live ? (
          <button className="ck-cb o" onClick={() => upd({ state: 'pause', remain: Math.max(0, timer.end - Date.now()), end: null })}>일시정지</button>
        ) : (
          <button className="ck-cb g" onClick={() => upd({ state: 'run', end: Date.now() + timer.remain })}>재개</button>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── 알람·타이머 울림 창 ───────────────────────── */
function RingModal({ r }) {
  const close = () => {
    store.rings.shift()
    emit()
  }
  const snooze = () => {
    commit((p) => ({ ...p, snoozes: [...p.snoozes, { id: r.id, label: r.label, h: r.h, m: r.m, at: Date.now() + 9 * 60000 }] }))
    close()
  }
  return (
    <div className="ck-dim">
      <div className="ck-alert">
        <div className="ck-alert-ic">{TAB_ICON[r.kind === 'alarm' ? 'alarm' : 'timer']}</div>
        {r.kind === 'alarm' ? (
          <>
            <div className="ck-alert-t">{fmt12(r.h, r.m)}</div>
            <div className="ck-alert-s">{r.label}</div>
            <div className="ck-alert-act">
              <button className="o" onClick={snooze}>다시 알림</button>
              <button onClick={close}>중단</button>
            </div>
          </>
        ) : (
          <>
            <div className="ck-alert-t">타이머</div>
            <div className="ck-alert-s">타이머가 완료되었습니다</div>
            <div className="ck-alert-act">
              <button onClick={close}>확인</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── 메인 ───────────────────────── */
export default function Clock() {
  const [tab, setTab] = useState('world')
  useStore()
  useEffect(() => {
    store.mounted += 1
    return () => {
      store.mounted -= 1
      if (store.mounted <= 0) store.rings = []
    }
  }, [])
  const ring = store.rings[0]
  return (
    <div className="page ck">
      {tab === 'world' && <World />}
      {tab === 'alarm' && <Alarms />}
      {tab === 'sw' && <Stopwatch />}
      {tab === 'timer' && <Timer />}
      <div className="ck-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {TAB_ICON[k]}
            <span>{label}</span>
          </button>
        ))}
      </div>
      {ring && <RingModal key={store.rings.length + (ring.id || ring.kind)} r={ring} />}
    </div>
  )
}
