import { useEffect, useMemo, useState } from 'react'
import Back from '../components/Back'
import { usePersist } from '../engine/persist'

/* ───────── 날짜 유틸 ───────── */
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = () => ymd(new Date())
const addDay = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d) }
const WD = ['일', '월', '화', '수', '목', '금', '토']
const DAY30 = 30 * 864e5
const uid = () => Date.now() * 1000 + Math.floor(Math.random() * 1000)
const tf = (t: string) => { const [h, m] = t.split(':').map(Number); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(m)}` }
const dl = (s: string) => {
  if (s === todayStr()) return '오늘'
  if (s === addDay(1)) return '내일'
  if (s === addDay(-1)) return '어제'
  const [, m, d] = s.split('-').map(Number)
  return `${m}월 ${d}일`
}
const dlong = (s: string) => { const [y, m, d] = s.split('-').map(Number); return `${m}월 ${d}일 ${WD[new Date(y, m - 1, d).getDay()]}요일` }
const UNIT: any = { day: '일', week: '주', month: '개월', year: '년' }
const REP: any = { '': '안 함', day: '매일', week: '매주', month: '매월', year: '매년', custom: '사용자 지정' }
const repLabel = (r: any) => (r.repeat === 'custom' ? `${r.rN}${UNIT[r.rU]}마다` : REP[r.repeat])

/* 다음 반복 날짜 계산 */
const shift = (date: string, r: any) => {
  const [y, m, d] = date.split('-').map(Number)
  const n = r.repeat === 'custom' ? Math.max(1, r.rN | 0) : 1
  const u = r.repeat === 'custom' ? r.rU : r.repeat
  const dt = new Date(y, m - 1, d)
  if (u === 'day') dt.setDate(d + n)
  else if (u === 'week') dt.setDate(d + 7 * n)
  else {
    dt.setDate(1)
    if (u === 'month') dt.setMonth(m - 1 + n)
    else dt.setFullYear(y + n)
    dt.setDate(Math.min(d, new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate()))
  }
  return ymd(dt)
}

/* ───────── 아이콘 (SF Symbols 스타일) ───────── */
const P: any = {
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  cart: 'M3 4h2.500l2 11h10l2-8H7M9.500 20h.01M17 20h.01',
  book: 'M4 5.500C6.500 4.500 9.500 4.500 12 6c2.500-1.500 5.500-1.500 8-.5V19c-2.500-1-5.500-1-8 .5-2.500-1.500-5.500-1.500-8-.5zM12 6v13.500',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.500 20c.5-4 3.500-6 7.500-6s7 2 7.500 6',
  work: 'M4 8h16v11H4zM9 8V5.500h6V8M4 13h16',
  star: 'M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z',
  heart: 'M12 20C5 15 3 12 3 8.800A4.600 4.600 0 0 1 12 6.700a4.600 4.600 0 0 1 9 2.100c0 3.200-2 6.200-9 11.200z',
  home: 'M4 11l8-7 8 7M6 9.500V20h12V9.500M10 20v-5h4v5',
  gift: 'M4 9h16v4H4zM5.500 13v7h13v-7M12 9v11M12 9c-3 0-4.500-1-4.500-2.500S9 4 12 9zM12 9c3 0 4.500-1 4.500-2.500S15 4 12 9z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z',
  car: 'M4 16v-4l2-5h12l2 5v4zM4 16v2h3v-2M17 16v2h3v-2M7 12.500h.01M17 12.500h.01',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19c3-4 6-6 9-8',
  cal: 'M4 6.500h16V20H4zM4 11h16M8 4v4M16 4v4',
  tray: 'M3 13l2-8h14l2 8M3 13v6h18v-6M3 13h5l1 2h6l1-2h5',
  flag: 'M6 21V4M6 5c3-1.500 5 1.500 8 0s3-.5 4-1v8c-1 .5-2 1.500-4 1-3-1.500-5 1.500-8 0',
  done: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.500l3 3 5-6',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4.500 4.500',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14',
  chev: 'M9 6l6 6-6 6',
  check: 'M5 12.500l4.500 4.500L19 7',
  repeat: 'M17 3l3 3-3 3M4 11V9.500A3.500 3.500 0 0 1 7.500 6H20M7 21l-3-3 3-3M20 13v1.500a3.500 3.500 0 0 1-3.500 3.500H4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  tag: 'M3 12V4h8l9 9-8 8zM7.500 8h.01',
  link: 'M10 14a3.500 3.500 0 0 0 5 0l3-3a3.500 3.500 0 0 0-5-5l-1 1M14 10a3.500 3.500 0 0 0-5 0l-3 3a3.500 3.500 0 0 0 5 5l1-1',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  excl: 'M12 5v9M12 19h.01',
  sub: 'M5 5v8a3 3 0 0 0 3 3h10M14 12l4 4-4 4',
  x: 'M6 6l12 12M18 6L6 18',
}
const LIST_ICONS = ['list', 'cart', 'book', 'person', 'work', 'star', 'heart', 'home', 'gift', 'bulb', 'car', 'leaf']
const COLORS = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#5856d6', '#af52de', '#ff2d55', '#a2845e']
const Ico = ({ n, s = 20, fill = false, w = 2 }: any) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
)

/* ───────── 데이터 ───────── */
const SEED = () => [
  { id: 1, title: '마케팅팀 회의 자료 준비', notes: '', date: todayStr(), time: '15:00', done: false },
  { id: 2, title: '우유, 달걀 사기', notes: '', date: '', time: '', done: false },
  { id: 3, title: '엄마께 전화드리기', notes: '주말 일정 여쭤보기', date: todayStr(), time: '', done: true },
]
const LISTS0 = () => [
  { id: 'rem', name: '미리알림', color: '#007aff', icon: 'list' },
  { id: 'shop', name: '쇼핑', color: '#ff9500', icon: 'cart' },
  { id: 'school', name: '학교', color: '#34c759', icon: 'book' },
  { id: 'me', name: '개인', color: '#af52de', icon: 'person' },
  { id: 'work', name: '업무', color: '#ff3b30', icon: 'work' },
]
/* 기존 저장 데이터와 호환되도록 누락된 필드를 기본값으로 채움 */
const norm = (r: any) => ({
  notes: '', date: '', time: '', done: false, flag: false, pri: 0, tags: [], url: '', list: 'rem',
  subs: [], repeat: '', rN: 1, rU: 'day', deletedAt: 0, doneAt: 0, created: r.id || 0, ...r,
})
const SMART = [
  ['today', '오늘', '#007aff', 'cal', (r: any) => !r.done && r.date && r.date <= todayStr()],
  ['sched', '예정', '#ff3b30', 'cal', (r: any) => !r.done && r.date],
  ['all', '전체', '#3a3a3c', 'tray', (r: any) => !r.done],
  ['flag', '깃발 표시', '#ff9500', 'flag', (r: any) => !r.done && r.flag],
  ['done', '완료됨', '#8e8e93', 'done', (r: any) => r.done],
] as any[]
const PRI = ['없음', '낮음', '보통', '높음']
const SORTS: any = { manual: '추가한 순서', title: '제목', date: '날짜' }

const Sw = ({ on, onClick }: any) => <button className={`rm-sw ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={onClick}><i /></button>

export default function Reminders({ close }: any) {
  const [raw, setRaw] = usePersist('reminders', SEED)
  const [lists, setLists] = usePersist('reminders.lists', LISTS0)
  const [view, setView] = useState<string | null>(null)
  const [ed, setEd] = useState<any>(null)
  const [ls, setLs] = useState<any>(null)
  const [qa, setQa] = useState<string | null>(null)
  const [q, setQ] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [editLists, setEditLists] = useState(false)
  const [sel, setSel] = useState<number[] | null>(null)
  const [sort, setSort] = useState('manual')
  const [showDone, setShowDone] = useState(false)
  const [cf, setCf] = useState<any>(null)
  const [tagIn, setTagIn] = useState('')
  const [subIn, setSubIn] = useState('')

  const items = useMemo(() => raw.map(norm), [raw])
  const setItems = (fn: any) => setRaw((a: any[]) => fn(a.map(norm)))
  const live = items.filter((r: any) => !r.deletedAt)
  const trash = items.filter((r: any) => r.deletedAt)
  const L = (id: string) => lists.find((l: any) => l.id === id) || lists[0]
  const defList = lists[0]?.id

  /* 30일이 지난 삭제 항목 정리 */
  useEffect(() => {
    setRaw((a: any[]) => {
      const k = a.filter((r) => !(r.deletedAt && Date.now() - r.deletedAt > DAY30))
      return k.length === a.length ? a : k
    })
  }, [])

  const go = (v: string | null) => { setView(v); setSel(null); setMenu(false); setQ(null) }

  /* ── 동작 ── */
  const complete = (a: any[], id: number) => {
    const r = a.find((x) => x.id === id)
    if (!r) return a
    if (!r.done && r.repeat && r.date) {
      let nd = shift(r.date, r)
      for (let i = 0; i < 500 && nd < todayStr(); i++) nd = shift(nd, r)
      return [
        ...a.map((x) => (x.id === id ? { ...x, date: nd, subs: x.subs.map((s: any) => ({ ...s, done: false })) } : x)),
        { ...r, id: uid(), repeat: '', done: true, doneAt: Date.now() },
      ]
    }
    return a.map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: x.done ? 0 : Date.now() } : x))
  }
  const toggle = (id: number) => setItems((a: any[]) => complete(a, id))
  const toggleSub = (id: number, sid: number) => setItems((a: any[]) => a.map((r) => (r.id === id ? { ...r, subs: r.subs.map((s: any) => (s.id === sid ? { ...s, done: !s.done } : s)) } : r)))
  const del = (ids: number[]) => setItems((a: any[]) => a.map((r) => (ids.includes(r.id) ? { ...r, deletedAt: Date.now() } : r)))
  const restore = (ids: number[]) => setItems((a: any[]) => a.map((r) => (ids.includes(r.id) ? { ...r, deletedAt: 0, list: lists.some((l: any) => l.id === r.list) ? r.list : defList } : r)))
  const purge = (ids: number[]) => setItems((a: any[]) => a.filter((r) => !ids.includes(r.id)))
  const blank = (o: any = {}) => norm({ id: 0, title: '', list: defList, ...o })

  const curList = view?.startsWith('list:') ? L(view.slice(5)) : null
  const addDefaults = () => ({ list: curList ? curList.id : defList, date: view === 'today' ? todayStr() : '', flag: view === 'flag' })
  const quickAdd = () => {
    const t = (qa || '').trim()
    if (!t) return
    setItems((a: any[]) => [...a, norm({ id: uid(), title: t, created: Date.now(), ...addDefaults() })])
    setQa('')
  }
  const saveEd = () => {
    if (!ed.title.trim()) return setEd(null)
    const r = { ...ed, title: ed.title.trim(), subs: ed.subs.filter((s: any) => s.t.trim()), time: ed.date ? ed.time : '' }
    setItems((a: any[]) => (r.id ? a.map((x) => (x.id === r.id ? r : x)) : [...a, { ...r, id: uid(), created: Date.now() }]))
    setEd(null)
  }
  const openEd = (r: any) => { setTagIn(''); setSubIn(''); setEd(r) }
  const saveList = () => {
    const name = ls.name.trim() || '새로운 목록'
    setLists((a: any[]) => (ls.id ? a.map((l) => (l.id === ls.id ? { ...ls, name } : l)) : [...a, { ...ls, name, id: 'l' + uid() }]))
    setLs(null)
  }
  const delList = (id: string) => {
    const rest = lists.filter((l: any) => l.id !== id)
    setItems((a: any[]) => a.map((r) => (r.list === id && !r.deletedAt ? { ...r, deletedAt: Date.now(), list: rest[0].id } : r)))
    setLists(rest)
    setLs(null)
    if (view === 'list:' + id) go(null)
  }
  const ask = (msg: string, label: string, fn: any) => setCf({ msg, label, fn })

  /* ── 목록 구성 ── */
  const srt = (a: any, b: any) =>
    sort === 'title' ? a.title.localeCompare(b.title, 'ko')
      : sort === 'date' ? ((a.date || '9999') + (a.time || '99:99')).localeCompare((b.date || '9999') + (b.time || '99:99')) || a.created - b.created
        : a.created - b.created
  const byTime = (a: any, b: any) => (a.time || '').localeCompare(b.time || '') || a.created - b.created
  const sections = (): any[] => {
    const sm = SMART.find((s) => s[0] === view)
    let arr = sm ? live.filter(sm[4]) : curList ? live.filter((r: any) => r.list === curList.id && (showDone || !r.done)) : []
    if (view === 'done') return [{ h: '', rows: arr.sort((a: any, b: any) => b.doneAt - a.doneAt) }]
    if (view === 'today') {
      const t = todayStr()
      const hr = (r: any) => +r.time.split(':')[0]
      const od = arr.filter((r: any) => r.date < t).sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time))
      const td = arr.filter((r: any) => r.date === t)
      return [
        { h: '기한이 지난 항목', red: true, rows: od },
        { h: '종일', rows: td.filter((r: any) => !r.time).sort(srt) },
        { h: '오전', rows: td.filter((r: any) => r.time && hr(r) < 12).sort(byTime) },
        { h: '오후', rows: td.filter((r: any) => r.time && hr(r) >= 12 && hr(r) < 18).sort(byTime) },
        { h: '저녁', rows: td.filter((r: any) => r.time && hr(r) >= 18).sort(byTime) },
      ].filter((s) => s.rows.length)
    }
    if (view === 'sched') {
      const t = todayStr()
      const days = [...new Set(arr.map((r: any) => r.date))].sort() as string[]
      return [
        { h: '기한이 지난 항목', red: true, rows: arr.filter((r: any) => r.date < t).sort(srt) },
        ...days.filter((d) => d >= t).map((d) => ({ h: d === t ? '오늘' : dlong(d), rows: arr.filter((r: any) => r.date === d).sort(srt) })),
      ].filter((s) => s.rows.length)
    }
    arr = [...arr].sort(srt)
    if (curList && showDone) return [{ h: '', rows: arr.filter((r: any) => !r.done) }, { h: '완료됨', rows: arr.filter((r: any) => r.done) }].filter((s) => s.rows.length)
    return [{ h: '', rows: arr }]
  }

  /* ── 조각 ── */
  const Row = ({ r }: any) => {
    const c = L(r.list).color
    const late = !r.done && r.date && (r.date < todayStr() || (r.date === todayStr() && r.time && r.time < `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`))
    const picked = sel?.includes(r.id)
    const meta = [r.date && `${dl(r.date)}${r.time ? ' ' + tf(r.time) : ''}`, r.repeat && repLabel(r)].filter(Boolean).join(' · ')
    return (
      <div className="rm-row">
        <button className={`rm-chk ${r.done || picked ? 'on' : ''}`} style={{ borderColor: c, background: r.done || picked ? c : 'transparent' }} onClick={() => (sel ? setSel(picked ? sel.filter((i) => i !== r.id) : [...sel, r.id]) : toggle(r.id))} aria-label="완료">
          {(r.done || picked) && <Ico n="check" s={14} w={3.4} />}
        </button>
        <div className="rm-body" onClick={() => (sel ? setSel(picked ? sel.filter((i) => i !== r.id) : [...sel, r.id]) : openEd(r))}>
          <div className={`rm-t ${r.done ? 'done' : ''}`}>{r.pri > 0 && <b style={{ color: c }}>{'!'.repeat(r.pri)} </b>}{r.title}</div>
          {r.notes && <div className="rm-n">{r.notes}</div>}
          {(meta || r.tags.length > 0 || r.url || (view !== null && !curList)) && (
            <div className={`rm-d ${late ? 'late' : ''}`}>
              {meta}
              {view !== null && !curList && <span className="rm-ln" style={{ color: c }}> {meta ? '· ' : ''}{L(r.list).name}</span>}
              {r.tags.map((t: string) => <span className="rm-tg" key={t}> #{t}</span>)}
              {r.url && <span className="rm-tg"> · 링크</span>}
            </div>
          )}
          {r.subs.length > 0 && !sel && (
            <div className="rm-subs" onClick={(e) => e.stopPropagation()}>
              {r.subs.map((s: any) => (
                <div className="rm-sub" key={s.id}>
                  <button className="rm-chk sm" style={{ borderColor: c, background: s.done ? c : 'transparent' }} onClick={() => toggleSub(r.id, s.id)} aria-label="하위 항목 완료">{s.done && <Ico n="check" s={10} w={3.6} />}</button>
                  <span className={s.done ? 'done' : ''}>{s.t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {r.flag && <span className="rm-fl"><Ico n="flag" s={16} fill /></span>}
      </div>
    )
  }

  const Empty = ({ n, t }: any) => <div className="rm-empty"><Ico n={n} s={44} w={1.6} /><p>{t}</p></div>

  /* ═════════ 편집 화면 ═════════ */
  if (ed) {
    const set = (o: any) => setEd({ ...ed, ...o })
    const c = L(ed.list).color
    return (
      <div className="page gray rm">
        <div className="nav">
          <button onClick={() => setEd(null)}>취소</button>
          <b className="rm-nt">{ed.id ? '세부사항' : '새로운 미리알림'}</b>
          <button style={{ fontWeight: 600, opacity: ed.title.trim() ? 1 : .4 }} onClick={saveEd}>{ed.id ? '완료' : '추가'}</button>
        </div>
        <div className="rm-scroll">
          <div className="rm-card">
            <input autoFocus={!ed.id} placeholder="제목" value={ed.title} onChange={(e) => set({ title: e.target.value })} />
            <textarea placeholder="메모" value={ed.notes} onChange={(e) => set({ notes: e.target.value })} />
            <input className="rm-url" placeholder="URL" inputMode="url" value={ed.url} onChange={(e) => set({ url: e.target.value })} />
          </div>

          <div className="rm-card">
            <div className="rm-set"><i style={{ background: '#ff3b30' }}><Ico n="cal" s={17} /></i><span>날짜</span>
              <Sw on={!!ed.date} onClick={() => set(ed.date ? { date: '', time: '', repeat: '' } : { date: todayStr() })} /></div>
            {ed.date && <div className="rm-set sub"><span>{ed.date ? dl(ed.date) : ''}</span><input type="date" value={ed.date} onChange={(e) => e.target.value && set({ date: e.target.value })} /></div>}
            <div className="rm-set"><i style={{ background: '#007aff' }}><Ico n="clock" s={17} /></i><span>시간</span>
              <Sw on={!!ed.time} onClick={() => set(ed.time ? { time: '' } : { time: '09:00', date: ed.date || todayStr() })} /></div>
            {ed.time && <div className="rm-set sub"><span>{tf(ed.time)}</span><input type="time" value={ed.time} onChange={(e) => e.target.value && set({ time: e.target.value })} /></div>}
            <div className="rm-set"><i style={{ background: '#8e8e93' }}><Ico n="repeat" s={17} /></i><span>반복</span>
              <select disabled={!ed.date} value={ed.repeat} onChange={(e) => set({ repeat: e.target.value })}>
                {Object.keys(REP).map((k) => <option key={k} value={k}>{REP[k]}</option>)}
              </select></div>
            {ed.repeat === 'custom' && (
              <div className="rm-set sub"><span>반복 간격</span>
                <span className="rm-cust">
                  <input type="number" min={1} max={99} value={ed.rN} onChange={(e) => set({ rN: Math.max(1, Math.min(99, +e.target.value || 1)) })} />
                  <select value={ed.rU} onChange={(e) => set({ rU: e.target.value })}>{Object.keys(UNIT).map((k) => <option key={k} value={k}>{UNIT[k]}마다</option>)}</select>
                </span></div>
            )}
          </div>

          <div className="rm-card">
            <div className="rm-set"><i style={{ background: '#ff9500' }}><Ico n="flag" s={17} fill /></i><span>깃발 표시</span><Sw on={ed.flag} onClick={() => set({ flag: !ed.flag })} /></div>
            <div className="rm-set"><i style={{ background: '#ff3b30' }}><Ico n="excl" s={17} w={2.8} /></i><span>우선순위</span>
              <span className="rm-seg">{PRI.map((p, i) => <button key={p} className={ed.pri === i ? 'on' : ''} onClick={() => set({ pri: i })}>{p}</button>)}</span></div>
            <div className="rm-set"><i style={{ background: c }}><Ico n="folder" s={17} /></i><span>목록</span>
              <select value={ed.list} onChange={(e) => set({ list: e.target.value })}>{lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
            <div className="rm-set tags"><i style={{ background: '#5856d6' }}><Ico n="tag" s={17} /></i>
              <div className="rm-chips">
                {ed.tags.map((t: string) => <button key={t} onClick={() => set({ tags: ed.tags.filter((x: string) => x !== t) })}>#{t} ×</button>)}
                <input placeholder="태그 추가" value={tagIn} onChange={(e) => setTagIn(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && tagIn) { e.preventDefault(); if (!ed.tags.includes(tagIn)) set({ tags: [...ed.tags, tagIn] }); setTagIn('') } }}
                  onBlur={() => { if (tagIn) { if (!ed.tags.includes(tagIn)) set({ tags: [...ed.tags, tagIn] }); setTagIn('') } }} />
              </div></div>
          </div>

          <div className="rm-card">
            {ed.subs.map((s: any) => (
              <div className="rm-set sb" key={s.id}>
                <button className="rm-chk sm" style={{ borderColor: c, background: s.done ? c : 'transparent' }} onClick={() => set({ subs: ed.subs.map((x: any) => (x.id === s.id ? { ...x, done: !x.done } : x)) })} aria-label="하위 항목 완료">{s.done && <Ico n="check" s={10} w={3.6} />}</button>
                <input value={s.t} onChange={(e) => set({ subs: ed.subs.map((x: any) => (x.id === s.id ? { ...x, t: e.target.value } : x)) })} />
                <button className="rm-x" onClick={() => set({ subs: ed.subs.filter((x: any) => x.id !== s.id) })} aria-label="하위 항목 삭제"><Ico n="x" s={16} /></button>
              </div>
            ))}
            <div className="rm-set sb">
              <span className="rm-plus"><Ico n="plus" s={14} w={3} /></span>
              <input placeholder="하위 항목 추가" value={subIn} onChange={(e) => setSubIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && subIn.trim()) { set({ subs: [...ed.subs, { id: uid(), t: subIn.trim(), done: false }] }); setSubIn('') } }}
                onBlur={() => { if (subIn.trim()) { set({ subs: [...ed.subs, { id: uid(), t: subIn.trim(), done: false }] }); setSubIn('') } }} />
            </div>
          </div>
          <p className="rm-fine">시뮬레이터 안의 앱이라 알림은 실제로 울리지 않아요.</p>
          {ed.id > 0 && <button className="rm-del" onClick={() => { del([ed.id]); setEd(null) }}>미리알림 삭제</button>}
        </div>
      </div>
    )
  }

  /* ═════════ 홈 / 목록 화면 ═════════ */
  const isTrash = view === 'trash'
  const sm = SMART.find((s) => s[0] === view)
  const title = isTrash ? '최근 삭제됨' : sm ? sm[1] : curList ? curList.name : '미리알림'
  const tc = isTrash ? '#8e8e93' : sm ? sm[2] : curList ? curList.color : '#000'
  const secs = view && !isTrash ? sections() : []
  const total = secs.reduce((n, s) => n + s.rows.length, 0)
  const match = (r: any) => { const k = (q || '').trim().toLowerCase(); return k && [r.title, r.notes, ...r.tags, ...r.subs.map((s: any) => s.t)].some((x: string) => x.toLowerCase().includes(k)) }
  const found = q !== null ? live.filter(match).sort((a: any, b: any) => a.created - b.created) : []
  const cnt = (f: any) => live.filter(f).length

  const MenuItem = ({ n, t, on, onClick, red }: any) => <button className={red ? 'red' : ''} onClick={() => { setMenu(false); onClick() }}><span>{t}</span>{on ? <Ico n="check" s={17} w={2.6} /> : n ? <Ico n={n} s={18} /> : null}</button>

  return (
    <div className="page gray rm">
      <div className="nav">
        {view ? <Back onClick={() => go(null)}>목록</Back> : <button onClick={close}>완료</button>}
        {sel ? <button style={{ fontWeight: 600 }} onClick={() => setSel(null)}>완료</button> : (
          <span className="rm-ni">
            {!view && <button onClick={() => setQ(q === null ? '' : null)} aria-label="검색"><Ico n="search" s={22} /></button>}
            <button onClick={() => setMenu(!menu)} aria-label="더 보기"><span className="rm-mi"><Ico n="more" s={20} w={3.4} /></span></button>
          </span>
        )}
      </div>

      <div className="rm-scroll">
        {q !== null ? (
          <>
            <div className="rm-sbar"><Ico n="search" s={16} /><input autoFocus placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} /><button onClick={() => setQ(null)}>취소</button></div>
            {q.trim() === '' ? <Empty n="search" t="제목, 메모, 태그로 검색해 보세요" />
              : found.length === 0 ? <Empty n="search" t="결과 없음" />
                : <div className="rm-card list">{found.map((r: any) => <Row key={r.id} r={r} />)}</div>}
          </>
        ) : !view ? (
          <>
            <h1>미리알림</h1>
            <div className="rm-grid">
              {SMART.map(([id, name, c, ic, f]) => (
                <button key={id} onClick={() => go(id)}>
                  <i style={{ background: c }}>{id === 'today' ? <b>{new Date().getDate()}</b> : <Ico n={ic} s={20} fill={id === 'flag'} />}</i>
                  <em>{cnt(f)}</em><span>{name}</span>
                </button>
              ))}
              <button onClick={() => go('trash')}><i style={{ background: '#8e8e93' }}><Ico n="trash" s={20} /></i><em>{trash.length}</em><span>최근 삭제됨</span></button>
            </div>
            <h2>나의 목록</h2>
            <div className="rm-card list">
              {lists.map((l: any) => (
                <div className="rm-li" key={l.id}>
                  {editLists && <button className="rm-minus" onClick={() => ask(`“${l.name}” 목록과 포함된 미리알림을 삭제할까요? 삭제된 항목은 최근 삭제됨에서 복구할 수 있어요.`, '목록 삭제', () => delList(l.id))} disabled={lists.length < 2} aria-label="목록 삭제">−</button>}
                  <button className="rm-lb" onClick={() => (editLists ? setLs(l) : go('list:' + l.id))}>
                    <i style={{ background: l.color }}><Ico n={l.icon} s={18} /></i>
                    <span>{l.name}</span>
                    <em>{cnt((r: any) => r.list === l.id && !r.done)}</em>
                    <Ico n={editLists ? 'more' : 'chev'} s={16} w={editLists ? 3 : 2.4} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : isTrash ? (
          <>
            <h1 style={{ color: tc }}>{title}</h1>
            <p className="rm-fine l">삭제한 미리알림은 30일 동안 보관된 뒤 자동으로 정리돼요.</p>
            {trash.length === 0 ? <Empty n="trash" t="삭제한 미리알림이 없어요" /> : (
              <div className="rm-card list">
                {trash.sort((a: any, b: any) => b.deletedAt - a.deletedAt).map((r: any) => (
                  <div className="rm-row" key={r.id}>
                    <div className="rm-body"><div className="rm-t">{r.title}</div>
                      <div className="rm-d">{L(r.list).name} · {Math.max(0, 30 - Math.floor((Date.now() - r.deletedAt) / 864e5))}일 남음</div></div>
                    <button className="rm-ab" onClick={() => restore([r.id])}>복구</button>
                    <button className="rm-ab red" onClick={() => ask(`“${r.title}”을(를) 영구 삭제할까요?`, '영구 삭제', () => purge([r.id]))}>삭제</button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h1 style={{ color: tc }}>{title}{!sel && total > 0 && <small>{total}</small>}</h1>
            {total === 0 ? <Empty n={sm ? sm[3] : 'list'} t={view === 'done' ? '완료된 미리알림이 없어요' : '미리알림 없음'} /> : secs.map((s) => (
              <section key={s.h || 'x'}>
                {s.h && <h3 className={s.red ? 'late' : ''}>{s.h}</h3>}
                <div className="rm-card list">{s.rows.map((r: any) => <Row key={r.id} r={r} />)}</div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* 하단 */}
      {sel ? (
        <div className="rm-bar">
          <button onClick={() => setSel(sel.length === total ? [] : secs.flatMap((s) => s.rows.map((r: any) => r.id)))}>{sel.length === total && total > 0 ? '선택 해제' : '모두 선택'}</button>
          <button disabled={!sel.length} onClick={() => { setItems((a: any[]) => sel.reduce(complete, a.map((r) => (r.done ? r : r)))); setSel(null) }}>완료 ({sel.length})</button>
          <button className="red" disabled={!sel.length} onClick={() => ask(`선택한 미리알림 ${sel.length}개를 삭제할까요?`, '삭제', () => { del(sel); setSel(null) })}>삭제</button>
        </div>
      ) : isTrash ? (
        trash.length > 0 && <div className="rm-bar">
          <button onClick={() => restore(trash.map((r: any) => r.id))}>모두 복구</button>
          <button className="red" onClick={() => ask('최근 삭제된 항목을 모두 영구 삭제할까요?', '모두 삭제', () => purge(trash.map((r: any) => r.id)))}>모두 삭제</button>
        </div>
      ) : q === null && view !== 'done' && (
        <div className="rm-fab">
          <button className="rm-new" onClick={() => setQa('')}><i><Ico n="plus" s={15} w={3.4} /></i>새로운 미리알림</button>
          {!view && <button className="rm-newl" onClick={() => setLs({ id: '', name: '', color: COLORS[5], icon: 'list' })}>목록 추가</button>}
        </div>
      )}

      {/* 메뉴 */}
      {menu && (
        <>
          <div className="rm-dim clear" onClick={() => setMenu(false)} />
          <div className="rm-menu">
            {!view && <>
              <MenuItem n="plus" t="새로운 목록" onClick={() => setLs({ id: '', name: '', color: COLORS[5], icon: 'list' })} />
              <MenuItem n="list" t={editLists ? '목록 편집 완료' : '목록 편집'} onClick={() => setEditLists(!editLists)} />
              <MenuItem n="trash" t="최근 삭제됨" onClick={() => go('trash')} />
            </>}
            {view && !isTrash && <>
              <MenuItem n="check" t="미리알림 선택" onClick={() => setSel([])} />
              {Object.keys(SORTS).map((k) => <MenuItem key={k} t={`정렬: ${SORTS[k]}`} on={sort === k} onClick={() => setSort(k)} />)}
              {curList && <MenuItem t={showDone ? '완료된 항목 숨기기' : '완료된 항목 보기'} onClick={() => setShowDone(!showDone)} />}
              {curList && <MenuItem n="more" t="목록 정보 보기" onClick={() => setLs(curList)} />}
            </>}
            {isTrash && <MenuItem t="뒤로" onClick={() => go(null)} />}
          </div>
        </>
      )}

      {/* 빠른 추가 */}
      {qa !== null && (
        <div className="rm-dim" onClick={() => setQa(null)}>
          <div className="rm-qa" onClick={(e) => e.stopPropagation()}>
            <input autoFocus placeholder="새로운 미리알림" value={qa} onChange={(e) => setQa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && quickAdd()} />
            <div>
              <button onClick={() => { const t = qa; setQa(null); openEd(blank({ title: t, ...addDefaults() })) }}>세부사항</button>
              <button className="go" disabled={!qa.trim()} onClick={quickAdd}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 편집 시트 */}
      {ls && (
        <div className="rm-dim" onClick={() => setLs(null)}>
          <div className="rm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="rm-sh-h"><button onClick={() => setLs(null)}>취소</button><b>{ls.id ? '목록 정보' : '새로운 목록'}</b><button style={{ fontWeight: 600 }} onClick={saveList}>완료</button></div>
            <div className="rm-pv" style={{ background: ls.color }}><Ico n={ls.icon} s={40} /></div>
            <input className="rm-nm" style={{ color: ls.color }} placeholder="목록 이름" value={ls.name} onChange={(e) => setLs({ ...ls, name: e.target.value })} />
            <div className="rm-pick">{COLORS.map((c) => <button key={c} className={ls.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setLs({ ...ls, color: c })} aria-label="색상" />)}</div>
            <div className="rm-pick ic">{LIST_ICONS.map((n) => <button key={n} className={ls.icon === n ? 'on' : ''} onClick={() => setLs({ ...ls, icon: n })} aria-label={n}><Ico n={n} s={22} /></button>)}</div>
            {ls.id && lists.length > 1 && <button className="rm-del in" onClick={() => ask(`“${ls.name}” 목록과 포함된 미리알림을 삭제할까요?`, '목록 삭제', () => delList(ls.id))}>목록 삭제</button>}
          </div>
        </div>
      )}

      {/* 확인 시트 */}
      {cf && (
        <div className="rm-dim" onClick={() => setCf(null)}>
          <div className="rm-ask" onClick={(e) => e.stopPropagation()}>
            <p>{cf.msg}</p>
            <button className="red" onClick={() => { const f = cf.fn; setCf(null); f() }}>{cf.label}</button>
            <button onClick={() => setCf(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}
