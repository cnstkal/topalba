import { useState, useRef } from 'react'
import Back from '../components/Back'
import { DAYS } from '../utils'

// 사진은 색상 타일로 표현 (추후 실제 이미지로 교체 가능)
const TINTS = ['#f5e6d3', '#d6ecff', '#e8f5e9', '#fde7f1', '#fff4cc', '#e6e0ff', '#ffe0cc', '#d9f0f2']
const PLACES = ['서울 영등포구', '서울 마포구', '인천 연수구', '서울 강남구', '경기 성남시', '인천 중구']
const PHOTOS = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  tint: TINTS[i % TINTS.length],
  caption: ['한강 산책', '점심 메뉴', '회사 근처', '퇴근길', '카페', '주말'][i % 6],
  // 최근 14장은 촘촘하게, 나머지는 몇 달~몇 년 전으로 분산
  daysAgo: i < 14 ? i * 2 + 1 : (i - 13) * 55,
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
const fmtDay = (p) => {
  const d = dateOf(p)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}
const fmtTime = (p) => `${p.hour < 12 ? '오전' : '오후'} ${p.hour % 12 || 12}:${String(p.min).padStart(2, '0')}`

const VIEWS = [['year', '연도'], ['month', '월'], ['day', '일'], ['all', '모든 사진']]
const keyOf = (p, v) => {
  const d = dateOf(p)
  if (v === 'year') return `${d.getFullYear()}년`
  if (v === 'month') return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}

export default function Photos() {
  const [tab, setTab] = useState('lib')
  const [view, setView] = useState('day')
  const [album, setAlbum] = useState(null)
  const [detail, setDetail] = useState(null)
  const [favs, setFavs] = useState({})
  const [gone, setGone] = useState({})
  const [selMode, setSelMode] = useState(false)
  const [sel, setSel] = useState({})
  const [sheet, setSheet] = useState(null) // 'share' | 'edit' | 'del' | 'delSel'
  const [bright, setBright] = useState({})
  const touchX = useRef(null)

  const live = PHOTOS.filter((p) => !gone[p.id]) // 최신순
  const isFav = (p) => favs[p.id] ?? p.fav
  const albums = [
    { id: 'recent', name: '최근 항목', list: live },
    { id: 'fav', name: '즐겨찾는 항목', list: live.filter(isFav) },
    { id: 'shot', name: '스크린샷', list: live.filter((p) => p.shot) },
  ]
  const selIds = Object.keys(sel).filter((k) => sel[k]).map(Number)

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
    <button key={p.id} className={`ph-th${sel[p.id] ? ' sel' : ''}`} style={{ background: p.tint }} onClick={() => open(p)}>
      {isFav(p) && !selMode && <i className="ph-heart">♥</i>}
      {selMode && <i className="ph-check">{sel[p.id] ? '✓' : ''}</i>}
    </button>
  )
  const grid = (list) => <div className="ph-grid">{list.map(thumb)}</div>

  const sheetView = () => {
    if (!sheet) return null
    const p = detail !== null ? PHOTOS.find((x) => x.id === detail) : null
    const n = sheet === 'share' && !p ? selIds.length : 1
    return (
      <div className="ph-dim" onClick={() => setSheet(null)}>
        <div className="ph-sheet" onClick={(e) => e.stopPropagation()}>
          {sheet === 'share' && (
            <>
              <div className="ph-sheet-t">사진 {n}장 공유</div>
              <div className="ph-share">
                {['AirDrop', '메시지', '메일', '메모'].map((x) => (
                  <button key={x} onClick={() => setSheet(null)}><i />{x}</button>
                ))}
              </div>
              <button className="ph-sheet-b" onClick={() => setSheet(null)}>취소</button>
            </>
          )}
          {sheet === 'info' && p && (
            <>
              <div className="ph-sheet-t">{fmtDay(p)} {fmtTime(p)}</div>
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
              <div className="ph-sheet-t">편집 · 밝기</div>
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
        <div className="nav">
          <Back onClick={() => setDetail(null)}>보관함</Back>
          <div className="pd-head">
            <div className="pd-date">{fmtDay(p)}</div>
            <div className="pd-time">{fmtTime(p)}</div>
          </div>
          <span style={{ width: 60 }} />
        </div>
        <div
          className="pd-stage"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          }}
        >
          <div className="pd-img" style={{ background: p.tint, filter: `brightness(${(bright[p.id] ?? 100) / 100})`, aspectRatio: p.shot ? '9 / 19.5' : '4 / 3' }}>
            <span>{p.caption}</span>
          </div>
        </div>
        <div className="pd-strip">
          {live.map((x) => (
            <button key={x.id} className={x.id === p.id ? 'on' : ''} style={{ background: x.tint }} onClick={() => setDetail(x.id)} />
          ))}
        </div>
        <div className="toolbar pd-bar">
          <button onClick={() => setSheet('share')}>⬆︎<small>공유</small></button>
          <button className={isFav(p) ? 'on' : ''} onClick={() => setFavs({ ...favs, [p.id]: !isFav(p) })}>{isFav(p) ? '♥' : '♡'}<small>즐겨찾기</small></button>
          <button onClick={() => setSheet('info')}>ⓘ<small>정보</small></button>
          <button onClick={() => setSheet('edit')}>☰<small>편집</small></button>
          <button className="red-txt" onClick={() => setSheet('del')}>🗑<small>삭제</small></button>
        </div>
        {sheetView()}
      </div>
    )
  }

  // ===== 앨범 상세 (앨범 탭은 비활성화 상태, 기존 코드 유지) =====
  if (album) {
    const a = albums.find((x) => x.id === album)
    return (
      <div className="page">
        <div className="nav">
          <Back onClick={() => setAlbum(null)}>앨범</Back>
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
  const photoCnt = live.filter((p) => !p.shot).length
  const shotCnt = live.length - photoCnt

  return (
    <div className="page">
      <div className="nav">
        {selMode ? <span className="nav-btn" onClick={exitSel}>취소</span> : <span />}
        {selMode ? <b className="ph-selcnt">{selIds.length ? `${selIds.length}개 선택됨` : '항목 선택'}</b> : null}
        {selMode ? <span style={{ width: 40 }} /> : (
          <span className="ph-top">
            <span className="ph-pill" onClick={() => setSelMode(true)}>선택</span>
            <span className="ph-pill ph-round" onClick={() => setView(VIEWS[(VIEWS.findIndex((x) => x[0] === view) + 1) % 4][0])}>•••</span>
          </span>
        )}
      </div>
      <div className="large-title">{tab === 'lib' ? '보관함' : '앨범'}</div>
      <div className="scroll ph-scroll">
        {tab === 'lib' ? (
          <>
            {groups.map((g, gi) => (
              <section key={gi} className="ph-sec">
                {g.k && (
                  <div className="ph-sec-h">
                    <b>{g.k}</b>
                    <span>{g.list.length}장</span>
                  </div>
                )}
                {view === 'year' || view === 'month' ? (
                  <button className="ph-cover" style={{ background: g.list[0].tint }} onClick={() => setView(view === 'year' ? 'month' : 'day')}>
                    <span>{g.k}</span>
                  </button>
                ) : (
                  grid(g.list)
                )}
              </section>
            ))}
            {!live.length && <div className="empty">사진이 없습니다.</div>}
            <div className="ph-count">
              <b>사진 {photoCnt}장, 스크린샷 {shotCnt}장</b>
              <span>방금 업데이트됨</span>
            </div>
          </>
        ) : (
          <div className="albums">
            {albums.map((a) => (
              <button key={a.id} onClick={() => setAlbum(a.id)}>
                <div className="album-cover" style={{ background: a.list[0]?.tint || '#eee' }} />
                <b>{a.name}</b>
                <span>{a.list.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selMode ? (
        <div className="toolbar ph-selbar">
          <button disabled={!selIds.length} onClick={() => setSheet('share')}>⬆︎<small>공유</small></button>
          <button disabled>＋<small>앨범에 추가</small></button>
          <button disabled={!selIds.length} className="red-txt" onClick={() => setSheet('delSel')}>🗑<small>삭제</small></button>
        </div>
      ) : (
        <div className="ph-float">
          <div className="ph-seg">
            {VIEWS.map(([v, l]) => (
              <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
          <div className="ph-tabrow">
            <div className="ph-tabs">
              <button className="on">보관함</button>
              {/* 컬렉션(앨범) 탭은 비활성화 */}
              <button disabled>컬렉션</button>
            </div>
            {/* 검색은 비활성화 */}
            <button className="ph-sbtn" disabled>⌕</button>
          </div>
        </div>
      )}
      {sheetView()}
    </div>
  )
}
