// @ts-nocheck
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import './Maps.css'
import { usePersist } from '../engine/persist'
import { W, H, SCALE, MAP_SVG, ROAD_LABELS, AREA_LABELS, ROADS, CATS, catMeta, PLACES, placeById, ME, HOME_VIEW, RECOMMEND, findRoute } from './mapsData'

/* =========================================================
 * 지도 앱 (2D 가상 SVG 벡터 지도)
 * - 실제 지도/타일/외부 API를 사용하지 않습니다.
 * - 도로, 건물, 장소는 모두 창작된 가상 데이터입니다.
 * ========================================================= */

/* ---------- 아이콘 (24x24 선형 SVG, stroke 통일) ---------- */
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  locate: '<path d="m3 11 18-8-8 18-2-8z"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  star: '<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.4l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  utensils: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"/>',
  store: '<path d="m3 9 1-5h16l1 5M4 9v11h16V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  cross: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/>',
  tree: '<path d="M12 22v-5M12 17c-4 0-7-3-7-6.5C5 6 8.5 2 12 2s7 4 7 8.5c0 3.5-3 6.5-7 6.5z"/>',
  landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  bus: '<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3M9 18h5"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
  car: '<path d="M5 17H4a1 1 0 0 1-1-1v-4l2-5a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 17 7l2 5v4a1 1 0 0 1-1 1h-1M3 12h16M8 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6-1.8-3 1.3-4.5 3 1.5 2.5 1M7 12l1.5-3.5M12.5 15l3.5 6"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  swap: '<path d="M7 4v15M3 15l4 4 4-4M17 20V5M13 9l4-4 4 4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  road: '<path d="M4 22 8 2M20 22 16 2M12 4v3M12 11v3M12 18v3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
}
const Ic = ({ n, s = 20, fill = 'none', sw = 1.9 }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: I[n] }} />
)
const ClearIc = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#b9b9be" /><path d="m6.8 6.8 6.4 6.4M13.2 6.8l-6.4 6.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const CompassIc = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 4.5 15 12H9z" fill="#ff3b30" />
    <path d="M12 19.5 9 12h6z" fill="#8e8e93" />
    <circle cx="12" cy="12" r="1.2" fill="#fff" />
  </svg>
)

/* ---------- 유틸 ---------- */
const km = (m) => (m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`)
const mins = (s) => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분` }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const distMe = (p) => Math.hypot(p.x - ME.x, p.y - ME.y) * SCALE
const norm = (s) => s.replace(/\s/g, '').toLowerCase()
const MODES = [
  { k: 'driving', l: '자동차', i: 'car' },
  { k: 'walking', l: '도보', i: 'walk' },
  { k: 'transit', l: '대중교통', i: 'bus' },
  { k: 'cycling', l: '자전거', i: 'bike' },
]
const KMIN = 0.55, KMAX = 3.4
const TOP_BAR = 52 // 상태 표시줄 영역
const BOT_BAR = 34 // 홈 인디케이터 영역
const ME_ENDPOINT = { id: 'me', name: '현재 위치 (가상)', x: ME.x, y: ME.y }
const endpoint = (id) => (id === 'me' ? ME_ENDPOINT : placeById(id))

function searchAll(qs) {
  const t = norm(qs)
  if (!t) return { cats: [], places: [], roads: [] }
  const cats = CATS.filter((c) => c.l.includes(t) || (t.length > 1 && t.includes(c.l)))
  const places = PLACES.map((p) => {
    const nm = norm(p.name), rest = norm(catMeta(p.cat).l + p.addr + p.road)
    const s = nm.startsWith(t) ? 3 : nm.includes(t) ? 2 : rest.includes(t) ? 1 : 0
    return [p, s]
  }).filter((a) => a[1]).sort((a, b) => b[1] - a[1] || distMe(a[0]) - distMe(b[0])).map((a) => a[0])
  const roads = ROADS.filter((r) => norm(r.name).includes(t))
  return { cats, places, roads }
}

/* ---------- 자체 제작 썸네일 ---------- */
function Thumb({ p }) {
  const m = catMeta(p.cat)
  let h = 0
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = (n) => ((h >> n) & 15) / 15
  const bars = [0, 1, 2, 3, 4].map((n) => ({ x: 8 + n * 30, w: 20 + rnd(n) * 12, hh: 24 + rnd(n + 3) * 34 }))
  return (
    <svg className="mp-thumb" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={'mg-' + p.id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.c} stopOpacity=".95" />
          <stop offset="1" stopColor={m.c} stopOpacity=".62" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={'url(#mg-' + p.id + ')'} />
      {bars.map((b, n) => <rect key={n} x={b.x} y={100 - b.hh} width={b.w} height={b.hh} rx="3" fill="#fff" opacity={0.12 + (n % 3) * 0.06} />)}
      <circle cx={120 + rnd(5) * 20} cy={22 + rnd(7) * 10} r={10 + rnd(9) * 5} fill="#fff" opacity=".16" />
      <g transform="translate(60 26) scale(1.75)" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: I[m.i] }} />
    </svg>
  )
}

/* ---------- 지도 레이어 (정적, 재렌더 방지) ---------- */
const MapLayer = memo(function MapLayer() {
  return <g dangerouslySetInnerHTML={{ __html: MAP_SVG }} />
})

const iconG = (name, size, color = '#fff', sw = 2.2) => {
  const sc = size / 24
  return <g transform={`translate(${-size / 2} ${-size / 2}) scale(${sc})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: I[name] }} />
}

function Labels({ k }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {k >= 0.7 && AREA_LABELS.map((a) => (
        <text key={a.t + a.x} transform={`translate(${a.x} ${a.y}) scale(${1 / k})`} className={'mp-area ' + a.kind} textAnchor="middle">{a.t}</text>
      ))}
      {k >= 0.9 && ROAD_LABELS.filter((r) => (r.cls === 'a' ? k >= 1.5 : true)).map((r) => (
        <text key={r.t} transform={`translate(${r.x} ${r.y}) rotate(${r.a}) scale(${1 / k})`} className={'mp-road ' + r.cls} textAnchor="middle" dy="3.5">{r.t}</text>
      ))}
    </g>
  )
}

const Pin = ({ m, big }) => (
  <g transform={big ? 'scale(1.18)' : undefined}>
    <path d="M0 0C-9-10-14-16-14-23a14 14 0 0 1 28 0c0 7-5 13-14 23z" fill={m.c} stroke="#fff" strokeWidth="2.4" />
    <g transform="translate(0 -23)">{iconG(m.i, 16)}</g>
  </g>
)
const Badge = ({ m }) => (
  <g>
    <circle r="12" fill={m.c} stroke="#fff" strokeWidth="2.4" />
    {iconG(m.i, 14)}
  </g>
)

function Markers({ k, cat, sel, onPick }) {
  const list = cat ? PLACES.filter((p) => p.cat === cat) : PLACES
  const selP = sel ? placeById(sel) : null
  const rest = list.filter((p) => p.id !== sel)
  const label = (p, y) => (
    <text y={y} textAnchor="middle" className="mp-plabel">{p.name}</text>
  )
  return (
    <g>
      {rest.map((p) => {
        const m = catMeta(p.cat)
        const showL = cat ? k >= 0.95 : k >= 1.45
        return (
          <g key={p.id} transform={`translate(${p.x} ${p.y}) scale(${1 / k})`} onClick={(e) => { e.stopPropagation(); onPick(p) }} style={{ cursor: 'pointer' }}>
            <circle r="20" fill="transparent" cy={cat ? -14 : 0} />
            {cat ? <Pin m={m} /> : <Badge m={m} />}
            {showL && label(p, cat ? 14 : 24)}
          </g>
        )
      })}
      {selP && (
        <g transform={`translate(${selP.x} ${selP.y}) scale(${1 / k})`} onClick={(e) => { e.stopPropagation(); onPick(selP) }} style={{ cursor: 'pointer' }}>
          <Pin m={catMeta(selP.cat)} big />
          {label(selP, 16)}
        </g>
      )}
    </g>
  )
}

/* ---------- 메인 ---------- */
export default function Maps({ close }) {
  const [fav, setFav] = usePersist('maps.fav2', ['p101', 'p102', 'p103'])
  const [recent, setRecent] = usePersist('maps.recent2', [])
  const [view, setView] = useState(HOME_VIEW)
  const [size, setSize] = useState({ w: 390, h: 800 })
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [pickFor, setPickFor] = useState(null) // 'from' | 'to'
  const [cat, setCat] = useState(null)
  const [sel, setSel] = useState(null)
  const [sheet, setSheet] = useState(1)
  const [dragH, setDragH] = useState(null)
  const [nav, setNav] = useState(null) // {from,to,mode}
  const [toast, setToast] = useState('')

  const box = useRef(null)
  const vref = useRef(view)
  const anim = useRef(0)
  const ptrs = useRef(new Map())
  const gest = useRef(null)
  const toastT = useRef(0)
  const input = useRef(null)
  const moved = useRef(false)
  const [ready, setReady] = useState(false)

  const favs = useMemo(() => fav.filter((id) => placeById(id)), [fav])
  const { w, h } = size
  const S0 = 128, S1 = Math.round(h * 0.44), S2 = Math.max(S1 + 60, h - 112)
  const snaps = [S0, S1, S2]
  const sheetH = dragH ?? snaps[sheet]

  /* 크기 측정 */
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth || 390, h: el.offsetHeight || 800 }))
    ro.observe(el)
    setSize({ w: el.offsetWidth || 390, h: el.offsetHeight || 800 })
    setReady(true)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (ready) setV(centerFor(ME, HOME_VIEW.k))
  }, [ready])
  useEffect(() => {
    if (pickFor) setTimeout(() => input.current?.focus(), 60)
  }, [pickFor])

  const showToast = (t) => {
    setToast(t)
    clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(''), 1900)
  }
  useEffect(() => () => { clearTimeout(toastT.current); cancelAnimationFrame(anim.current) }, [])

  /* ----- 뷰 제어 ----- */
  const setV = (v) => {
    const c = { x: clamp(v.x, 0, W), y: clamp(v.y, 0, H), k: clamp(v.k, KMIN, KMAX) }
    vref.current = c
    setView(c)
  }
  const stopAnim = () => cancelAnimationFrame(anim.current)
  const flyTo = (t, dur = 480) => {
    stopAnim()
    const a = { ...vref.current }
    const b = { x: clamp(t.x, 0, W), y: clamp(t.y, 0, H), k: clamp(t.k, KMIN, KMAX) }
    const t0 = performance.now()
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setV({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, k: a.k * Math.pow(b.k / a.k, e) })
      if (p < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }
  // 시트에 가려지지 않는 영역의 중앙에 지점을 배치
  const centerFor = (pt, k, sh = S1, top = 120) => {
    const sy = (top + (h - sh)) / 2
    return { x: pt.x, y: pt.y - (sy - h / 2) / k, k }
  }
  const fitPts = (pts, sh = S1, maxK = 2.2) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    pts.forEach((p) => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y) })
    const top = nav ? 70 : 130
    const visH = h - sh - top - 24
    const k = clamp(Math.min((w - 110) / Math.max(40, x1 - x0), visH / Math.max(40, y1 - y0)), 0.7, maxK)
    flyTo(centerFor({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, k, sh, top))
  }

  /* ----- 지도 제스처 ----- */
  const rel = (e) => {
    const r = box.current.getBoundingClientRect()
    const sc = r.width / box.current.offsetWidth || 1
    return { x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc, sc }
  }
  const onDown = (e) => {
    stopAnim()
    const p = rel(e)
    ptrs.current.set(e.pointerId, p)
    const v = vref.current
    if (ptrs.current.size === 1) gest.current = { type: 'pan', sx: p.x, sy: p.y, v0: v, moved: false, id: e.pointerId }
    else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()]
      gest.current = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, v0: v, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, moved: true }
    }
  }
  const onMove = (e) => {
    if (!ptrs.current.has(e.pointerId) || !gest.current) return
    const p = rel(e)
    ptrs.current.set(e.pointerId, p)
    const g = gest.current
    if (g.type === 'pinch' && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const k = clamp(g.v0.k * (d / g.d0), KMIN, KMAX)
      const wx = g.v0.x + (g.m0.x - w / 2) / g.v0.k, wy = g.v0.y + (g.m0.y - h / 2) / g.v0.k
      setV({ x: wx - (m.x - w / 2) / k, y: wy - (m.y - h / 2) / k, k })
    } else if (g.type === 'pan') {
      const dx = p.x - g.sx, dy = p.y - g.sy
      if (!g.moved && Math.hypot(dx, dy) > 5) {
        g.moved = true
        try { box.current.setPointerCapture(e.pointerId) } catch {}
      }
      if (g.moved) setV({ x: g.v0.x - dx / g.v0.k, y: g.v0.y - dy / g.v0.k, k: g.v0.k })
    }
  }
  const onMapClick = () => {
    if (moved.current) { moved.current = false; return }
    if (sel && !nav) { setSel(null); if (sheet === 2) setSheet(1) }
  }
  const onUp = (e) => {
    const g = gest.current
    const had = ptrs.current.has(e.pointerId)
    ptrs.current.delete(e.pointerId)
    if (!had) return
    if (ptrs.current.size === 0) {
      gest.current = null
      moved.current = !!(g && g.moved)
    } else if (ptrs.current.size === 1) {
      const [only] = [...ptrs.current.entries()]
      gest.current = { type: 'pan', sx: only[1].x, sy: only[1].y, v0: vref.current, moved: true, id: only[0] }
    }
  }
  useEffect(() => {
    const el = box.current
    const wheel = (e) => {
      e.preventDefault()
      stopAnim()
      const p = rel(e)
      const v = vref.current
      const k = clamp(v.k * Math.exp(-e.deltaY * 0.0016), KMIN, KMAX)
      const wx = v.x + (p.x - w / 2) / v.k, wy = v.y + (p.y - h / 2) / v.k
      setV({ x: wx - (p.x - w / 2) / k, y: wy - (p.y - h / 2) / k, k })
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [w, h])

  const zoom = (f) => { const v = vref.current; flyTo({ x: v.x, y: v.y, k: v.k * f }, 260) }
  const locate = () => flyTo(centerFor(ME, HOME_VIEW.k, snaps[sheet]), 520)

  /* ----- 동작 ----- */
  const remember = (item) => setRecent((r) => [item, ...r.filter((x) => !(x.t === item.t && x.v === item.v))].slice(0, 8))
  const closeSearch = () => { setFocus(false); setQ(''); setPickFor(null); input.current?.blur?.() }

  const pickPlace = (p, rem = true) => {
    if (rem) remember({ t: 'place', v: p.id })
    closeSearch()
    setSel(p.id)
    setNav(null)
    setSheet((s) => (s === 0 ? 1 : s))
    flyTo(centerFor(p, Math.max(vref.current.k, 1.6)))
  }
  const pickRoad = (r) => {
    remember({ t: 'road', v: r.name })
    closeSearch()
    setSel(null)
    setSheet(1)
    flyTo(centerFor({ x: r.at[0], y: r.at[1] }, 1.5))
    showToast(r.name + ' (가상 도로)')
  }
  const chooseCat = (k) => {
    closeSearch()
    setSel(null)
    setNav(null)
    setCat(k)
    if (k) {
      remember({ t: 'cat', v: k })
      setSheet(1)
      fitPts(PLACES.filter((p) => p.cat === k), S1, 1.7)
    }
  }
  const onPinPick = (p) => pickPlace(p, false)

  const toggleFav = (id) => setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f]))
  const share = async (p) => {
    const text = `${p.name} · ${p.addr}\n(지도 앱의 창작된 가상 장소입니다)`
    try {
      if (navigator.share) await navigator.share({ title: p.name, text })
      else { await navigator.clipboard.writeText(text); showToast('가상 장소 정보를 복사했어요') }
    } catch { /* 사용자가 취소 */ }
  }

  const startNav = (toId, fromId = 'me') => {
    closeSearch()
    setNav({ from: fromId, to: toId, mode: 'walking' })
    setSheet(1)
  }
  const route = useMemo(() => {
    if (!nav || !nav.to) return null
    const a = endpoint(nav.from), b = endpoint(nav.to)
    if (!a || !b || a.id === b.id) return null
    return findRoute(a, b, nav.mode)
  }, [nav && nav.from, nav && nav.to, nav && nav.mode])
  const routeKey = nav ? nav.from + '>' + nav.to : ''
  useEffect(() => {
    if (!nav || !route) return
    fitPts(route.pts.map(([x, y]) => ({ x, y })), S1, 2)
  }, [routeKey, nav && nav.mode, route ? 1 : 0])

  const pickEndpoint = (id) => {
    if (pickFor === 'from') setNav((n) => ({ ...n, from: id }))
    else if (pickFor === 'to') setNav((n) => ({ ...n, to: id }))
    closeSearch()
  }

  /* ----- 시트 드래그 ----- */
  const sd = useRef(null)
  const sdDown = (e) => {
    sd.current = { y: e.clientY, h: snaps[sheet], t: performance.now(), moved: false, sc: (box.current.getBoundingClientRect().width / box.current.offsetWidth) || 1 }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }
  const sdMove = (e) => {
    const d = sd.current
    if (!d) return
    const dy = (d.y - e.clientY) / d.sc
    if (Math.abs(dy) > 4) d.moved = true
    if (d.moved) setDragH(clamp(d.h + dy, S0, S2))
  }
  const sdUp = (e) => {
    const d = sd.current
    sd.current = null
    if (!d) return
    if (!d.moved) { setSheet((s) => (s + 1) % 3); setDragH(null); return }
    const dy = (d.y - e.clientY) / d.sc
    const v = dy / Math.max(1, performance.now() - d.t) // px/ms
    const cur = clamp(d.h + dy, S0, S2)
    let target = snaps.reduce((best, s, i) => (Math.abs(s - cur) < Math.abs(snaps[best] - cur) ? i : best), 0)
    if (Math.abs(v) > 0.45) target = clamp(sheet + (v > 0 ? 1 : -1), 0, 2)
    setSheet(target)
    setDragH(null)
  }

  /* ----- 표시용 파생값 ----- */
  const searching = focus || !!pickFor
  const result = useMemo(() => searchAll(q), [q])
  const nearby = useMemo(() => PLACES.filter((p) => !cat || p.cat === cat).sort((a, b) => distMe(a) - distMe(b)), [cat])
  const place = sel ? placeById(sel) : null
  const { x: vx, y: vy, k } = view
  const hideChips = nav || sheet === 2 || searching
  const mode = nav ? MODES.find((m) => m.k === nav.mode) : null

  const recentRows = recent.map((r) => {
    if (r.t === 'place') { const p = placeById(r.v); return p && { item: r, key: 'p' + r.v, icon: catMeta(p.cat).i, label: p.name, sub: catMeta(p.cat).l, on: () => pickPlace(p) } }
    if (r.t === 'road') return { item: r, key: 'r' + r.v, icon: 'road', label: r.v, sub: '도로', on: () => { const ro = ROADS.find((x) => x.name === r.v); if (ro) pickRoad(ro) } }
    if (r.t === 'cat') { const c = catMeta(r.v); return { item: r, key: 'c' + r.v, icon: c.i, label: c.l, sub: '카테고리', on: () => chooseCat(r.v) } }
    return null
  }).filter(Boolean)

  const PlaceRow = ({ p, onClick, sub }) => {
    const m = catMeta(p.cat)
    return (
      <button className="mp-row" onClick={onClick}>
        <i style={{ background: m.c }}><Ic n={m.i} s={18} sw={2} /></i>
        <div><b>{p.name}</b><span>{sub || `${m.l} · ${p.addr}`}</span></div>
        <em>{km(distMe(p))}</em>
      </button>
    )
  }
  const MiniCard = ({ p }) => (
    <button className="mp-card" onClick={() => pickPlace(p)}>
      <Thumb p={p} />
      <b>{p.name}</b>
      <span>{catMeta(p.cat).l}</span>
    </button>
  )

  return (
    <div className={'mp' + (nav ? ' is-nav' : '') + (hideChips ? ' no-chips' : '') + (sheet === 2 ? ' s2' : '')} ref={box}>
      {/* 지도 */}
      <div className="mp-map" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={onMapClick}>
        <svg width={w} height={h} role="img" aria-label="신림동을 배경으로 한 가상 벡터 지도">
          <g transform={`translate(${w / 2 - vx * k} ${h / 2 - vy * k}) scale(${k})`}>
            <MapLayer />
            <Labels k={k} />
            {route && nav && (
              <g style={{ pointerEvents: 'none' }}>
                <polyline points={route.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <polyline points={route.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2f7cf6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={nav.mode === 'walking' ? '0.1 11' : undefined} />
              </g>
            )}
            <g>
              <Markers k={k} cat={cat} sel={sel} onPick={onPinPick} />
            </g>
            {route && nav && (() => {
              const a = endpoint(nav.from), b = endpoint(nav.to)
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <g transform={`translate(${a.x} ${a.y}) scale(${1 / k})`}>
                    <circle r="10" fill="#fff" /><circle r="6" fill="#2f7cf6" />
                  </g>
                  <g transform={`translate(${b.x} ${b.y}) scale(${1 / k})`}>
                    <Pin m={{ c: '#ff3b30', i: 'pin' }} big />
                  </g>
                </g>
              )
            })()}
            <g transform={`translate(${ME.x} ${ME.y}) scale(${1 / k})`} style={{ pointerEvents: 'none' }}>
              <circle r="22" fill="#2f7cf6" opacity=".18"><animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite" /></circle>
              <circle r="8" fill="#2f7cf6" stroke="#fff" strokeWidth="3" />
            </g>
          </g>
        </svg>
      </div>

      {/* 상단 검색창 + 카테고리 */}
      {(!nav || pickFor) && (
        <div className="mp-top">
          <div className="mp-search">
            <Ic n="search" s={18} sw={2.2} />
            <input
              ref={input}
              value={q}
              placeholder={pickFor === 'from' ? '출발지 검색' : pickFor === 'to' ? '도착지 검색' : '장소, 도로 검색 (가상)'}
              onFocus={() => setFocus(true)}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const r = searchAll(q)
                if (pickFor) { if (r.places[0]) pickEndpoint(r.places[0].id) }
                else if (r.cats[0]) chooseCat(r.cats[0].k)
                else if (r.places[0]) pickPlace(r.places[0])
                else if (r.roads[0]) pickRoad(r.roads[0])
              }}
            />
            {q && <button className="mp-clear" aria-label="입력 지우기" onClick={() => { setQ(''); input.current?.focus() }}><ClearIc /></button>}
            {searching ? <button className="mp-txt" onClick={closeSearch}>취소</button> : <button className="mp-txt" onClick={close}>닫기</button>}
          </div>
          <div className="mp-chips">
            {CATS.map((c) => (
              <button key={c.k} className={cat === c.k ? 'on' : ''} onClick={() => chooseCat(cat === c.k ? null : c.k)}>
                <span style={{ color: cat === c.k ? '#fff' : c.c }}><Ic n={c.i} s={16} sw={2} /></span>{c.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 플로팅 컨트롤 */}
      <div className="mp-fab">
        <button onClick={() => showToast('지도는 항상 북쪽이 위쪽이에요')} aria-label="나침반" className="mp-compass"><CompassIc /></button>
        <div className="mp-fab-g">
          <button onClick={() => zoom(1.45)} aria-label="확대"><Ic n="plus" s={22} /></button>
          <button onClick={() => zoom(1 / 1.45)} aria-label="축소"><Ic n="minus" s={22} /></button>
        </div>
        <button onClick={locate} aria-label="현재 위치" className="mp-loc"><Ic n="locate" s={20} fill="currentColor" sw={1.4} /></button>
      </div>

      {toast && <div className="mp-toast" role="status">{toast}</div>}

      {/* 하단 시트 */}
      <div className={'mp-sheet' + (dragH != null ? ' drag' : '')} style={{ height: sheetH }}>
        <div className="mp-dz" onPointerDown={sdDown} onPointerMove={sdMove} onPointerUp={sdUp} onPointerCancel={sdUp}>
          <div className="mp-grab"><i /></div>
          {!nav && !place && (
            <div className="mp-sh-title">
              <h3>{cat ? catMeta(cat).l : '신림동 주변'}</h3>
              <span>가상 지도 · 창작 데이터</span>
            </div>
          )}
          {!nav && place && (
            <div className="mp-sh-title">
              <h3>{place.name}</h3>
              <button className="mp-x" aria-label="닫기" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setSel(null) }}><Ic n="x" s={16} sw={2.4} /></button>
            </div>
          )}
          {nav && (
            <div className="mp-sh-title">
              <h3>가상 길찾기</h3>
              <button className="mp-x" aria-label="길찾기 닫기" onPointerDown={(e) => e.stopPropagation()} onClick={() => setNav(null)}><Ic n="x" s={16} sw={2.4} /></button>
            </div>
          )}
        </div>

        <div className={'mp-body' + (sheet === 0 && dragH == null ? ' lock' : '')}>
          {nav ? (
            <div className="mp-nav">
              <div className="mp-od">
                <div className="mp-od-rows">
                  <button onClick={() => { setPickFor('from'); setFocus(true) }}><i className="a" /><b>출발</b><span>{endpoint(nav.from)?.name || '선택'}</span></button>
                  <button onClick={() => { setPickFor('to'); setFocus(true) }}><i className="b"><Ic n="pin" s={14} sw={2.4} /></i><b>도착</b><span>{endpoint(nav.to)?.name || '선택'}</span></button>
                </div>
                <button className="mp-swap" aria-label="출발지와 도착지 바꾸기" onClick={() => setNav((n) => ({ ...n, from: n.to || 'me', to: n.from }))}><Ic n="swap" s={20} /></button>
              </div>
              <div className="mp-modes">
                {MODES.map((m) => (
                  <button key={m.k} className={nav.mode === m.k ? 'on' : ''} onClick={() => setNav((n) => ({ ...n, mode: m.k }))}><Ic n={m.i} s={20} /><span>{m.l}</span></button>
                ))}
              </div>
              {route ? (
                <div className="mp-sum">
                  <div className="mp-sum-main"><b>{mins(route.sec)}</b><span>{km(route.meters)}</span></div>
                  <p>{mode.l} · 신림동 가상 도로망 기준 추정치</p>
                  <p className="note">실제 길 안내나 교통정보가 아닌, 창작된 가상 데이터로 계산한 값입니다.</p>
                </div>
              ) : (
                <p className="mp-empty">{nav.from === nav.to ? '출발지와 도착지가 같아요' : '도착지를 선택해 주세요'}</p>
              )}
            </div>
          ) : place ? (
            <div className="mp-detail">
              <div className="mp-hero"><Thumb p={place} /></div>
              <div className="mp-meta">
                <span className="mp-tag" style={{ background: catMeta(place.cat).c }}><Ic n={catMeta(place.cat).i} s={13} sw={2.2} />{catMeta(place.cat).l}</span>
                <span className="mp-dist">{km(distMe(place))} · 도보 {mins(distMe(place) / 1.25)}</span>
              </div>
              <div className="mp-actions">
                <button className="pri" onClick={() => startNav(place.id)}><Ic n="route" s={18} /><span>길찾기</span></button>
                <button className={fav.includes(place.id) ? 'on' : ''} onClick={() => { toggleFav(place.id); showToast(fav.includes(place.id) ? '즐겨찾기에서 해제했어요' : '즐겨찾기에 추가했어요') }}>
                  <Ic n="star" s={18} fill={fav.includes(place.id) ? 'currentColor' : 'none'} /><span>{fav.includes(place.id) ? '저장됨' : '즐겨찾기'}</span>
                </button>
                <button onClick={() => share(place)}><Ic n="share" s={18} /><span>공유</span></button>
              </div>
              <p className="mp-desc">{place.desc}</p>
              <div className="mp-kvs">
                <div className="mp-kv"><Ic n="pin" s={18} /><div><small>가상 주소</small>{place.addr}</div></div>
                <div className="mp-kv"><Ic n="clock" s={18} /><div><small>이용 시간</small>{place.hours}</div></div>
                <div className="mp-kv"><Ic n={catMeta(place.cat).i} s={18} /><div><small>카테고리</small>{catMeta(place.cat).l}</div></div>
              </div>
              <button className="mp-from" onClick={() => startNav(null, place.id)}><Ic n="route" s={16} /><span>여기를 출발지로 길찾기</span></button>
              <div className="mp-notice"><Ic n="info" s={16} /><span>이 장소는 앱을 위해 창작된 가상 데이터이며, 실제 신림동의 장소나 상점과 관련이 없습니다.</span></div>
            </div>
          ) : (
            <div className="mp-home">
              {!cat && (
                <>
                  <div className="mp-sec"><span>즐겨찾기</span></div>
                  {favs.length === 0 ? <p className="mp-hint">장소 상세에서 별 버튼을 눌러 저장해 보세요.</p> : (
                    <div className="mp-hs">{favs.map((id) => <MiniCard key={id} p={placeById(id)} />)}</div>
                  )}
                  <div className="mp-sec">
                    <span>최근 검색</span>
                    {recentRows.length > 0 && <button onClick={() => setRecent([])}>기록 삭제</button>}
                  </div>
                  {recentRows.length === 0 ? <p className="mp-hint">최근 검색 기록이 없어요.</p> : recentRows.slice(0, 4).map((r) => (
                    <button className="mp-row sm" key={r.key} onClick={r.on}>
                      <i className="g"><Ic n="history" s={16} sw={2} /></i>
                      <div><b>{r.label}</b><span>{r.sub}</span></div>
                    </button>
                  ))}
                  <div className="mp-sec"><span>추천 장소</span></div>
                  <div className="mp-hs">{RECOMMEND.map((id) => <MiniCard key={id} p={placeById(id)} />)}</div>
                </>
              )}
              <div className="mp-sec"><span>{cat ? `${catMeta(cat).l} · ${nearby.length}곳` : '주변 장소'}</span>{cat && <button onClick={() => chooseCat(null)}>전체 보기</button>}</div>
              {nearby.map((p) => <PlaceRow key={p.id} p={p} onClick={() => pickPlace(p)} />)}
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 오버레이 */}
      {searching && (
        <div className="mp-results">
          {!q ? (
            <>
              {pickFor && (
                <button className="mp-row" onClick={() => pickEndpoint('me')}>
                  <i style={{ background: '#2f7cf6' }}><Ic n="locate" s={18} fill="currentColor" sw={1.2} /></i>
                  <div><b>현재 위치 (가상)</b><span>지도에 표시된 파란 점</span></div>
                </button>
              )}
              {!pickFor && recentRows.length > 0 && (
                <>
                  <div className="mp-sec"><span>최근 검색</span><button onClick={() => setRecent([])}>기록 삭제</button></div>
                  {recentRows.map((r) => (
                    <div className="mp-rec" key={r.key}>
                      <button className="mp-row" onClick={r.on}>
                        <i className="g"><Ic n="history" s={16} sw={2} /></i>
                        <div><b>{r.label}</b><span>{r.sub}</span></div>
                      </button>
                      <button className="mp-rm" aria-label="삭제" onClick={() => setRecent((l) => l.filter((x) => x !== r.item && !(x.t === r.item.t && x.v === r.item.v)))}><Ic n="x" s={16} sw={2.2} /></button>
                    </div>
                  ))}
                </>
              )}
              {!pickFor && (
                <>
                  <div className="mp-sec"><span>카테고리</span></div>
                  <div className="mp-cats">
                    {CATS.map((c) => (
                      <button key={c.k} onClick={() => chooseCat(c.k)}>
                        <i style={{ background: c.c }}><Ic n={c.i} s={20} sw={2} /></i><span>{c.l}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mp-sec"><span>추천 장소</span></div>
              {RECOMMEND.map((id) => { const p = placeById(id); return <PlaceRow key={id} p={p} onClick={() => (pickFor ? pickEndpoint(p.id) : pickPlace(p))} /> })}
            </>
          ) : (
            <>
              {!pickFor && result.cats.map((c) => (
                <button className="mp-row" key={c.k} onClick={() => { remember({ t: 'q', v: q }); chooseCat(c.k) }}>
                  <i style={{ background: c.c }}><Ic n={c.i} s={18} sw={2} /></i>
                  <div><b>{c.l}</b><span>카테고리 · 지도에서 모두 보기</span></div>
                  <span className="mp-go"><Ic n="chev" s={16} /></span>
                </button>
              ))}
              {result.places.length > 0 && <div className="mp-sec"><span>장소</span></div>}
              {result.places.map((p) => <PlaceRow key={p.id} p={p} onClick={() => (pickFor ? pickEndpoint(p.id) : pickPlace(p))} />)}
              {!pickFor && result.roads.length > 0 && <div className="mp-sec"><span>도로</span></div>}
              {!pickFor && result.roads.map((r) => (
                <button className="mp-row" key={r.name} onClick={() => pickRoad(r)}>
                  <i className="g"><Ic n="road" s={18} sw={2} /></i>
                  <div><b>{r.name}</b><span>가상 도로 · 신림동</span></div>
                </button>
              ))}
              {!result.cats.length && !result.places.length && !result.roads.length && <p className="mp-empty">일치하는 가상 장소가 없어요</p>}
            </>
          )}
          <p className="mp-foot">모든 장소와 도로는 창작된 가상 데이터입니다.</p>
        </div>
      )}
    </div>
  )
}
