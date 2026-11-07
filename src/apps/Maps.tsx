// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Maps.css'
import { usePersist } from '../engine/persist'

/* ---------- 상수 ---------- */
const INIT = { lat: 37.4842, lon: 126.9294, z: 17 } // 서울 관악구 신림동 (고정)

// 24x24 Lucide 스타일 선 아이콘 (stroke 1.8 통일)
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  locate: '<path d="M2 12h3M19 12h3M12 2v3M12 19v3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
  star: '<path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  nav: '<path d="m3 11 19-9-9 19-2-8z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  utensils: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"/>',
  store: '<path d="m3 9 1-5h16l1 5M4 9v11h16V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5.1"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  cross: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.8a2 2 0 0 0-.6-1.4L18 5"/>',
  tree: '<path d="M12 22v-5M12 17c-4 0-7-3-7-6.5C5 6 8.5 2 12 2s7 4 7 8.5c0 3.5-3 6.5-7 6.5z"/>',
  landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  bus: '<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3M9 18h5"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  walk: '<circle cx="12" cy="5" r="1.5"/><path d="m9 21 3-7 3 7M6 8l6 2 6-2M12 10v4"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
}

const CATS = [
  { k: 'food', l: '음식점', i: 'utensils', c: '#e8523f', f: [['amenity', 'restaurant|fast_food|food_court']] },
  { k: 'cafe', l: '카페', i: 'coffee', c: '#b8742f', f: [['amenity', 'cafe']] },
  { k: 'conv', l: '편의점', i: 'store', c: '#2f9e6b', f: [['shop', 'convenience']] },
  { k: 'mart', l: '마트', i: 'cart', c: '#168a99', f: [['shop', 'supermarket|greengrocer']] },
  { k: 'shop', l: '쇼핑', i: 'bag', c: '#7048e8', f: [['shop', 'mall|department_store|clothes|shoes|electronics|variety_store|cosmetics']] },
  { k: 'hospital', l: '병원', i: 'cross', c: '#d6336c', f: [['amenity', 'hospital|clinic|doctors|dentist']] },
  { k: 'pharmacy', l: '약국', i: 'pill', c: '#e64980', f: [['amenity', 'pharmacy']] },
  { k: 'fuel', l: '주유소', i: 'fuel', c: '#f08c00', f: [['amenity', 'fuel']] },
  { k: 'park', l: '공원', i: 'tree', c: '#3a9d4a', f: [['leisure', 'park|garden']] },
  { k: 'sight', l: '관광명소', i: 'landmark', c: '#9c36b5', f: [['tourism', 'attraction|museum|gallery|viewpoint']] },
  { k: 'lodging', l: '숙소', i: 'bed', c: '#4263eb', f: [['tourism', 'hotel|hostel|guest_house|motel']] },
  { k: 'transit', l: '대중교통', i: 'bus', c: '#1c7ed6', f: [['railway', 'station'], ['amenity', 'bus_station'], ['highway', 'bus_stop']] },
]
const MODES = [
  { k: 'driving', l: '자동차', i: 'car' },
  { k: 'walking', l: '도보', i: 'walk' },
  { k: 'transit', l: '대중교통', i: 'bus' },
  { k: 'cycling', l: '자전거', i: 'bike' },
]

const meta = (k) => (k === 'pin' ? { l: '지정한 위치', i: 'pin', c: '#ff3b30' } : CATS.find((c) => c.k === k) || { l: '장소', i: 'pin', c: '#6e6e73' })
const catOf = (t) => CATS.find((c) => c.f.some(([k, v]) => t[k] && new RegExp(`^(${v})$`).test(t[k])))?.k || 'etc'

/* ---------- 유틸 ---------- */
const hav = (a, b, c, d) => {
  const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2
  return 12742000 * Math.asin(Math.sqrt(h))
}
const km = (m) => (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`)
const mins = (s) => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분` }
const href = (w) => (/^https?:\/\//.test(w) ? w : 'https://' + w)
const pinSvg = (m) => `<svg viewBox="0 0 34 42" width="34" height="42"><path d="M17 41S3 27 3 16a14 14 0 0 1 28 0c0 11-14 25-14 25z" fill="${m.c}" stroke="#fff" stroke-width="2"/><g transform="translate(9 8) scale(.667)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${I[m.i]}</g></svg>`

const Ic = ({ n, s = 20, fill = 'none' }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: I[n] }} />
)

/* ---------- 데이터 (Overpass / Nominatim / OSRM) ---------- */
const addrOf = (t) => t['addr:full'] || [t['addr:province'], t['addr:city'], t['addr:district'], t['addr:suburb'], t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ')
const addrNom = (d, name) => {
  const p = (d || '').split(', ').filter((x) => x !== '대한민국' && !/^\d{4,6}$/.test(x))
  if (p[0] === name) p.shift()
  return p.reverse().join(' ')
}
const fromEl = (e) => {
  const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon
  if (lat == null || !t.name) return null
  return { id: `osm:${e.type}/${e.id}`, name: t['name:ko'] || t.name, cat: catOf(t), lat, lon, addr: addrOf(t), tel: t.phone || t['contact:phone'], hours: t.opening_hours, web: t.website || t['contact:website'], desc: t.description }
}
const fromNom = (r) => {
  const x = r.extratags || {}, nm = r.namedetails?.['name:ko'] || r.namedetails?.name || r.name || r.display_name.split(', ')[0]
  return { id: `osm:${r.osm_type}/${r.osm_id}`, name: nm, cat: catOf({ [r.category]: r.type, ...x }), lat: +r.lat, lon: +r.lon, addr: addrNom(r.display_name, nm), tel: x.phone || x['contact:phone'], hours: x.opening_hours, web: x.website || x['contact:website'], desc: x.description }
}

let gate = Promise.resolve() // Nominatim 요청 제한(초당 1회) 준수
const nom = (path, signal) => {
  const run = gate.then(() => fetch('https://nominatim.openstreetmap.org/' + path, { signal }).then((r) => { if (!r.ok) throw new Error('nom'); return r.json() }))
  gate = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)))
  return run
}
const geocode = async (q, signal, b) => {
  const vb = b ? `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}` : ''
  const r = await nom(`search?format=jsonv2&extratags=1&namedetails=1&accept-language=ko&countrycodes=kr&limit=8&q=${encodeURIComponent(q)}${vb}`, signal)
  return r.map(fromNom)
}
const fetchNearby = async (k, b, signal) => {
  const bb = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`
  const cs = k ? CATS.filter((c) => c.k === k) : CATS.filter((c) => c.k !== 'transit')
  const body = `[out:json][timeout:20];(${cs.flatMap((c) => c.f.map(([a, v]) => `nwr["${a}"~"^(${v})$"]["name"](${bb});`)).join('')});out center tags 150;`
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(body), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal })
  if (!r.ok) throw new Error('overpass')
  const j = await r.json(), seen = new Set()
  return j.elements.map(fromEl).filter((p) => p && !seen.has(p.id) && seen.add(p.id))
}

function useGeo(q, getBounds) {
  const [s, set] = useState({ res: [], loading: false, err: false })
  useEffect(() => {
    const t = q.trim()
    if (t.length < 2) { set({ res: [], loading: false, err: false }); return }
    set((v) => ({ ...v, loading: true, err: false }))
    const ac = new AbortController()
    const id = setTimeout(async () => {
      try { set({ res: await geocode(t, ac.signal, getBounds()), loading: false, err: false }) }
      catch (e) { if (e.name !== 'AbortError') set({ res: [], loading: false, err: true }) }
    }, 700) // 디바운스
    return () => { clearTimeout(id); ac.abort() }
  }, [q])
  return s
}

/* ---------- 컴포넌트 ---------- */
export default function Maps({ close }) {
  const [fav, setFav] = usePersist('maps.favs', []) // 기존 'maps.fav'(숫자 id)와 분리해 충돌 방지
  const [recent, setRecent] = usePersist('maps.recent', [])
  const favs = useMemo(() => (Array.isArray(fav) ? fav : []).filter((x) => x && typeof x === 'object' && x.id), [fav])
  const recents = Array.isArray(recent) ? recent.filter((x) => typeof x === 'string') : []

  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [cat, setCat] = useState(null)
  const [tab, setTab] = useState('near')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)
  const [anchor, setAnchor] = useState({ lat: INIT.lat, lon: INIT.lon })
  const [userPos, setUserPos] = useState(null)
  const [sel, setSel] = useState(null)
  const [snap, setSnap] = useState(0)
  const [sat, setSat] = useState(false)
  const [moved, setMoved] = useState(false)
  const [toast, setToast] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [mode, setMode] = useState('driving')
  const [origin, setOrigin] = useState(null)
  const [oq, setOq] = useState('')
  const [rt, setRt] = useState(null)
  const [rs, setRs] = useState('idle')

  const elRef = useRef(null), mapRef = useRef(null), oL = useRef(null), sL = useRef(null)
  const mk = useRef(null), rl = useRef(null), meMk = useRef(null)
  const lastS = useRef(null), ac = useRef(null), tt = useRef(null), gd = useRef(null)
  const H = useRef({})

  const getB = () => mapRef.current?.getBounds()
  const geo = useGeo(focus ? q : '', getB)
  const ogeo = useGeo(navOpen ? oq : '', getB)

  const say = (m) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 2800) }

  /* 지도 초기화 */
  useEffect(() => {
    const el = elRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, { center: [INIT.lat, INIT.lon], zoom: INIT.z, zoomControl: false, attributionControl: false, maxZoom: 19 })
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
    let last = 0
    const tl = (url, o) => {
      const t = L.tileLayer(url, o)
      t.on('tileerror', () => { if (Date.now() - last > 6000) { last = Date.now(); H.current.say('지도 타일을 불러오지 못했어요. 네트워크를 확인해주세요.') } })
      return t
    }
    oL.current = tl('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    sL.current = tl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 18, attribution: 'Tiles &copy; Esri' })
    mk.current = L.layerGroup().addTo(map)
    rl.current = L.layerGroup().addTo(map)
    map.on('moveend', () => {
      const s = lastS.current
      if (!s) return
      if (map.distance(map.getCenter(), s.c) > 300 || Math.abs(map.getZoom() - s.z) >= 1) setMoved(true)
    })
    // 길게 누르기 -> 임시 핀
    let t = null, sp = null
    const clr = () => { clearTimeout(t); t = null }
    const dn = (e) => {
      if (!e.isPrimary) { clr(); return }
      if (e.target.closest('.leaflet-marker-icon,.leaflet-control')) return
      sp = { x: e.clientX, y: e.clientY }
      clr()
      t = setTimeout(() => { navigator.vibrate?.(12); H.current.pin(map.mouseEventToLatLng(e)) }, 550)
    }
    const mv = (e) => { if (sp && Math.hypot(e.clientX - sp.x, e.clientY - sp.y) > 8) clr() }
    el.addEventListener('pointerdown', dn); el.addEventListener('pointermove', mv)
    el.addEventListener('pointerup', clr); el.addEventListener('pointercancel', clr)
    const ro = new ResizeObserver(() => map.invalidateSize()); ro.observe(el)
    mapRef.current = map
    return () => {
      clr(); ro.disconnect()
      el.removeEventListener('pointerdown', dn); el.removeEventListener('pointermove', mv)
      el.removeEventListener('pointerup', clr); el.removeEventListener('pointercancel', clr)
      map.remove(); mapRef.current = null
    }
  }, [])

  /* 일반/위성 */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.removeLayer(sat ? oL.current : sL.current)
    ;(sat ? sL.current : oL.current).addTo(map)
  }, [sat])

  /* 내 위치 점 */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userPos) return
    meMk.current?.remove()
    meMk.current = L.marker([userPos.lat, userPos.lon], { interactive: false, icon: L.divIcon({ className: 'mp-me-w', html: '<div class="mp-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map)
  }, [userPos])

  /* 주변 장소 검색 */
  const loadNearby = async (k) => {
    const map = mapRef.current
    if (!map) return
    ac.current?.abort()
    const a = new AbortController(); ac.current = a
    setLoading(true); setErr(false)
    try {
      const c = map.getCenter()
      const b = map.getZoom() >= 15 ? map.getBounds() : c.toBounds(2500)
      const r = await fetchNearby(k, b, a.signal)
      r.sort((x, y) => hav(c.lat, c.lng, x.lat, x.lon) - hav(c.lat, c.lng, y.lat, y.lon))
      setResults(r); setAnchor({ lat: c.lat, lon: c.lng })
      lastS.current = { c, z: map.getZoom() }; setMoved(false)
    } catch (e) {
      if (e.name !== 'AbortError') { setErr(true); setResults([]) }
    } finally { if (ac.current === a) setLoading(false) }
  }
  useEffect(() => { loadNearby(cat) }, [cat])

  /* 마커 */
  const shown = tab === 'fav' ? favs : results
  useEffect(() => {
    const lay = mk.current
    if (!lay) return
    lay.clearLayers()
    const list = [...shown]
    if (sel && !list.some((p) => p.id === sel.id)) list.push(sel)
    list.forEach((p) => {
      const on = sel?.id === p.id
      L.marker([p.lat, p.lon], {
        title: p.name, zIndexOffset: on ? 1000 : 0,
        icon: L.divIcon({ className: 'mp-pin' + (on ? ' on' : ''), html: `<div class="mp-pin-in">${pinSvg(meta(p.cat))}</div>`, iconSize: [34, 42], iconAnchor: [17, 42] }),
      }).on('click', () => H.current.pick(p)).addTo(lay)
    })
  }, [shown, sel?.id])

  /* 주소 보충 (역지오코딩) */
  useEffect(() => {
    if (!sel || sel.addr) return
    const a = new AbortController()
    nom(`reverse?format=jsonv2&accept-language=ko&zoom=18&lat=${sel.lat}&lon=${sel.lon}`, a.signal)
      .then((r) => { const ad = addrNom(r.display_name, sel.name); if (ad) setSel((s) => (s && s.id === sel.id ? { ...s, addr: ad } : s)) })
      .catch(() => {})
    return () => a.abort()
  }, [sel?.id])

  /* 경로 */
  useEffect(() => {
    const lay = rl.current
    if (!lay) return
    lay.clearLayers(); setRt(null)
    if (!navOpen || !origin || !sel) { setRs('idle'); return }
    if (mode === 'transit') { setRs('na'); return }
    setRs('loading')
    const a = new AbortController()
    const prof = { driving: 'car', walking: 'foot', cycling: 'bike' }[mode]
    fetch(`https://routing.openstreetmap.de/routed-${prof}/route/v1/driving/${origin.lon},${origin.lat};${sel.lon},${sel.lat}?overview=full&geometries=geojson`, { signal: a.signal })
      .then((r) => { if (!r.ok) throw 0; return r.json() })
      .then((j) => {
        const r = j.routes?.[0]
        if (!r) throw 0
        const pl = L.polyline(r.geometry.coordinates.map(([x, y]) => [y, x]), { color: '#2f7cf6', weight: 6, opacity: 0.9 }).addTo(lay)
        L.circleMarker([origin.lat, origin.lon], { radius: 6, color: '#fff', weight: 3, fillColor: '#2f7cf6', fillOpacity: 1 }).addTo(lay)
        setRt({ dur: r.duration, dist: r.distance }); setRs('ok')
        mapRef.current.fitBounds(pl.getBounds(), { paddingTopLeft: [40, 130], paddingBottomRight: [40, 300] })
      })
      .catch((e) => { if (e?.name !== 'AbortError') setRs('err') })
    return () => a.abort()
  }, [navOpen, origin, sel?.id, mode])

  /* 동작 */
  const pick = (p) => {
    const map = mapRef.current
    setSel(p); setNavOpen(false); setOrigin(null); setOq(''); setFocus(false); setQ(''); setSnap(1)
    if (map) {
      const z = Math.max(map.getZoom(), 16)
      const pt = map.project([p.lat, p.lon], z).add([0, map.getSize().y * 0.2])
      map.flyTo(map.unproject(pt, z), z, { duration: 0.6 })
    }
  }
  const pin = (ll) => pick({ id: `pin:${ll.lat.toFixed(5)},${ll.lng.toFixed(5)}`, name: '지정한 위치', cat: 'pin', lat: ll.lat, lon: ll.lng })
  H.current = { pick, pin, say }

  const remember = (t) => setRecent((r) => [t, ...(Array.isArray(r) ? r : []).filter((x) => x !== t)].slice(0, 8))
  const closeSearch = () => { setFocus(false); setQ(''); document.activeElement?.blur?.() }
  const chooseCat = (k) => { setCat(cat === k ? null : k); setTab('near'); setSel(null); setNavOpen(false); setSnap(1) }
  const catHits = q.trim() ? CATS.filter((c) => c.l.includes(q.trim()) || q.trim().includes(c.l)) : []
  const submit = () => {
    const t = q.trim()
    if (!t) return
    remember(t)
    if (catHits[0]) { chooseCat(catHits[0].k); closeSearch() } else if (geo.res[0]) pick(geo.res[0])
  }

  const isFav = (p) => favs.some((x) => x.id === p.id)
  const toggleFav = (p) => setFav((f) => {
    const a = (Array.isArray(f) ? f : []).filter((x) => x && typeof x === 'object' && x.id)
    return a.some((x) => x.id === p.id) ? a.filter((x) => x.id !== p.id) : [...a, p]
  })
  const share = async (p) => {
    const url = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`
    const text = p.name + (p.addr ? ' · ' + p.addr : '')
    try {
      if (navigator.share) await navigator.share({ title: p.name, text, url })
      else { await navigator.clipboard.writeText(`${text}\n${url}`); say('링크를 복사했어요') }
    } catch (e) { if (e?.name !== 'AbortError') say('공유하지 못했어요') }
  }
  const locate = (after) => {
    if (!navigator.geolocation) { say('이 기기에서는 위치 기능을 사용할 수 없어요'); return }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const u = { lat: p.coords.latitude, lon: p.coords.longitude }
        setUserPos(u)
        if (after) after(u); else mapRef.current?.flyTo([u.lat, u.lon], 16)
      },
      (e) => say(e.code === 1 ? '위치 권한이 거부되었어요. 설정에서 허용해주세요' : '현재 위치를 가져오지 못했어요'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const rf = userPos || anchor
  const dOf = (p) => hav(rf.lat, rf.lon, p.lat, p.lon)

  // 시트 드래그
  const gdown = (e) => { gd.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const gup = (e) => {
    if (gd.current == null) return
    const dy = e.clientY - gd.current; gd.current = null
    if (dy < -30) setSnap((s) => Math.min(2, s + 1))
    else if (dy > 30) { if (snap === 0 && sel) { setSel(null); setNavOpen(false) } else setSnap((s) => Math.max(0, s - 1)) }
    else if (Math.abs(dy) < 6) setSnap((s) => (s === 0 ? 1 : s === 2 ? 1 : 2))
  }

  const ext = (kind) => {
    const o = origin ? { a: `&saddr=${origin.lat},${origin.lon}`, g: `&origin=${origin.lat},${origin.lon}` } : { a: '', g: '' }
    if (kind === 'a') return `https://maps.apple.com/?daddr=${sel.lat},${sel.lon}${o.a}&dirflg=${{ driving: 'd', walking: 'w', transit: 'r', cycling: 'w' }[mode]}`
    return `https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lon}${o.g}&travelmode=${{ driving: 'driving', walking: 'walking', transit: 'transit', cycling: 'bicycling' }[mode]}`
  }

  const Row = ({ p, onClick, sub }) => {
    const m = meta(p.cat)
    return (
      <button className="mp-row" onClick={onClick}>
        <i style={{ background: m.c }}><Ic n={m.i} s={18} /></i>
        <div><b>{p.name}</b><span>{sub ?? [m.l, p.addr].filter(Boolean).join(' · ')}</span></div>
        {sub === undefined && <em>{km(dOf(p))}</em>}
      </button>
    )
  }

  const d = sel ? dOf(sel) : null

  return (
    <div className="mp" style={{ '--mp-sh': ['132px', '46%', '46%'][snap] }}>
      <div className="mp-map" ref={elRef} />

      <div className="mp-top">
        <div className="mp-search">
          <Ic n="search" s={18} />
          <input value={q} placeholder="장소, 주소, 업종 검색" enterKeyHint="search" onFocus={() => setFocus(true)} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          {q && <button className="mp-ib" aria-label="지우기" onClick={() => setQ('')}><Ic n="x" s={16} /></button>}
          {focus ? <button className="mp-txt" onClick={closeSearch}>취소</button> : <button className="mp-txt" onClick={close}>닫기</button>}
        </div>
        {!focus && (
          <div className="mp-chips">
            {CATS.map((c) => (
              <button key={c.k} className={cat === c.k ? 'on' : ''} onClick={() => chooseCat(c.k)}><Ic n={c.i} s={16} />{c.l}</button>
            ))}
          </div>
        )}
        {!focus && moved && !loading && <button className="mp-redo" onClick={() => loadNearby(cat)}>이 지역 재검색</button>}
      </div>

      {!focus && (
        <div className="mp-fab">
          <div>
            <button aria-label="지도 레이어" className={sat ? 'on' : ''} onClick={() => setSat(!sat)}><Ic n="layers" /></button>
            <button aria-label="현재 위치" onClick={() => locate()}><Ic n="locate" /></button>
          </div>
          <div>
            <button aria-label="확대" onClick={() => mapRef.current?.zoomIn()}><Ic n="plus" /></button>
            <button aria-label="축소" onClick={() => mapRef.current?.zoomOut()}><Ic n="minus" /></button>
          </div>
        </div>
      )}

      {toast && <div className="mp-toast">{toast}</div>}

      {focus ? (
        <div className="mp-results">
          {!q.trim() && recents.length > 0 && (
            <>
              <div className="mp-sec"><span>최근 검색</span><button onClick={() => setRecent([])}>전체 삭제</button></div>
              {recents.map((t) => (
                <div className="mp-rec" key={t}>
                  <button onClick={() => setQ(t)}><Ic n="history" s={18} />{t}</button>
                  <button className="mp-ib" aria-label="삭제" onClick={() => setRecent(recents.filter((x) => x !== t))}><Ic n="x" s={16} /></button>
                </div>
              ))}
            </>
          )}
          {!q.trim() && recents.length === 0 && <p className="mp-empty">최근 검색 기록이 없어요</p>}
          {catHits.map((c) => (
            <button className="mp-row" key={c.k} onClick={() => { remember(q.trim()); chooseCat(c.k); closeSearch() }}>
              <i style={{ background: c.c }}><Ic n={c.i} s={18} /></i>
              <div><b>{c.l}</b><span>현재 지도 주변에서 찾기</span></div>
            </button>
          ))}
          {q.trim().length >= 2 && geo.loading && <p className="mp-empty">검색 중</p>}
          {geo.res.map((p) => <Row key={p.id} p={p} sub={[meta(p.cat).l, p.addr].filter(Boolean).join(' · ')} onClick={() => { remember(q.trim()); pick(p) }} />)}
          {geo.err && <p className="mp-empty">검색에 실패했어요. 잠시 후 다시 시도해주세요</p>}
          {q.trim().length >= 2 && !geo.loading && !geo.err && geo.res.length === 0 && catHits.length === 0 && <p className="mp-empty">검색 결과가 없어요</p>}
        </div>
      ) : (
        <div className={`mp-sheet s${snap}`}>
          <div className="mp-grab" onPointerDown={gdown} onPointerUp={gup} onPointerCancel={() => (gd.current = null)}><i /></div>
          <div className="mp-body">
            {sel && navOpen ? (
              <div className="mp-nav">
                <div className="mp-dh">
                  <button className="mp-ib" aria-label="뒤로" onClick={() => setNavOpen(false)}><Ic n="back" /></button>
                  <h2>길찾기</h2>
                  <button className="mp-ib" aria-label="닫기" onClick={() => { setNavOpen(false); setSel(null) }}><Ic n="x" /></button>
                </div>
                <div className="mp-modes">
                  {MODES.map((m) => <button key={m.k} className={mode === m.k ? 'on' : ''} onClick={() => setMode(m.k)}><Ic n={m.i} s={18} /><span>{m.l}</span></button>)}
                </div>
                <div className="mp-od">
                  <b>출발</b>
                  {origin ? (
                    <div className="mp-chip-o">{origin.name}<button className="mp-ib" aria-label="출발지 해제" onClick={() => setOrigin(null)}><Ic n="x" s={14} /></button></div>
                  ) : (
                    <input value={oq} placeholder="출발지 검색" onChange={(e) => setOq(e.target.value)} />
                  )}
                  <button className="mp-loc" onClick={() => locate((u) => setOrigin({ ...u, name: '현재 위치' }))}><Ic n="locate" s={16} />현재 위치</button>
                </div>
                {!origin && ogeo.res.map((p) => <Row key={p.id} p={p} sub={p.addr || meta(p.cat).l} onClick={() => { setOrigin({ lat: p.lat, lon: p.lon, name: p.name }); setOq('') }} />)}
                {!origin && ogeo.err && <p className="mp-empty">검색에 실패했어요</p>}
                <div className="mp-od"><b>도착</b><span className="mp-dest">{sel.name}</span></div>
                {!origin && <p className="mp-hint">출발지를 선택하면 경로를 계산해요</p>}
                {rs === 'loading' && <p className="mp-hint">경로를 계산하는 중</p>}
                {rs === 'ok' && rt && <div className="mp-route"><b>{mins(rt.dur)}</b><span>{km(rt.dist)}</span></div>}
                {rs === 'err' && <p className="mp-hint">경로를 계산하지 못했어요. 외부 지도 앱에서 열어보세요.</p>}
                {rs === 'na' && <p className="mp-hint">대중교통 경로는 외부 지도 앱에서 확인할 수 있어요.</p>}
                <div className="mp-ext">
                  <a href={ext('a')} target="_blank" rel="noopener noreferrer">Apple 지도에서 열기</a>
                  <a href={ext('g')} target="_blank" rel="noopener noreferrer">Google 지도에서 열기</a>
                </div>
              </div>
            ) : sel ? (
              <div className="mp-detail">
                <div className="mp-dh">
                  <div><h2>{sel.name}</h2><span>{meta(sel.cat).l}{d != null && ` · ${km(d)}`}</span></div>
                  <button className="mp-ib" aria-label="닫기" onClick={() => setSel(null)}><Ic n="x" /></button>
                </div>
                <div className="mp-actions">
                  <button className="pri" onClick={() => { setNavOpen(true); setSnap(1) }}><Ic n="nav" s={18} />길찾기</button>
                  <button className={isFav(sel) ? 'on' : ''} onClick={() => toggleFav(sel)}><Ic n="star" s={18} fill={isFav(sel) ? 'currentColor' : 'none'} />{isFav(sel) ? '저장됨' : '즐겨찾기'}</button>
                  <button onClick={() => share(sel)}><Ic n="share" s={18} />공유</button>
                </div>
                {sel.desc && <p className="mp-desc">{sel.desc}</p>}
                <div className="mp-kvs">
                  {sel.addr && <div className="mp-kv"><Ic n="pin" s={18} /><span>{sel.addr}</span></div>}
                  {sel.tel && <div className="mp-kv"><Ic n="phone" s={18} /><a href={`tel:${sel.tel.replace(/[^\d+]/g, '')}`}>{sel.tel}</a></div>}
                  {sel.hours && <div className="mp-kv"><Ic n="clock" s={18} /><span>{sel.hours}</span></div>}
                  {sel.web && <div className="mp-kv"><Ic n="globe" s={18} /><a href={href(sel.web)} target="_blank" rel="noopener noreferrer">{sel.web.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></div>}
                </div>
              </div>
            ) : (
              <>
                <div className="mp-tabs">
                  <button className={tab === 'near' ? 'on' : ''} onClick={() => setTab('near')}>주변{cat ? ` · ${meta(cat).l}` : ''}</button>
                  <button className={tab === 'fav' ? 'on' : ''} onClick={() => setTab('fav')}>즐겨찾기 {favs.length}</button>
                </div>
                {tab === 'near' && loading && <p className="mp-empty">주변 장소를 찾는 중</p>}
                {tab === 'near' && !loading && err && <p className="mp-empty">장소를 불러오지 못했어요<br /><button className="mp-txt" onClick={() => loadNearby(cat)}>다시 시도</button></p>}
                {tab === 'near' && !loading && !err && results.length === 0 && <p className="mp-empty">이 지역에서 찾은 장소가 없어요</p>}
                {tab === 'fav' && favs.length === 0 && <p className="mp-empty">저장한 장소가 없어요</p>}
                {(tab === 'fav' || !loading) && shown.map((p) => (
                  tab === 'fav' ? (
                    <div className="mp-rec fv" key={p.id}>
                      <Row p={p} sub={p.addr || meta(p.cat).l} onClick={() => pick(p)} />
                      <button className="mp-ib" aria-label="즐겨찾기 삭제" onClick={() => toggleFav(p)}><Ic n="trash" s={18} /></button>
                    </div>
                  ) : <Row key={p.id} p={p} onClick={() => pick(p)} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
