import { useMemo, useRef, useState } from 'react'
import { usePersist } from '../engine/persist'

const CATS = { 카페: ['☕', '#c2762e'], 음식점: ['🍜', '#e8523f'], 편의점: ['🏪', '#2f9e6b'], 공원: ['🌳', '#3a9d4a'], 병원: ['✚', '#d6336c'], 숙소: ['🛏', '#6c5ce7'], 서점: ['📚', '#1c7ed6'] }
const U = { x: 600, y: 640 }
const P = (id, name, cat, x, y, rate, rev, addr, hours, tel, desc) => ({ id, name, cat, x, y, rate, rev, addr, hours, tel, desc })
const PLACES = [
  P(1, '모카로스터스 송도점', '카페', 560, 600, 4.6, 312, '송도동 12-4', '매일 08:00–22:00', '032-555-0141', '직접 로스팅한 원두와 수제 스콘. 창가 자리가 인기예요.'),
  P(2, '느린우체통 커피', '카페', 690, 700, 4.4, 128, '송도동 31-9', '10:00–21:00 (월 휴무)', '032-555-0188', '엽서를 써서 부치면 한 달 뒤 도착하는 조용한 카페.'),
  P(3, '해들녘 칼국수', '음식점', 420, 560, 4.5, 654, '선학동 88-2', '11:00–20:30', '032-555-0233', '바지락 칼국수와 보쌈 세트. 점심시간엔 대기가 있어요.'),
  P(4, '오늘의 돈까스', '음식점', 640, 540, 4.2, 203, '송도동 7-15', '11:30–21:00', '032-555-0276', '두툼한 수제 돈까스와 직접 만든 소스.'),
  P(5, '바다집 횟집', '음식점', 780, 820, 4.3, 421, '해안로 150', '16:00–24:00', '032-555-0319', '제철 활어회와 매운탕. 창밖으로 바다가 보여요.'),
  P(6, 'GS25 송도중앙점', '편의점', 580, 660, 4.0, 41, '송도동 2-1', '24시간', '032-555-0402', '24시간 운영 편의점.'),
  P(7, 'CU 선학역점', '편의점', 360, 700, 3.9, 27, '선학동 45-6', '24시간', '032-555-0455', '역 출구 바로 앞.'),
  P(8, '솔빛공원', '공원', 570, 900, 4.7, 982, '송도동 공원로 1', '상시 개방', '', '잔디 광장과 산책로, 주말엔 버스킹이 열려요.'),
  P(9, '연꽃 어린이공원', '공원', 240, 230, 4.4, 156, '연수동 330', '상시 개방', '', '작은 연못과 놀이터가 있는 동네 공원.'),
  P(10, '새봄 내과의원', '병원', 520, 480, 4.5, 89, '송도동 21-3', '09:00–18:00 (일 휴진)', '032-555-0511', '내과·가정의학과. 토요일 오전 진료.'),
  P(11, '튼튼 치과', '병원', 700, 620, 4.3, 64, '송도동 17-8', '09:30–18:30', '032-555-0544', '야간진료 화요일 21시까지.'),
  P(12, '호텔 라온', '숙소', 800, 520, 4.4, 377, '해안로 22', '체크인 15:00', '032-555-0600', '오션뷰 객실과 조식 뷔페.'),
  P(13, '게스트하우스 달빛', '숙소', 330, 380, 4.6, 118, '연수동 14-2', '체크인 16:00', '032-555-0633', '루프탑이 있는 아담한 게스트하우스.'),
  P(14, '책방 여백', '서점', 470, 700, 4.8, 207, '송도동 9-30', '12:00–20:00 (화 휴무)', '032-555-0677', '독립출판물과 소규모 북토크를 여는 동네 책방.'),
  P(15, '중앙도서관', '서점', 660, 380, 4.5, 301, '연수동 중앙로 5', '09:00–21:00', '032-555-0700', '열람실과 어린이 자료실을 갖춘 시립 도서관.'),
  P(16, '밤산책 로스터리', '카페', 250, 650, 4.1, 73, '선학동 102', '14:00–24:00', '032-555-0733', '늦은 시간까지 여는 디저트 카페.'),
]
const ROADS = [
  ['M0 600H800', 14, 1], ['M500 0V1200', 14, 1], ['M0 200L1000 1000', 12, 1],
  ['M150 0V1200', 7], ['M300 0V1200', 7], ['M660 0V1000', 7], ['M0 420H900', 7], ['M0 760H780', 7], ['M0 940H700', 7], ['M0 90H900', 7],
]
const km = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`)
const dist = (p) => Math.round(Math.hypot(p.x - U.x, p.y - U.y) * 2.2)
const blocks = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10), Math.abs(Math.sin(i * 12.9898) * 43758) % 1]).filter((b) => b[2] > 0.3)

export default function Maps({ close }) {
  const [fav, setFav] = usePersist('maps.fav', [1, 8, 14])
  const [view, setView] = useState({ cx: U.x, cy: U.y, k: 1 })
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [cat, setCat] = useState(null)
  const [tab, setTab] = useState('near')
  const [sel, setSel] = useState(null)
  const [route, setRoute] = useState(false)
  const box = useRef(null)
  const drag = useRef(null)

  const place = PLACES.find((p) => p.id === sel)
  const list = useMemo(() => {
    const t = q.trim()
    return PLACES.filter((p) => (!cat || p.cat === cat) && (!t || (p.name + p.cat + p.addr + p.desc).includes(t))).sort((a, b) => dist(a) - dist(b))
  }, [q, cat])
  const shown = tab === 'fav' ? PLACES.filter((p) => fav.includes(p.id)) : list
  const pick = (p) => { setSel(p.id); setRoute(false); setQ(''); setFocus(false); setView((v) => ({ cx: p.x, cy: p.y, k: Math.max(v.k, 1.3) })) }
  const zoom = (d) => setView((v) => ({ ...v, k: Math.min(2.4, Math.max(0.7, v.k + d)) }))
  const toggleFav = (id) => setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY } }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const sc = box.current.getBoundingClientRect().width / box.current.offsetWidth || 1
    const dx = (e.clientX - d.x) / sc, dy = (e.clientY - d.y) / sc
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ ...v, cx: v.cx - dx / v.k, cy: v.cy - dy / v.k }))
  }
  const up = () => { drag.current = null }
  const { cx, cy, k } = view
  const searching = focus || q

  return (
    <div className="mp" ref={box}>
      <div className="mp-map" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        <svg width="402" height="874">
          <rect width="402" height="874" fill="#f1efe9" />
          <g transform={`translate(${201 - cx * k} ${340 - cy * k}) scale(${k})`}>
            {blocks.map(([i, j]) => <rect key={i + '-' + j} x={i * 120 + 14} y={j * 120 + 14} width="92" height="92" rx="8" fill="#e8e4da" />)}
            {[[140, 160, 200, 150], [480, 820, 220, 170], [300, 470, 120, 90]].map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="26" fill="#cfe8c4" />)}
            <path d="M900 0L1300 0L1300 1300L760 1300C820 1100 700 1000 800 860C880 740 860 560 940 440C980 360 930 140 900 0Z" fill="#aad3df" />
            {ROADS.map(([d, w, major], i) => <path key={'c' + i} d={d} stroke="#d9d3c6" strokeWidth={w + 3} fill="none" strokeLinecap="round" />)}
            {ROADS.map(([d, w, major], i) => <path key={'r' + i} d={d} stroke={major ? '#fde9a8' : '#fff'} strokeWidth={w} fill="none" strokeLinecap="round" />)}
            {[['송도중앙로', 330, 594], ['선학로', 506, 300], ['해안로', 805, 900]].map(([t, x, y]) => <text key={t} x={x} y={y} fontSize="11" fill="#8a8578" fontWeight="600">{t}</text>)}
            <text x="960" y="700" fontSize="14" fill="#6aa0b3" fontStyle="italic">서해</text>
            {route && place && <path d={`M${U.x} ${U.y}L${U.x} ${place.y}L${place.x} ${place.y}`} stroke="#2f7cf6" strokeWidth={5 / k} strokeDasharray={`${1 / k} ${9 / k}`} strokeLinecap="round" fill="none" />}
            {PLACES.filter((p) => !cat || p.cat === cat).map((p) => {
              const on = p.id === sel
              return (
                <g key={p.id} transform={`translate(${p.x} ${p.y}) scale(${(on ? 1.25 : 1) / k})`} onClick={() => pick(p)} style={{ cursor: 'pointer' }}>
                  <path d="M0 0C-12-14-14-20-14-26a14 14 0 0 1 28 0c0 6-2 12-14 26z" fill={CATS[p.cat][1]} stroke="#fff" strokeWidth="2" />
                  <text y="-21" textAnchor="middle" fontSize="13" fill="#fff">{CATS[p.cat][0]}</text>
                  {(k > 1.1 || on) && <text y="14" textAnchor="middle" fontSize="11" fontWeight="700" fill="#333" stroke="#fff" strokeWidth="3" paintOrder="stroke">{p.name}</text>}
                </g>
              )
            })}
            <g transform={`translate(${U.x} ${U.y}) scale(${1 / k})`}>
              <circle r="22" fill="#2f7cf6" opacity=".18"><animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite" /></circle>
              <circle r="8" fill="#2f7cf6" stroke="#fff" strokeWidth="3" />
            </g>
          </g>
        </svg>
      </div>

      <div className="mp-top">
        <div className="mp-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="3" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><path d="M21 21l-6-6" /></svg>
          <input value={q} placeholder="장소, 주소 검색" onFocus={() => setFocus(true)} onChange={(e) => setQ(e.target.value)} />
          {searching ? <button onClick={() => { setQ(''); setFocus(false) }}>취소</button> : <button onClick={close}>닫기</button>}
        </div>
        <div className="mp-chips">
          {Object.keys(CATS).map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(cat === c ? null : c)}>{CATS[c][0]} {c}</button>)}
        </div>
      </div>

      <div className="mp-fab">
        <button onClick={() => zoom(0.3)}>+</button>
        <button onClick={() => zoom(-0.3)}>−</button>
        <button onClick={() => setView({ cx: U.x, cy: U.y, k: 1 })}>◎</button>
      </div>

      {searching ? (
        <div className="mp-results">
          {list.length === 0 && <p className="mp-empty">검색 결과가 없어요</p>}
          {list.map((p) => <Row key={p.id} p={p} onClick={() => pick(p)} />)}
        </div>
      ) : (
        <div className="mp-sheet">
          <div className="mp-grab" />
          {place ? (
            <div className="mp-detail">
              <div className="mp-dh">
                <div><h2>{place.name}</h2><span>{place.cat} · {km(dist(place))}</span></div>
                <button onClick={() => setSel(null)}>✕</button>
              </div>
              <div className="mp-rate">★ {place.rate} <em>리뷰 {place.rev}</em></div>
              <div className="mp-actions">
                <button className="pri" onClick={() => setRoute(!route)}>{route ? `도보 ${Math.ceil(dist(place) / 70)}분 · 안내 중` : '길찾기'}</button>
                <button onClick={() => toggleFav(place.id)}>{fav.includes(place.id) ? '★ 저장됨' : '☆ 즐겨찾기'}</button>
              </div>
              <p className="mp-desc">{place.desc}</p>
              <dl>
                <dt>주소</dt><dd>인천 연수구 {place.addr}</dd>
                <dt>영업</dt><dd>{place.hours}</dd>
                {place.tel && <><dt>전화</dt><dd>{place.tel}</dd></>}
              </dl>
            </div>
          ) : (
            <>
              <div className="mp-tabs">
                <button className={tab === 'near' ? 'on' : ''} onClick={() => setTab('near')}>주변</button>
                <button className={tab === 'fav' ? 'on' : ''} onClick={() => setTab('fav')}>즐겨찾기 {fav.length}</button>
              </div>
              <div className="mp-list">
                {shown.length === 0 && <p className="mp-empty">저장한 장소가 없어요</p>}
                {shown.map((p) => <Row key={p.id} p={p} onClick={() => pick(p)} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ p, onClick }) {
  return (
    <button className="mp-row" onClick={onClick}>
      <i style={{ background: CATS[p.cat][1] }}>{CATS[p.cat][0]}</i>
      <div><b>{p.name}</b><span>{p.cat} · ★{p.rate} · {p.addr}</span></div>
      <em>{km(dist(p))}</em>
    </button>
  )
}
