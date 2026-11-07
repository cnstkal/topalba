import { useState, useRef, useEffect } from 'react'
import { DAYS } from '../utils'

// 사진은 색상 타일로 표현 (추후 실제 이미지로 교체 가능)
const TINTS = [
  ['#f5d9b8', '#c98f5a'], ['#bfe0ff', '#5d8fd1'], ['#cdeccf', '#5fa36a'], ['#fbc9de', '#d77a9f'],
  ['#fff0b3', '#e0b84a'], ['#d6ceff', '#8a7bd6'], ['#ffd0b3', '#d98258'], ['#bfe8ec', '#4f9aa3'],
]
const PLACES = ['서울 영등포구', '서울 마포구', '인천 연수구', '서울 강남구', '경기 성남시', '인천 중구']
const PHOTOS = Array.from({ length: 120 }).map((_, i) => ({
  id: i,
  tint: TINTS[i % TINTS.length][0],
  bg: `linear-gradient(155deg, ${TINTS[i % TINTS.length][0]}, ${TINTS[i % TINTS.length][1]})`,
  caption: ['한강 산책', '점심 메뉴', '회사 근처', '퇴근길', '카페', '주말'][i % 6],
  // 최근 14장은 촘촘하게, 나머지는 몇 달~몇 년 전으로 분산
  daysAgo: i < 14 ? Math.floor(i * 1.7) : (i - 13) * 55,
  hour: 8 + ((i * 5) % 13),
  min: (i * 17) % 60,
  place: PLACES[i % PLACES.length],
  fav: i % 5 === 0,
  shot: i % 7 === 0,
  file: `IMG_${String(1200 + i * 7).padStart(4, '0')}.${i % 7 === 0 ? 'PNG' : 'HEIC'}`,
  mb: (1.4 + ((i * 37) % 30) / 10).toFixed(1),
  res: i % 7 === 0 ? '1179 × 2556' : '4032 × 3024',
}))

const dateOf = (p) => new Date(Date.now() - p.daysAgo * 86400000)
const fmtFull = (p) => {
  const d = dateOf(p)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}
// iOS 상단 날짜: 오늘/어제/요일/전체 날짜
const fmtHead = (p) => {
  if (p.daysAgo === 0) return '오늘'
  if (p.daysAgo === 1) return '어제'
  const d = dateOf(p)
  if (p.daysAgo < 7) return `${DAYS[d.getDay()]}요일`
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}
const fmtTime = (p) => `${p.hour < 12 ? '오전' : '오후'} ${p.hour % 12 || 12}:${String(p.min).padStart(2, '0')}`

const VIEWS = [['year', '연도'], ['month', '월'], ['day', '일'], ['all', '모든 사진']]
const keyOf = (p, v) => {
  const d = dateOf(p)
  if (v === 'year') return `${d.getFullYear()}년`
  if (v === 'month') return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}

// ===== 아이콘 =====
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Ic = {
  back: <svg width="13" height="22" viewBox="0 0 13 22" {...S} strokeWidth="2.6"><path d="M11 2L2 11l9 9" /></svg>,
  menu: <svg width="26" height="22" viewBox="0 0 26 22" {...S} strokeWidth="2.4"><path d="M2 4h22M5 11h16M8 18h10" /></svg>,
  dots: <svg width="26" height="8" viewBox="0 0 26 8" fill="currentColor"><circle cx="3" cy="4" r="2.6" /><circle cx="13" cy="4" r="2.6" /><circle cx="23" cy="4" r="2.6" /></svg>,
  cloud: <svg width="24" height="18" viewBox="0 0 24 18"><path d="M6.5 16.5h11a4.2 4.2 0 0 0 .8-8.3A6.2 6.2 0 0 0 6.3 7.6 4.5 4.5 0 0 0 6.5 16.5z" fill="currentColor" /><path d="M3 2l18 15" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" /><path d="M3 2l18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  chev: <svg width="9" height="14" viewBox="0 0 9 14" {...S} strokeWidth="2.4"><path d="M2 2l5 5-5 5" /></svg>,
  lib: <svg width="34" height="30" viewBox="0 0 34 30" fill="currentColor"><rect x="5" y="1" width="26" height="6" rx="3" opacity=".45" /><rect x="1" y="6" width="32" height="23" rx="5" /><circle cx="22" cy="13" r="2.6" fill="#e8f1ff" /><path d="M4 26l8-8 5 5 5-4 8 7z" fill="#e8f1ff" /></svg>,
  coll: <svg width="34" height="32" viewBox="0 0 34 32" fill="currentColor"><rect x="7" y="1" width="20" height="4" rx="2" opacity=".4" /><rect x="4" y="6" width="26" height="4" rx="2" opacity=".7" /><rect x="1" y="11" width="32" height="20" rx="5" /></svg>,
  search: <svg width="28" height="28" viewBox="0 0 28 28" {...S} strokeWidth="3"><circle cx="12" cy="12" r="9" /><path d="M19 19l7 7" /></svg>,
  share: <svg width="26" height="30" viewBox="0 0 26 30" {...S} strokeWidth="2.3"><path d="M13 19V2M7 8l6-6 6 6M8 11H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V14a3 3 0 0 0-3-3h-3" /></svg>,
  heart: <svg width="30" height="27" viewBox="0 0 30 27" {...S} strokeWidth="2.3"><path d="M15 25S2 17 2 9a6.5 6.5 0 0 1 13-1.5A6.5 6.5 0 0 1 28 9c0 8-13 16-13 16z" /></svg>,
  heartOn: <svg width="30" height="27" viewBox="0 0 30 27" fill="#ff3b30" stroke="#ff3b30" strokeWidth="2.3" strokeLinejoin="round"><path d="M15 25S2 17 2 9a6.5 6.5 0 0 1 13-1.5A6.5 6.5 0 0 1 28 9c0 8-13 16-13 16z" /></svg>,
  info: <svg width="30" height="30" viewBox="0 0 30 30" {...S} strokeWidth="2.3"><circle cx="15" cy="15" r="13" /><path d="M15 13v9M15 8.2v.3" strokeWidth="3" /></svg>,
  adj: <svg width="30" height="28" viewBox="0 0 30 28" {...S} strokeWidth="2.3"><path d="M2 6h26M2 14h26M2 22h26" /><circle cx="19" cy="6" r="3.2" fill="#fff" /><circle cx="10" cy="14" r="3.2" fill="#fff" /><circle cx="20" cy="22" r="3.2" fill="#fff" /></svg>,
  trash: <svg width="26" height="30" viewBox="0 0 26 30" {...S} strokeWidth="2.3"><path d="M2 7h22M9 7V3h8v4M4 7l1.3 19a2 2 0 0 0 2 1.9h11.4a2 2 0 0 0 2-1.9L22 7M10 12v11M16 12v11" /></svg>,
  scene: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l8 4.5v9L10 19l-8-4.5v-9z" /><circle cx="8.5" cy="8.5" r="1.6" fill="#fff" /><path d="M5 14l3.5-3.5 2 2L13 10l3 4z" fill="#fff" /></svg>,
}

export default function Photos() {
  const [tab, setTab] = useState('lib')
  const [view, setView] = useState('all')
  const [album, setAlbum] = useState(null)
  const [detail, setDetail] = useState(null)
  const [favs, setFavs] = useState({})
  const [gone, setGone] = useState({})
  const [selMode, setSelMode] = useState(false)
  const [sel, setSel] = useState({})
  const [sheet, setSheet] = useState(null) // share | edit | del | delSel | info | more
  const [menu, setMenu] = useState(false)
  const [bright, setBright] = useState({})
  const touchX = useRef(null)
  const strip = useRef(null)

  const live = PHOTOS.filter((p) => !gone[p.id]) // 최신순
  const isFav = (p) => favs[p.id] ?? p.fav
  const albums = [
    { id: 'recent', name: '최근 항목', list: live },
    { id: 'fav', name: '즐겨찾는 항목', list: live.filter(isFav) },
    { id: 'shot', name: '스크린샷', list: live.filter((p) => p.shot) },
  ]
  const selIds = Object.keys(sel).filter((k) => sel[k]).map(Number)

  // 상세 화면 썸네일 줄: 현재 사진을 가운데로
  useEffect(() => {
    const el = strip.current?.querySelector('.on')
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [detail])

  const open = (p) => {
    if (selMode) setSel({ ...sel, [p.id]: !sel[p.id] })
    else setDetail(p.id)
  }
  const exitSel = () => { setSelMode(false); setSel({}) }
  const removeIds = (ids) => {
    const g = { ...gone }
    ids.forEach((id) => (g[id] = true))
    setGone(g)
    exitSel()
    setSheet(null)
  }

  const thumb = (p) => (
    <button key={p.id} className={`ph-th${sel[p.id] ? ' sel' : ''}`} style={{ background: p.bg }} onClick={() => open(p)}>
      {selMode && <i className="ph-check">{sel[p.id] ? '✓' : ''}</i>}
    </button>
  )
  const grid = (list) => <div className="ph-grid">{list.map(thumb)}</div>

  const sheetView = () => {
    if (!sheet) return null
    const p = detail !== null ? PHOTOS.find((x) => x.id === detail) : null
    const n = p ? 1 : selIds.length
    return (
      <div className="ph-dim" onClick={() => setSheet(null)}>
        <div className="ph-sheet" onClick={(e) => e.stopPropagation()}>
          {sheet === 'share' && (
            <>
              <div className="ph-sheet-t">사진 {n}장</div>
              <div className="ph-share">
                {['AirDrop', '메시지', '메일', '메모'].map((x) => (
                  <button key={x} onClick={() => setSheet(null)}><i />{x}</button>
                ))}
              </div>
              <button className="ph-sheet-b" onClick={() => setSheet(null)}>취소</button>
            </>
          )}
          {sheet === 'more' && (
            <>
              <button className="ph-sheet-b" onClick={() => setSheet('info')}>정보 보기</button>
              <button className="ph-sheet-b" onClick={() => setSheet(null)}>취소</button>
            </>
          )}
          {sheet === 'info' && p && (
            <>
              <div className="ph-sheet-t">{fmtFull(p)} {fmtTime(p)}</div>
              <div className="ph-meta">
                <div><span>위치</span><b>{p.place}</b></div>
                <div><span>파일명</span><b>{p.file}</b></div>
                <div><span>해상도</span><b>{p.res}</b></div>
                <div><span>크기</span><b>{p.mb}MB</b></div>
              </div>
              <button className="ph-sheet-b" onClick={() => setSheet(null)}>완료</button>
            </>
          )}
          {sheet === 'edit' && p && (
            <>
              <div className="ph-sheet-t">조정 · 밝기</div>
              <input type="range" min="60" max="140" value={bright[p.id] ?? 100} onChange={(e) => setBright({ ...bright, [p.id]: +e.target.value })} />
              <div className="ph-sheet-row">
                <button onClick={() => { setBright({ ...bright, [p.id]: 100 }); setSheet(null) }}>되돌리기</button>
                <button className="b" onClick={() => setSheet(null)}>완료</button>
              </div>
            </>
          )}
          {(sheet === 'del' || sheet === 'delSel') && (
            <>
              <div className="ph-sheet-t">{sheet === 'del' ? '이 사진을 삭제할까요?' : `사진 ${selIds.length}장을 삭제할까요?`}</div>
              <button className="ph-sheet-b red" onClick={() => removeIds(sheet === 'del' ? [p.id] : selIds)}>사진 삭제</button>
              <button className="ph-sheet-b" onClick={() => setSheet(null)}>취소</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ===== 상세 =====
  if (detail !== null) {
    const idx = live.findIndex((x) => x.id === detail)
    if (idx < 0) { setDetail(null); return null }
    const p = live[idx]
    const go = (d) => live[idx + d] && setDetail(live[idx + d].id)
    return (
      <div className="page pd-page">
        <div className="pd-top">
          <button className="ph-gb" onClick={() => setDetail(null)}>{Ic.back}</button>
          <div className="pd-head">
            <b>{fmtHead(p)}</b>
            <span>{fmtTime(p)}</span>
          </div>
          <button className="ph-gb" onClick={() => setSheet('more')}>{Ic.dots}</button>
        </div>
        <div
          className="pd-stage"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          }}
        >
          <span className="pd-scene">{Ic.scene}{Ic.chev}</span>
          <div className={`pd-img${p.shot ? ' shot' : ''}`} style={{ background: p.bg, filter: `brightness(${(bright[p.id] ?? 100) / 100})` }}>
            <span>{p.caption}</span>
          </div>
        </div>
        <div className="pd-strip" ref={strip}>
          {live.map((x) => (
            <button key={x.id} className={x.id === p.id ? 'on' : ''} style={{ background: x.bg }} onClick={() => setDetail(x.id)} />
          ))}
        </div>
        <div className="pd-bar">
          <button className="ph-gb big" onClick={() => setSheet('share')}>{Ic.share}</button>
          <div className="ph-cap">
            <button onClick={() => setFavs({ ...favs, [p.id]: !isFav(p) })}>{isFav(p) ? Ic.heartOn : Ic.heart}</button>
            <button onClick={() => setSheet('info')}>{Ic.info}</button>
            <button onClick={() => setSheet('edit')}>{Ic.adj}</button>
          </div>
          <button className="ph-gb big" onClick={() => setSheet('del')}>{Ic.trash}</button>
        </div>
        {sheetView()}
      </div>
    )
  }

  // ===== 앨범 상세 (모음 탭은 비활성화 상태, 기존 코드 유지) =====
  if (album) {
    const a = albums.find((x) => x.id === album)
    return (
      <div className="page">
        <div className="pd-top">
          <button className="ph-gb" onClick={() => setAlbum(null)}>{Ic.back}</button>
        </div>
        <div className="large-title">{a.name}</div>
        <div className="scroll">{a.list.length ? grid(a.list) : <div className="empty">사진이 없습니다.</div>}</div>
      </div>
    )
  }

  // ===== 보관함 =====
  const groups = []
  live.forEach((p) => {
    const k = view === 'all' ? '' : keyOf(p, view)
    const g = groups[groups.length - 1]
    if (g && g.k === k) g.list.push(p)
    else groups.push({ k, list: [p] })
  })

  return (
    <div className="page" onClick={() => menu && setMenu(false)}>
      <div className="ph-head">
        <h1>{selMode ? (selIds.length ? `${selIds.length}장 선택됨` : '항목 선택') : '보관함'}</h1>
        <div className="ph-top">
          {selMode ? (
            <button className="ph-gb pill" onClick={exitSel}>취소</button>
          ) : (
            <>
              <button className="ph-gb" onClick={(e) => { e.stopPropagation(); setMenu(!menu) }}>{Ic.menu}</button>
              <button className="ph-gb pill" onClick={() => setSelMode(true)}>선택</button>
            </>
          )}
        </div>
      </div>
      {menu && (
        <div className="ph-menu" onClick={(e) => e.stopPropagation()}>
          {VIEWS.map(([v, l]) => (
            <button key={v} onClick={() => { setView(v); setMenu(false) }}>
              <span>{l}</span>
              <i>{view === v ? '✓' : ''}</i>
            </button>
          ))}
        </div>
      )}
      {!selMode && (
        <button className="ph-sync">
          {Ic.cloud}
          <b>120개의 항목</b>
          {Ic.chev}
        </button>
      )}
      <div className="scroll ph-scroll">
        {groups.map((g, gi) => (
          <section key={gi} className="ph-sec">
            {g.k && (
              <div className="ph-sec-h">
                <b>{g.k}</b>
                <span>{g.list.length}장</span>
              </div>
            )}
            {view === 'year' || view === 'month' ? (
              <button className="ph-cover" style={{ background: g.list[0].bg }} onClick={() => setView(view === 'year' ? 'month' : 'day')}>
                <span>{g.k}</span>
              </button>
            ) : (
              grid(g.list)
            )}
          </section>
        ))}
        {!live.length && <div className="empty">사진이 없습니다.</div>}
      </div>
      {selMode ? (
        <div className="ph-bar sel">
          <button className="ph-gb big" disabled={!selIds.length} onClick={() => setSheet('share')}>{Ic.share}</button>
          <button className="ph-gb big" disabled={!selIds.length} onClick={() => setSheet('delSel')}>{Ic.trash}</button>
        </div>
      ) : (
        <div className="ph-bar">
          <div className="ph-tabs">
            <button className={tab === 'lib' ? 'on' : ''} onClick={() => setTab('lib')}>{Ic.lib}<span>보관함</span></button>
            {/* 모음(앨범) 탭은 비활성화 */}
            <button disabled>{Ic.coll}<span>모음</span></button>
          </div>
          {/* 검색은 비활성화 */}
          <button className="ph-gb search" disabled>{Ic.search}</button>
        </div>
      )}
      {sheetView()}
    </div>
  )
}
