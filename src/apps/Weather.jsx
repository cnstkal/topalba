import { useEffect, useRef, useState } from 'react'

/* ───────── 샘플 데이터 (실시간 날씨 API 미연동) ─────────
   프로젝트에 날씨 API가 연결돼 있지 않으므로 모든 수치는 고정된 샘플입니다.
   화면에는 "샘플 데이터"로 명시합니다. */

const LABEL = { clear: '맑음', partly: '구름 조금', cloudy: '흐림', rain: '비', snow: '눈' }
const DAYS = ['오늘', '일요일', '월요일', '화요일', '수요일', '목요일', '금요일']

const hourLabel = (i) => {
  if (i === 0) return '지금'
  const h = (12 + i) % 24
  if (h === 0) return '오전 12시'
  if (h < 12) return `오전 ${h}시`
  if (h === 12) return '오후 12시'
  return `오후 ${h - 12}시`
}

// temps/conds/pops: 12시간치 (현재 시각 = 낮 12시 기준)
const hours = (temps, conds, pops) =>
  temps.map((t, i) => ({ t: hourLabel(i), temp: t, c: conds[i] || conds[conds.length - 1], pop: (pops && pops[i]) || 0 }))

// rows: [상태, 최고, 최저, 강수확률]
const days = (rows) => rows.map(([c, hi, lo, pop], i) => ({ d: DAYS[i], c, hi, lo, pop }))

const CITIES = {
  incheon: {
    name: '인천', cond: 'clear', temp: 18, hi: 21, lo: 12, feel: 17, pop: 0, hum: 48, wind: 3.2, dir: '북서', uv: 4, vis: 16,
    hourly: hours([18, 19, 20, 21, 21, 20, 19, 18, 17, 16, 15, 14],
      ['clear', 'clear', 'partly', 'partly', 'partly', 'partly', 'clear', 'clear'], []),
    daily: days([['clear', 21, 12, 0], ['partly', 20, 11, 10], ['cloudy', 18, 10, 30], ['clear', 19, 11, 0], ['clear', 18, 9, 0], ['partly', 17, 8, 10], ['cloudy', 16, 9, 30]]),
  },
  seoul: {
    name: '서울', cond: 'cloudy', temp: 16, hi: 19, lo: 10, feel: 15, pop: 20, hum: 55, wind: 2.4, dir: '서', uv: 3, vis: 12,
    hourly: hours([16, 17, 18, 19, 18, 17, 16, 15, 14, 13, 12, 12], ['cloudy', 'cloudy', 'partly', 'partly', 'cloudy'], [20, 20, 10, 10, 20]),
    daily: days([['cloudy', 19, 10, 20], ['partly', 18, 9, 10], ['rain', 15, 8, 70], ['cloudy', 14, 7, 30], ['clear', 16, 6, 0], ['clear', 17, 7, 0], ['partly', 16, 8, 10]]),
  },
  busan: {
    name: '부산', cond: 'partly', temp: 21, hi: 23, lo: 15, feel: 21, pop: 10, hum: 62, wind: 4.6, dir: '남동', uv: 5, vis: 18,
    hourly: hours([21, 22, 23, 23, 22, 22, 21, 20, 19, 18, 17, 17], ['partly', 'partly', 'clear', 'clear', 'partly'], [10, 10, 0, 0, 10]),
    daily: days([['partly', 23, 15, 10], ['clear', 24, 15, 0], ['cloudy', 21, 14, 30], ['rain', 18, 13, 60], ['cloudy', 18, 12, 20], ['clear', 19, 12, 0], ['clear', 20, 13, 0]]),
  },
  jeju: {
    name: '제주', cond: 'rain', temp: 19, hi: 20, lo: 16, feel: 18, pop: 80, hum: 84, wind: 7.8, dir: '북동', uv: 1, vis: 6,
    hourly: hours([19, 19, 19, 18, 18, 18, 17, 17, 17, 16, 16, 16], ['rain', 'rain', 'rain', 'cloudy', 'cloudy', 'rain'], [80, 80, 70, 50, 40, 60, 60, 50, 40, 40, 30, 30]),
    daily: days([['rain', 20, 16, 80], ['rain', 19, 15, 70], ['cloudy', 18, 14, 40], ['partly', 19, 13, 10], ['clear', 20, 14, 0], ['clear', 20, 14, 0], ['partly', 19, 14, 10]]),
  },
  daejeon: {
    name: '대전', cond: 'clear', temp: 17, hi: 21, lo: 9, feel: 16, pop: 0, hum: 44, wind: 1.8, dir: '북', uv: 4, vis: 20,
    hourly: hours([17, 18, 20, 21, 21, 20, 18, 16, 14, 13, 12, 11], ['clear']),
    daily: days([['clear', 21, 9, 0], ['clear', 20, 8, 0], ['partly', 18, 8, 10], ['cloudy', 16, 7, 30], ['clear', 17, 6, 0], ['clear', 18, 6, 0], ['partly', 17, 7, 10]]),
  },
  pyeongchang: {
    name: '평창', cond: 'snow', temp: -1, hi: 2, lo: -6, feel: -5, pop: 70, hum: 78, wind: 5.1, dir: '북서', uv: 1, vis: 4,
    hourly: hours([-1, -1, 0, 1, 1, 0, -1, -2, -3, -4, -4, -5], ['snow', 'snow', 'cloudy', 'cloudy', 'snow'], [70, 70, 40, 30, 50, 60, 60, 40, 30, 20, 20, 20]),
    daily: days([['snow', 2, -6, 70], ['cloudy', 1, -7, 30], ['partly', 3, -7, 10], ['clear', 4, -6, 0], ['clear', 5, -5, 0], ['cloudy', 3, -4, 20], ['snow', 1, -5, 60]]),
  },
}

const DEFAULT_ID = 'incheon'
const KEY = 'topalba.weather.v1'

const loadState = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    const list = Array.isArray(s && s.list) ? s.list.filter((id) => CITIES[id]) : []
    if (!list.includes(DEFAULT_ID)) list.unshift(DEFAULT_ID)
    const sel = s && list.includes(s.sel) ? s.sel : DEFAULT_ID
    return { list, sel }
  } catch (e) {
    return { list: [DEFAULT_ID], sel: DEFAULT_ID }
  }
}

const isValid = (d) => !!(d && typeof d.temp === 'number' && Array.isArray(d.hourly) && d.hourly.length && Array.isArray(d.daily) && d.daily.length)
const deg = (n) => (typeof n === 'number' ? `${n}°` : '--°')

/* ───────── 아이콘 (SVG, 동일한 선·면 규칙) ───────── */

const CLOUD = 'M19 50a10 10 0 0 1-1.2-19.9A15 15 0 0 1 46.6 28 11 11 0 0 1 47 50z'

function Sun({ cx, cy, r, ray = 1 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#ffd23f" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={cx} y1={cy - r - 4 * ray} x2={cx} y2={cy - r - 9 * ray} stroke="#ffd23f" strokeWidth={3.2 * ray} strokeLinecap="round" transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
    </g>
  )
}

function Icon({ c, size = 28 }) {
  let body
  if (c === 'clear') body = <Sun cx={32} cy={32} r={11} />
  else if (c === 'partly') body = (<><Sun cx={25} cy={25} r={8} ray={0.8} /><path d={CLOUD} fill="#fff" transform="translate(8 4) scale(.88)" /></>)
  else if (c === 'cloudy') body = (<><path d={CLOUD} fill="#b9c5d3" transform="translate(12 -2) scale(.8)" /><path d={CLOUD} fill="#fff" transform="translate(-2 4)" /></>)
  else if (c === 'rain') body = (<><path d={CLOUD} fill="#e4ebf3" transform="translate(0 -7)" />{[22, 32, 42].map((x) => <line key={x} x1={x} y1={47} x2={x - 3} y2={56} stroke="#5ec2ff" strokeWidth="3.4" strokeLinecap="round" />)}</>)
  else if (c === 'snow') body = (<><path d={CLOUD} fill="#e4ebf3" transform="translate(0 -7)" />{[[22, 51], [32, 56], [42, 51]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#cfeaff" />)}</>)
  else body = <circle cx="32" cy="32" r="3" fill="#fff" opacity=".6" />
  return <svg className="wx-ic" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">{body}</svg>
}

/* ───────── 보조 ───────── */

const feelNote = (t, f) => (typeof t !== 'number' || typeof f !== 'number' ? '' : f < t ? '실제 기온보다 쌀쌀해요' : f > t ? '실제 기온보다 따뜻해요' : '실제 기온과 비슷해요')
const humNote = (h) => (h >= 70 ? '습도가 높아요' : h <= 30 ? '건조해요' : '쾌적한 편이에요')
const uvNote = (u) => (u <= 2 ? '낮음' : u <= 5 ? '보통' : u <= 7 ? '높음' : '매우 높음')

function Detail({ title, value, note }) {
  return (
    <div className="wx-card wx-detail">
      <div className="wx-card-h">{title}</div>
      <div className="wx-big">{value}</div>
      <div className="wx-note">{note}</div>
    </div>
  )
}

/* ───────── 메인 ───────── */

export default function Weather({ close }) {
  const [{ list, sel }, setSt] = useState(loadState)
  const [sheet, setSheet] = useState(false)
  const [edit, setEdit] = useState(false)
  const [q, setQ] = useState('')
  const [compact, setCompact] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ list, sel })) } catch (e) { /* 저장 불가 시 무시 */ }
  }, [list, sel])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setCompact(false)
  }, [sel])

  const data = CITIES[sel]
  const ok = isValid(data)
  const cond = ok ? data.cond : 'cloudy'
  const pick = (id) => { setSt((s) => ({ ...s, sel: id })); setSheet(false); setEdit(false); setQ('') }
  const add = (id) => {
    setSt((s) => ({ list: s.list.includes(id) ? s.list : [...s.list, id], sel: id }))
    setSheet(false); setEdit(false); setQ('')
  }
  const remove = (id) => setSt((s) => {
    if (id === DEFAULT_ID) return s
    const next = s.list.filter((x) => x !== id)
    return { list: next, sel: s.sel === id ? DEFAULT_ID : s.sel }
  })

  const addable = Object.keys(CITIES).filter((id) => !list.includes(id) && CITIES[id].name.includes(q.trim()))

  const lows = ok ? data.daily.map((x) => x.lo) : []
  const highs = ok ? data.daily.map((x) => x.hi) : []
  const wMin = Math.min(...lows)
  const wMax = Math.max(...highs)
  const span = Math.max(wMax - wMin, 1)

  return (
    <div className={`page wx wx-${cond}`}>
      <div className="nav">
        <button className="wx-side" onClick={close}>완료</button>
        <span className="wx-nav-t">{ok && compact ? `${data.name}  ${deg(data.temp)} · ${LABEL[cond]}` : '날씨'}</span>
        <span className="wx-side" />
      </div>

      <div className="wx-scroll" ref={scrollRef} onScroll={(e) => setCompact(e.currentTarget.scrollTop > 150)}>
        {!ok ? (
          <div className="wx-empty">
            <Icon c="cloudy" size={72} />
            <b>날씨 정보를 불러올 수 없어요</b>
            <span>이 지역의 날씨 정보가 없습니다.</span>
            <button onClick={() => pick(DEFAULT_ID)}>인천으로 돌아가기</button>
          </div>
        ) : (
          <>
            <header className="wx-hero">
              <div className="wx-city">{data.name}</div>
              <div className="wx-temp">{deg(data.temp)}</div>
              <div className="wx-cond">{LABEL[cond]}</div>
              <div className="wx-hl">최고 {deg(data.hi)} · 최저 {deg(data.lo)}</div>
              <div className="wx-sample">샘플 데이터 · 실시간 날씨 아님</div>
            </header>

            <section className="wx-card">
              <div className="wx-card-h">시간별 예보</div>
              <div className="wx-hours">
                {data.hourly.map((h, i) => (
                  <div className="wx-hour" key={i}>
                    <span className="wx-hour-t">{h.t}</span>
                    <Icon c={h.c} size={30} />
                    <span className="wx-hour-p">{h.pop >= 20 ? `${h.pop}%` : ''}</span>
                    <b>{deg(h.temp)}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="wx-card">
              <div className="wx-card-h">주간 예보</div>
              {data.daily.map((d, i) => {
                const left = ((d.lo - wMin) / span) * 100
                const width = Math.max(((d.hi - d.lo) / span) * 100, 6)
                const dot = i === 0 ? Math.min(Math.max(((data.temp - wMin) / span) * 100, 0), 100) : null
                return (
                  <div className="wx-day" key={d.d}>
                    <span className="wx-day-n">{d.d}</span>
                    <span className="wx-day-i"><Icon c={d.c} size={26} />{d.pop >= 30 && <em>{d.pop}%</em>}</span>
                    <span className="wx-day-lo">{deg(d.lo)}</span>
                    <span className="wx-track">
                      <i style={{ left: `${left}%`, width: `${width}%` }} />
                      {dot !== null && <u style={{ left: `${dot}%` }} />}
                    </span>
                    <span className="wx-day-hi">{deg(d.hi)}</span>
                  </div>
                )
              })}
            </section>

            <div className="wx-grid">
              <Detail title="체감 온도" value={deg(data.feel)} note={feelNote(data.temp, data.feel)} />
              <Detail title="강수 확률" value={`${data.pop ?? 0}%`} note={data.pop >= 50 ? '우산을 챙기세요' : '오늘은 강수 가능성이 낮아요'} />
              <Detail title="습도" value={`${data.hum ?? '--'}%`} note={typeof data.hum === 'number' ? humNote(data.hum) : ''} />
              <Detail title="바람" value={`${data.wind ?? '--'} m/s`} note={`${data.dir || ''}풍`} />
              <Detail title="자외선 지수" value={data.uv ?? '--'} note={typeof data.uv === 'number' ? uvNote(data.uv) : ''} />
              <Detail title="가시거리" value={`${data.vis ?? '--'} km`} note={data.vis >= 10 ? '시야가 맑아요' : '시야가 다소 흐려요'} />
            </div>
          </>
        )}
      </div>

      <div className="wx-bar">
        <span className="wx-dots">
          {list.map((id) => (
            <button key={id} className={id === sel ? 'on' : ''} aria-label={CITIES[id].name} onClick={() => pick(id)} />
          ))}
        </span>
        <button className="wx-list-btn" aria-label="지역 목록" onClick={() => setSheet(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      {sheet && (
        <div className="wx-sheet-wrap" onClick={() => { setSheet(false); setEdit(false); setQ('') }}>
          <div className="wx-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="wx-sheet-top">
              <b>날씨</b>
              <span>
                <button onClick={() => setEdit((v) => !v)}>{edit ? '완료' : '편집'}</button>
                <button onClick={() => { setSheet(false); setEdit(false); setQ('') }}>닫기</button>
              </span>
            </div>
            <div className="wx-sheet-body">
              {list.map((id) => {
                const c = CITIES[id]
                return (
                  <div className={`wx-loc wx-${c.cond}`} key={id}>
                    {edit && id !== DEFAULT_ID && <button className="wx-minus" aria-label={`${c.name} 삭제`} onClick={() => remove(id)}>−</button>}
                    <button className="wx-loc-main" onClick={() => pick(id)}>
                      <span><b>{c.name}</b><em>{LABEL[c.cond]}</em></span>
                      <strong>{deg(c.temp)}</strong>
                    </button>
                  </div>
                )
              })}

              <div className="wx-add-h">지역 추가</div>
              <input className="wx-search" placeholder="지역 검색" value={q} onChange={(e) => setQ(e.target.value)} />
              {addable.length === 0 ? (
                <div className="wx-none">{q ? '검색 결과가 없어요' : '추가할 수 있는 지역을 모두 추가했어요'}</div>
              ) : (
                addable.map((id) => (
                  <button className="wx-addrow" key={id} onClick={() => add(id)}>
                    <span>{CITIES[id].name}</span><i>＋</i>
                  </button>
                ))
              )}
              <div className="wx-foot">모든 날씨 정보는 샘플 데이터입니다.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
