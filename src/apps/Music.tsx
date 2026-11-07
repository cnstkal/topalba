import { useEffect, useRef, useState } from 'react'
import { SONGS, dev, useDevice, useTick } from '../engine/device'
import './music.css'

/* ───────── SVG 아이콘 (이모지·텍스트 기호 미사용) ───────── */
const FILL = {
  play: 'M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z',
  pause: 'M7 4.5h3.4v15H7zM13.6 4.5H17v15h-3.6z',
  next: 'M5 5.5v13l9-6.5zM15.5 5.5H19v13h-3.5z',
  prev: 'M19 5.5v13l-9-6.5zM8.5 5.5H5v13h3.5z',
  heartF: 'M12 21l-1.4-1.3C5.4 15.1 2 12.1 2 8.4 2 5.4 4.4 3 7.4 3c1.7 0 3.4.8 4.6 2.1C13.2 3.8 14.9 3 16.6 3 19.6 3 22 5.4 22 8.4c0 3.7-3.4 6.7-8.6 11.3z',
}
const STR = {
  heart: 'M12 21l-1.4-1.3C5.4 15.1 2 12.1 2 8.4 2 5.4 4.4 3 7.4 3c1.7 0 3.4.8 4.6 2.1C13.2 3.8 14.9 3 16.6 3 19.6 3 22 5.4 22 8.4c0 3.7-3.4 6.7-8.6 11.3z',
  shuffle: 'M3 7h3.5c5 0 5 10 10 10H21M3 17h3.5c1.6 0 2.8-.8 3.8-2M21 7h-4.5c-1.5 0-2.7.7-3.6 1.8M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5',
  repeat: 'M17 3l3 3-3 3M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20M7 21l-3-3 3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4',
  repeat1: 'M17 3l3 3-3 3M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20M7 21l-3-3 3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4M11 10.5l1.5-1v6',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5',
  queue: 'M3 6h12M3 11h12M3 16h6M15 14.5v6l5-3z',
  list: 'M4 6h16M4 12h16M4 18h10',
  lyrics: 'M4 5h16v11H9l-5 4zM8.5 9.5h7M8.5 12.5h4',
  chevD: 'M6 9l6 6 6-6',
  chevU: 'M6 15l6-6 6 6',
  chevR: 'M9 6l6 6-6 6',
  back: 'M15 5l-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  edit: 'M4 20h4l11-11-4-4L4 16zM13 7l4 4',
  close: 'M6 6l12 12M18 6L6 18',
  listen: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10.5 8.5v7l5.5-3.5z',
  browse: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  radio: 'M12 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8.5 9.5a5 5 0 0 0 0 7M15.5 9.5a5 5 0 0 1 0 7M5.5 6.5a9 9 0 0 0 0 13M18.5 6.5a9 9 0 0 1 0 13',
  library: 'M4 4h4v16H4zM10 4h4v16h-4zM15.5 6l3.8-1 3.2 14-3.8 1z',
  note: 'M9 18V5.5l11-2V16M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  album: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
}
function Ic({ n, s = 24 }) {
  const f = FILL[n]
  return (
    <svg className="music-ic" width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" fill={f ? 'currentColor' : 'none'} stroke={f ? 'none' : 'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={f || STR[n]} />
    </svg>
  )
}

/* ───────── 앨범 커버 (자체 제작 SVG, 항상 정사각형) ───────── */
const PAL = [['#fa233b', '#150f10'], ['#17171a', '#fa233b'], ['#f3e9dc', '#c1121f'], ['#0b132b', '#5bc0be'], ['#ffd166', '#6a1b9a'], ['#e9e9ee', '#111114'], ['#2d6a4f', '#f1faee'], ['#ff7b54', '#2b2d42']]
function Cover({ seed = 0, color = '#ffd1dc', label = '' }) {
  const [a, b] = PAL[seed % PAL.length]
  const c = color
  const k = seed % 8
  let art = null
  if (k === 0) art = <><circle cx="50" cy="56" r="31" fill={b} /><circle cx="50" cy="56" r="12" fill={c} /></>
  else if (k === 1) art = <>{[44, 36, 28, 20].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={b} strokeWidth="1.2" />)}<circle cx="50" cy="50" r="9" fill={c} /><circle cx="50" cy="50" r="1.6" fill={a} /></>
  else if (k === 2) art = <>{[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={-20 + i * 20} y="-20" width="9" height="140" fill={i % 2 ? c : b} transform="rotate(25 50 50)" />)}</>
  else if (k === 3) art = <>{[42, 32, 22, 12].map((r, i) => <path key={r} d={`M${50 - r} 84A${r} ${r} 0 0 1 ${50 + r} 84z`} fill={i % 2 ? c : b} />)}</>
  else if (k === 4) art = <>{Array.from({ length: 25 }).map((_, n) => <circle key={n} cx={(n % 5) * 18 + 14} cy={Math.floor(n / 5) * 18 + 14} r={2 + ((n * 7) % 5) * 1.6} fill={n % 3 ? b : c} />)}</>
  else if (k === 5) art = <>{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M0 ${22 + i * 10}Q25 ${12 + i * 10} 50 ${22 + i * 10}T100 ${22 + i * 10}`} fill="none" stroke={i % 2 ? c : b} strokeWidth="2.2" />)}</>
  else if (k === 6) art = <><rect x="14" y="14" width="40" height="40" fill={b} /><circle cx="66" cy="60" r="24" fill={c} /><path d="M14 90L40 58L66 90z" fill={b} opacity=".85" /></>
  else art = <><text x="6" y="78" fontSize="84" fontWeight="800" fill={b}>{label.slice(0, 1)}</text><circle cx="78" cy="24" r="10" fill={c} /></>
  return (
    <svg className="music-cover" viewBox="0 0 100 100" role="img" aria-label={label}>
      <rect width="100" height="100" fill={a} />
      {art}
      {label && k !== 7 && <text x="7" y="94" fontSize="6.5" fontWeight="700" fill={k === 2 || k === 5 ? a : b} stroke={k === 2 ? b : 'none'} strokeWidth=".3">{label}</text>}
    </svg>
  )
}

/* ───────── 데이터 (기존 SONGS와 연결) ───────── */
const songCover = (i) => <Cover seed={i} color={SONGS[i][2]} label={SONGS[i][0]} />
const ALBUMS = [
  { id: 'a0', title: '하루의 끝', artist: '다양한 아티스트', year: 2025, songs: [0, 1, 2], seed: 1, color: '#fa233b' },
  { id: 'a1', title: '도시의 주말', artist: '다양한 아티스트', year: 2026, songs: [3, 4], seed: 3, color: '#5bc0be' },
  ...SONGS.map((s, i) => ({ id: `s${i}`, title: s[0], artist: s[1], year: 2022 + i, songs: [i], seed: i, color: s[2] })),
]
const albumOf = (id) => ALBUMS.find((a) => a.id === id)
const albumCover = (a) => <Cover seed={a.seed} color={a.color} label={a.title} />
const ARTISTS = [...new Set(SONGS.map((s) => s[1]))].map((name, k) => ({ name, seed: k + 2, songs: SONGS.flatMap((s, i) => (s[1] === name ? [i] : [])) }))
const GENRES = [
  { n: '인디', songs: [0, 2], seed: 2 }, { n: '팝', songs: [1, 3], seed: 4 }, { n: '재즈', songs: [2, 4], seed: 3 },
  { n: '일렉트로닉', songs: [4, 1], seed: 1 }, { n: '발라드', songs: [0, 3], seed: 0 }, { n: '알앤비', songs: [1, 2], seed: 7 },
]
const STATIONS = {
  rec: [{ n: '저녁 산책 라디오', songs: [0, 2, 1], seed: 0 }, { n: '퇴근길 스테이션', songs: [1, 4, 3], seed: 1 }, { n: '밤의 라디오', songs: [2, 0, 4], seed: 3 }],
  popular: [{ n: '지금 인기 라디오', songs: [3, 1, 0, 4], seed: 5 }, { n: '주말 오후 라디오', songs: [3, 4, 0], seed: 4 }],
  mix: [{ n: '나의 믹스 1', songs: [2, 4, 1], seed: 6 }, { n: '나의 믹스 2', songs: [0, 3, 2], seed: 7 }, { n: '나의 믹스 3', songs: [4, 0, 1], seed: 2 }],
}
const LYRICS = {
  '저녁 산책': ['해가 천천히 기울어 가는 길', '가로등이 하나둘 눈을 뜨고', '발걸음은 느리게 따라오는데', '오늘 하루도 잘 지나갔다고', '바람이 조용히 말해 주네', '돌아가는 길이 길어도 좋아', '이 저녁이 끝나지 않기를'],
  '퇴근길': ['붐비는 정류장 사이로', '하루의 무게를 내려놓고', '창밖엔 도시가 흘러가고', '이어폰 속 노래만 선명해', '조금만 더 가면 집이야', '오늘도 수고했다는 한마디'],
  '조용한 밤': ['모두가 잠든 시간에 깨어', '희미한 불빛 아래 앉아', '생각은 천천히 가라앉고', '고요가 이불처럼 덮여 와', '아무 말 없이 눈을 감아', '내일은 조금 가벼울 거야'],
  '주말 오후': ['늦은 아침 커튼 사이로', '느슨하게 번지는 햇살', '커피 향이 방 안에 퍼지고', '아무 약속도 없는 오후', '천천히 흘러가는 구름처럼', '오늘은 그냥 이대로 좋아'],
  '도시의 불빛': ['높은 빌딩 사이 반짝이는 창', '밤이 되면 더 환해지는 거리', '모두 어딘가로 향해 가는데', '나는 잠시 멈춰 서서 바라봐', '수많은 불빛 중 하나가', '나를 기다리고 있을지도 몰라'],
}
const lyricsOf = (i) => LYRICS[SONGS[i][0]] || ['가사 정보가 없습니다']
const POP = ['저녁 산책', '퇴근길', '조용한 밤', '가상 아티스트 A', '도시의 불빛']

/* ───────── 저장소 (localStorage, 새로고침 후 유지) ───────── */
const LS = 'music-app-v1'
const DEF = {
  playlists: [
    { id: 'fav', name: '즐겨찾는 노래', auto: 'likes' },
    { id: 'recent', name: '최근 재생한 음악', auto: 'recent' },
    { id: 'p1', name: '나만의 플레이리스트', songs: [0, 2] },
    { id: 'p2', name: '출근길', songs: [1, 4] },
    { id: 'p3', name: '새벽 감성', songs: [2, 0] },
    { id: 'p4', name: '반복 재생', songs: [3, 1, 0] },
  ],
  likes: [0], recents: [], queue: SONGS.map((_, i) => i), searches: ['저녁 산책', '퇴근길'], repeat: 0, shuffle: false, downloads: [0, 3],
}
let ms = (() => {
  try {
    const r = JSON.parse(localStorage.getItem(LS))
    if (r && typeof r === 'object') return { ...DEF, ...r }
  } catch (e) { /* 손상된 값은 기본값 사용 */ }
  return { ...DEF }
})()
const subs = new Set()
function setMs(p) {
  ms = { ...ms, ...(typeof p === 'function' ? p(ms) : p) }
  try { localStorage.setItem(LS, JSON.stringify(ms)) } catch (e) { /* 저장 불가 환경 */ }
  subs.forEach((f) => f())
}
function useMs() {
  const [, set] = useState(0)
  useEffect(() => {
    const f = () => set((n) => n + 1)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return ms
}
const ok = (l) => (l || []).filter((i) => SONGS[i])
const plSongs = (p) => ok(p.auto === 'likes' ? ms.likes : p.auto === 'recent' ? ms.recents : p.songs)
const toggleLike = (i) => setMs((x) => ({ likes: x.likes.includes(i) ? x.likes.filter((j) => j !== i) : [i, ...x.likes] }))
const toggleDl = (i) => setMs((x) => ({ downloads: x.downloads.includes(i) ? x.downloads.filter((j) => j !== i) : [...x.downloads, i] }))
const inPl = (p, i) => plSongs(p).includes(i)
const togglePl = (pid, i) => {
  if (pid === 'fav') return toggleLike(i)
  setMs((x) => ({ playlists: x.playlists.map((p) => (p.id !== pid || p.auto ? p : { ...p, songs: p.songs.includes(i) ? p.songs.filter((j) => j !== i) : [...p.songs, i] })) }))
}
const newPl = (name, song) => setMs((x) => ({ playlists: [...x.playlists, { id: `p${Date.now()}`, name, songs: song != null ? [song] : [] }] }))

/* ───────── 재생 제어: 전역 플레이어(dev) 위에서 큐만 관리 ───────── */
const shuf = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
function playAll(list, shuffle) {
  list = ok(list)
  if (!list.length) return
  const q = shuffle ? shuf(list) : list
  setMs({ queue: q, shuffle: !!shuffle })
  dev.play(q[0])
}
function playAt(list, i) {
  list = ok(list)
  const q = ms.shuffle ? [i, ...shuf(list.filter((j) => j !== i))] : list.includes(i) ? list : [i, ...list]
  setMs({ queue: q })
  dev.play(i)
}
function step(d) {
  const cur = dev.song().cur
  const q = ms.queue
  const k = q.indexOf(cur)
  if (k < 0 || !q.length) return dev.next(d)
  dev.play(q[(k + d + q.length) % q.length])
}
const prevSong = () => (dev.pos() > 3 ? dev.seek(0) : step(-1))
function toggleShuffle() {
  const sh = !ms.shuffle
  const cur = dev.song().cur
  const rest = ms.queue.filter((i) => i !== cur)
  setMs({ shuffle: sh, queue: sh ? (cur === null ? shuf(ms.queue) : [cur, ...shuf(rest)]) : [...ms.queue].sort((a, b) => a - b) })
}
/* 곡 끝 처리: 한 곡 반복·큐 순서를 따르기 위해 device.js의 순차 이동보다 먼저 개입 */
if (typeof window !== 'undefined') {
  if (window.__musicQ) clearInterval(window.__musicQ)
  window.__musicQ = setInterval(() => {
    const s = dev.song()
    if (s.cur === null || !s.play) return
    if (dev.pos() >= SONGS[s.cur][3] - 0.35) (ms.repeat ? dev.play(s.cur) : step(1))
  }, 200)
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

/* ───────── 공통 UI ───────── */
const Sec = ({ title, more, children }) => (
  <div className="music-sec">
    <div className="music-sech"><b>{title}</b>{more && <button onClick={more}>모두 보기</button>}</div>
    {children}
  </div>
)
const Nav = ({ back, right }) => (
  <div className="music-nav">
    <button className="music-back" onClick={back}><Ic n="back" s={22} /><span>뒤로</span></button>
    {right}
  </div>
)
function PlCover({ list }) {
  const l = ok(list)
  if (!l.length) return <div className="music-empty"><Ic n="note" s={40} /></div>
  if (l.length < 4) return songCover(l[0])
  return <div className="music-mosaic">{l.slice(0, 4).map((i) => <div key={i}>{songCover(i)}</div>)}</div>
}
function SongRow({ i, list, ask, rank, right }) {
  const { cur } = dev.song()
  return (
    <div className={`music-row ${cur === i ? 'on' : ''}`} onClick={() => playAt(list, i)}>
      {rank != null && <div className="music-rank">{rank}</div>}
      <div className="music-thumb">{songCover(i)}</div>
      <div className="music-rowt"><b>{SONGS[i][0]}</b><span>{SONGS[i][1]}</span></div>
      {right || (ask && <button className="music-ibtn" aria-label="플레이리스트에 추가" onClick={(e) => { e.stopPropagation(); ask({ kind: 'addto', song: i }) }}><Ic n="plus" s={20} /></button>)}
    </div>
  )
}
const SongCard = ({ i, list }) => (
  <button className="music-card" onClick={() => playAt(list, i)}>{songCover(i)}<b>{SONGS[i][0]}</b><span>{SONGS[i][1]}</span></button>
)
const AlbumCard = ({ al, go }) => (
  <button className="music-card" onClick={() => go({ t: 'album', id: al.id })}>{albumCover(al)}<b>{al.title}</b><span>{al.artist}</span></button>
)
const PlCard = ({ p, go }) => (
  <button className="music-card" onClick={() => go({ t: 'pl', id: p.id })}><PlCover list={plSongs(p)} /><b>{p.name}</b><span>{plSongs(p).length}곡</span></button>
)
const StCard = ({ s, go }) => (
  <button className="music-card" onClick={() => go({ t: 'songs', title: s.n, list: s.songs })}><Cover seed={s.seed} color={SONGS[s.songs[0]][2]} label={s.n} /><b>{s.n}</b><span>{s.songs.length}곡</span></button>
)
const Acts = ({ list }) => (
  <div className="music-act">
    <button onClick={() => playAll(list, false)}><Ic n="play" s={20} />재생</button>
    <button onClick={() => playAll(list, true)}><Ic n="shuffle" s={20} />셔플</button>
  </div>
)

/* ───────── 탭 화면 ───────── */
function Listen({ go, ask }) {
  const m = useMs()
  const recents = ok(m.recents)
  const rc = recents.length ? recents : [0, 1, 2]
  return (
    <>
      <div className="music-title">지금 듣기</div>
      <Sec title="최근 재생한 음악"><div className="music-h">{rc.map((i) => <SongCard key={i} i={i} list={rc} />)}</div></Sec>
      <Sec title="추천 플레이리스트"><div className="music-h">{m.playlists.map((p) => <PlCard key={p.id} p={p} go={go} />)}</div></Sec>
      <Sec title="자주 듣는 앨범"><div className="music-h">{ALBUMS.slice(0, 4).map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>
      <Sec title="최근 추가된 음악"><div className="music-h">{[...SONGS.keys()].reverse().map((i) => <SongCard key={i} i={i} list={[...SONGS.keys()].reverse()} />)}</div></Sec>
      <Sec title="취향에 맞는 추천 음악"><div className="music-h">{[2, 4, 1, 3].map((i) => <SongCard key={i} i={i} list={[2, 4, 1, 3]} />)}</div></Sec>
      <Sec title="최근 재생한 곡">{rc.slice(0, 5).map((i) => <SongRow key={i} i={i} list={rc} ask={ask} />)}</Sec>
    </>
  )
}
function Browse({ go, ask }) {
  const m = useMs()
  const chart = [3, 1, 0, 4, 2]
  const fresh = [4, 3, 2, 1, 0]
  return (
    <>
      <div className="music-title">둘러보기</div>
      <Sec title="인기 차트">{chart.map((i, r) => <SongRow key={i} i={i} list={chart} rank={r + 1} ask={ask} />)}</Sec>
      <Sec title="최신 음악"><div className="music-h">{fresh.map((i) => <SongCard key={i} i={i} list={fresh} />)}</div></Sec>
      <Sec title="인기 플레이리스트" more={() => go({ t: 'pls' })}><div className="music-h">{m.playlists.slice(0, 4).map((p) => <PlCard key={p.id} p={p} go={go} />)}</div></Sec>
      <Sec title="장르별 음악">
        <div className="music-h">{GENRES.map((g) => (
          <button key={g.n} className="music-genre" onClick={() => go({ t: 'songs', title: g.n, list: g.songs })}><Cover seed={g.seed} color={SONGS[g.songs[0]][2]} /><b>{g.n}</b></button>
        ))}</div>
      </Sec>
      <Sec title="추천 앨범" more={() => go({ t: 'albums', title: '추천 앨범', ids: ALBUMS.map((a) => a.id) })}><div className="music-h">{ALBUMS.slice(0, 5).map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>
      <Sec title="신규 발매 음악"><div className="music-h">{[...ALBUMS].reverse().slice(0, 5).map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>
    </>
  )
}
function Radio({ go }) {
  const row = (title, arr) => (
    <Sec title={title}><div className="music-h">{arr.map((s) => <StCard key={s.n} s={s} go={go} />)}</div></Sec>
  )
  return (
    <>
      <div className="music-title">라디오</div>
      {row('추천 라디오', STATIONS.rec)}
      <Sec title="장르별 라디오"><div className="music-h">{GENRES.map((g) => <StCard key={g.n} s={{ n: `${g.n} 라디오`, songs: g.songs, seed: g.seed }} go={go} />)}</div></Sec>
      {row('인기 라디오', STATIONS.popular)}
      {row('개인화된 음악 믹스', STATIONS.mix)}
    </>
  )
}
function Library({ go }) {
  const m = useMs()
  const items = [
    ['playlist', '플레이리스트', 'list', { t: 'pls' }], ['artist', '아티스트', 'person', { t: 'artists' }], ['album', '앨범', 'album', { t: 'albums', title: '앨범', ids: ALBUMS.map((a) => a.id) }],
    ['song', '노래', 'note', { t: 'songs', title: '노래', list: [...SONGS.keys()] }], ['new', '최근 추가된 음악', 'clock', { t: 'songs', title: '최근 추가된 음악', list: [...SONGS.keys()].reverse() }],
    ['dl', '다운로드한 음악', 'download', { t: 'songs', title: '다운로드한 음악', list: ok(m.downloads) }],
  ]
  return (
    <>
      <div className="music-title">보관함</div>
      {items.map(([k, label, ic, v]) => (
        <button key={k} className="music-lib" onClick={() => go(v)}><Ic n={ic} s={24} /><span>{label}</span><Ic n="chevR" s={18} /></button>
      ))}
      <Sec title="최근 추가된 음악"><div className="music-h" style={{ paddingTop: 14 }}>{ALBUMS.slice(0, 5).map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>
    </>
  )
}
function Search({ go, ask, q, setQ }) {
  const m = useMs()
  const t = q.trim().toLowerCase()
  const has = (s) => s.toLowerCase().includes(t)
  const commit = () => t && setMs((x) => ({ searches: [q.trim(), ...x.searches.filter((s) => s !== q.trim())].slice(0, 8) }))
  const songs = t ? [...SONGS.keys()].filter((i) => has(SONGS[i][0]) || has(SONGS[i][1])) : []
  const albums = t ? ALBUMS.filter((a) => has(a.title) || has(a.artist)) : []
  const artists = t ? ARTISTS.filter((a) => has(a.name)) : []
  const pls = t ? m.playlists.filter((p) => has(p.name)) : []
  const none = t && !songs.length && !albums.length && !artists.length && !pls.length
  return (
    <>
      <div className="music-title">검색</div>
      <div className="music-search">
        <Ic n="search" s={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder="아티스트, 노래, 앨범, 플레이리스트" />
        {q && <button className="music-ibtn" style={{ width: 24, height: 24 }} aria-label="지우기" onClick={() => setQ('')}><Ic n="close" s={16} /></button>}
      </div>
      {!t && (
        <>
          <Sec title="최근 검색어">
            {m.searches.map((s) => <button key={s} className="music-term" onClick={() => setQ(s)}><Ic n="clock" s={18} /><span>{s}</span></button>)}
            {m.searches.length > 0 && <div style={{ padding: '10px 20px' }}><button className="music-link" onClick={() => setMs({ searches: [] })}>지우기</button></div>}
          </Sec>
          <Sec title="인기 검색어">{POP.map((s, r) => <button key={s} className="music-term" onClick={() => setQ(s)}><b style={{ width: 18, color: '#fa233b' }}>{r + 1}</b><span>{s}</span></button>)}</Sec>
        </>
      )}
      {none && <div className="music-note" style={{ textAlign: 'center', padding: 40 }}>검색 결과가 없습니다</div>}
      {songs.length > 0 && <Sec title="노래">{songs.map((i) => <SongRow key={i} i={i} list={songs} ask={ask} />)}</Sec>}
      {albums.length > 0 && <Sec title="앨범"><div className="music-h">{albums.map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>}
      {artists.length > 0 && (
        <Sec title="아티스트">
          <div className="music-h">{artists.map((a) => (
            <button key={a.name} className="music-card music-round" onClick={() => go({ t: 'artist', name: a.name })}><Cover seed={a.seed} color={SONGS[a.songs[0]][2]} label={a.name} /><b>{a.name}</b></button>
          ))}</div>
        </Sec>
      )}
      {pls.length > 0 && <Sec title="플레이리스트"><div className="music-h">{pls.map((p) => <PlCard key={p.id} p={p} go={go} />)}</div></Sec>}
    </>
  )
}

/* ───────── 상세 화면 ───────── */
function AlbumView({ id, back, go, ask }) {
  const al = albumOf(id)
  if (!al) return <Nav back={back} />
  return (
    <>
      <Nav back={back} />
      <div className="music-hero">
        {albumCover(al)}
        <b>{al.title}</b>
        {al.artist === '다양한 아티스트' ? <span>{al.artist}</span> : <button className="music-artistlink" onClick={() => go({ t: 'artist', name: al.artist })}>{al.artist}</button>}
        <span>{al.year}년 발매 · {al.songs.length}곡</span>
      </div>
      <Acts list={al.songs} />
      {al.songs.map((i) => <SongRow key={i} i={i} list={al.songs} ask={ask} />)}
    </>
  )
}
function ArtistView({ name, back, go, ask }) {
  const ar = ARTISTS.find((a) => a.name === name)
  if (!ar) return <Nav back={back} />
  const albums = ALBUMS.filter((a) => a.songs.some((i) => ar.songs.includes(i)))
  return (
    <>
      <Nav back={back} />
      <div className="music-hero music-round" style={{ padding: '6px 80px 0' }}>
        <Cover seed={ar.seed} color={SONGS[ar.songs[0]][2]} label={ar.name} />
        <b>{ar.name}</b>
      </div>
      <Acts list={ar.songs} />
      <Sec title="대표 앨범"><div className="music-h">{albums.map((a) => <AlbumCard key={a.id} al={a} go={go} />)}</div></Sec>
      <Sec title="인기곡">{ar.songs.slice(0, 3).map((i, r) => <SongRow key={i} i={i} list={ar.songs} rank={r + 1} ask={ask} />)}</Sec>
      <Sec title="전체 곡 목록">{ar.songs.map((i) => <SongRow key={i} i={i} list={ar.songs} ask={ask} />)}</Sec>
    </>
  )
}
function SongsView({ title, list, back, ask }) {
  const l = ok(list)
  return (
    <>
      <Nav back={back} />
      <div className="music-title">{title}</div>
      {l.length ? <><Acts list={l} />{l.map((i) => <SongRow key={i} i={i} list={l} ask={ask} />)}</> : <div className="music-note" style={{ textAlign: 'center', padding: 40 }}>곡이 없습니다</div>}
    </>
  )
}
function AlbumsView({ title, ids, back, go }) {
  return (
    <>
      <Nav back={back} />
      <div className="music-title">{title}</div>
      <div className="music-grid">{ids.map((id) => { const a = albumOf(id); return a ? <AlbumCard key={id} al={a} go={go} /> : null })}</div>
    </>
  )
}
function ArtistsView({ back, go }) {
  return (
    <>
      <Nav back={back} />
      <div className="music-title">아티스트</div>
      {ARTISTS.map((a) => (
        <div key={a.name} className="music-row music-round" onClick={() => go({ t: 'artist', name: a.name })}>
          <div className="music-thumb"><Cover seed={a.seed} color={SONGS[a.songs[0]][2]} /></div>
          <div className="music-rowt"><b>{a.name}</b><span>{a.songs.length}곡</span></div>
        </div>
      ))}
    </>
  )
}
function PlsView({ back, go, ask }) {
  const m = useMs()
  return (
    <>
      <Nav back={back} right={<button className="music-ibtn red" aria-label="새 플레이리스트" onClick={() => ask({ kind: 'new' })}><Ic n="plus" s={24} /></button>} />
      <div className="music-title">플레이리스트</div>
      {m.playlists.map((p) => (
        <div key={p.id} className="music-row" onClick={() => go({ t: 'pl', id: p.id })}>
          <div className="music-thumb"><PlCover list={plSongs(p)} /></div>
          <div className="music-rowt"><b>{p.name}</b><span>{plSongs(p).length}곡</span></div>
        </div>
      ))}
    </>
  )
}
function PlView({ id, back, ask }) {
  const m = useMs()
  const [edit, setEdit] = useState(false)
  const p = m.playlists.find((x) => x.id === id)
  if (!p) return <Nav back={back} />
  const list = plSongs(p)
  const custom = !p.auto
  return (
    <>
      <Nav back={back} right={custom ? <button className="music-link" onClick={() => setEdit(!edit)}>{edit ? '완료' : '편집'}</button> : <span />} />
      <div className="music-hero" style={{ padding: '6px 70px 0' }}>
        <PlCover list={list} />
        <b>{p.name}</b>
        <span>{list.length}곡</span>
      </div>
      <Acts list={list} />
      {edit && (
        <div className="music-act" style={{ paddingTop: 0 }}>
          <button onClick={() => ask({ kind: 'rename', id: p.id, value: p.name })}><Ic n="edit" s={18} />이름 변경</button>
          <button onClick={() => ask({ kind: 'pick', id: p.id })}><Ic n="plus" s={18} />곡 추가</button>
          <button onClick={() => ask({ kind: 'del', id: p.id, after: back })}><Ic n="trash" s={18} />삭제</button>
        </div>
      )}
      {list.map((i) => (
        <SongRow key={i} i={i} list={list} ask={edit ? null : ask}
          right={edit && custom ? <button className="music-ibtn red" aria-label="곡 제거" onClick={(e) => { e.stopPropagation(); togglePl(p.id, i) }}><Ic n="minus" s={20} /></button> : null} />
      ))}
      {!list.length && <div className="music-note" style={{ textAlign: 'center', padding: 30 }}>곡이 없습니다{custom ? ' · 편집에서 곡을 추가하세요' : ''}</div>}
    </>
  )
}

/* ───────── 대화상자 (새 플레이리스트·이름 변경·곡 추가·삭제) ───────── */
function Dlg({ d, close }) {
  const m = useMs()
  const [v, setV] = useState(d.value || '')
  const done = () => {
    const n = v.trim()
    if (!n) return
    if (d.kind === 'new') newPl(n, d.song)
    else setMs((x) => ({ playlists: x.playlists.map((p) => (p.id === d.id ? { ...p, name: n } : p)) }))
    close()
  }
  let body = null
  if (d.kind === 'new' || d.kind === 'rename') {
    body = (
      <>
        <h3>{d.kind === 'new' ? '새 플레이리스트' : '이름 변경'}</h3>
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && done()} placeholder="플레이리스트 이름" />
        <div className="music-sbtns"><button onClick={close}>취소</button><button className="pri" onClick={done}>확인</button></div>
      </>
    )
  } else if (d.kind === 'del') {
    body = (
      <>
        <h3>플레이리스트를 삭제할까요?</h3>
        <div className="music-sbtns">
          <button onClick={close}>취소</button>
          <button className="pri" onClick={() => { setMs((x) => ({ playlists: x.playlists.filter((p) => p.id !== d.id) })); close(); d.after && d.after() }}>삭제</button>
        </div>
      </>
    )
  } else if (d.kind === 'addto') {
    body = (
      <>
        <h3>플레이리스트에 추가</h3>
        {m.playlists.filter((p) => p.auto !== 'recent').map((p) => (
          <button key={p.id} className="music-pick" onClick={() => togglePl(p.id, d.song)}><span>{p.name}</span>{inPl(p, d.song) && <Ic n="check" s={20} />}</button>
        ))}
        <button className="music-pick" onClick={() => close({ kind: 'new', song: d.song })}><span>새 플레이리스트</span><Ic n="plus" s={20} /></button>
        <div className="music-sbtns"><button onClick={close}>완료</button></div>
      </>
    )
  } else if (d.kind === 'pick') {
    const p = m.playlists.find((x) => x.id === d.id)
    body = (
      <>
        <h3>곡 추가</h3>
        {p && SONGS.map((s, i) => <button key={i} className="music-pick" onClick={() => togglePl(p.id, i)}><span>{s[0]} - {s[1]}</span>{inPl(p, i) && <Ic n="check" s={20} />}</button>)}
        <div className="music-sbtns"><button onClick={close}>완료</button></div>
      </>
    )
  }
  return <div className="music-scrim" onClick={() => close()}><div className="music-sheet" onClick={(e) => e.stopPropagation()}>{body}</div></div>
}

/* ───────── 전체 재생 화면 ───────── */
function Full({ open, close }) {
  const dv = useDevice()
  const m = useMs()
  const { cur, play } = dv.song
  useTick(open && play, 250)
  const [mode, setMode] = useState('art')
  const [drag, setDrag] = useState(null)
  const bar = useRef(null)
  const pane = useRef(null)
  const dragging = useRef(false)
  const s = cur !== null ? SONGS[cur] : null
  const dur = s ? s[3] : 0
  const pos = drag !== null ? drag * dur : dev.pos()
  const lines = s ? lyricsOf(cur) : []
  const active = dur ? Math.min(lines.length - 1, Math.floor((pos / dur) * lines.length)) : 0
  useEffect(() => {
    const box = pane.current
    const el = box && box.querySelector('.on')
    if (mode === 'lyrics' && box && el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' })
  }, [active, mode, cur])
  if (!s) return null
  const frac = (e) => { const r = bar.current.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) }
  const down = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setDrag(frac(e)) }
  const move = (e) => { if (dragging.current) setDrag(frac(e)) }
  const up = (e) => { if (!dragging.current) return; dragging.current = false; dev.seek(frac(e)); setDrag(null) }
  const liked = m.likes.includes(cur)
  const heart = <button className={`music-ibtn ${liked ? 'red' : ''}`} aria-label="좋아요" onClick={() => toggleLike(cur)}><Ic n={liked ? 'heartF' : 'heart'} s={26} /></button>
  const q = ms.queue
  const k = q.indexOf(cur)
  const upcoming = k < 0 ? [] : q.slice(k + 1)
  const move2 = (idx, d) => setMs((x) => { const a = [...x.queue]; const j = idx + d; if (j < 0 || j >= a.length || j <= a.indexOf(cur)) return {}; [a[idx], a[j]] = [a[j], a[idx]]; return { queue: a } })
  const del = (idx) => setMs((x) => ({ queue: x.queue.filter((_, n) => n !== idx) }))
  const seg = (name) => setMode(mode === name ? 'art' : name)
  return (
    <div className={`music-full ${open ? 'on' : ''}`}>
      <div className="music-fhead"><button className="music-ibtn" aria-label="닫기" onClick={close}><Ic n="chevD" s={28} /></button><div className="music-grab" /></div>
      {mode === 'art' ? (
        <>
          <div className={`music-fart ${play ? '' : 'pause'}`}>{songCover(cur)}</div>
          <div className="music-ftitle"><div><b>{s[0]}</b><span>{s[1]}</span></div>{heart}</div>
        </>
      ) : (
        <div className="music-fsmall">{songCover(cur)}<div><b>{s[0]}</b><span>{s[1]}</span></div>{heart}</div>
      )}
      {mode === 'lyrics' && (
        <div className="music-pane" ref={pane}>
          {lines.map((l, n) => <div key={n} className={`music-lyl ${n === active ? 'on' : ''}`}>{l}</div>)}
          <div className="music-note">가상으로 작성된 가사입니다. 강조 표시는 재생 위치를 기준으로 한 대략적인 진행이며, 실제 가사 싱크가 아닙니다.</div>
        </div>
      )}
      {mode === 'queue' && (
        <div className="music-pane">
          <div className="music-qh">재생 중</div>
          <div className="music-qr on"><div className="music-thumb">{songCover(cur)}</div><div><b>{s[0]}</b><span>{s[1]}</span></div></div>
          <div className="music-qh">다음 곡</div>
          {upcoming.length === 0 && <div className="music-note">대기 중인 곡이 없습니다</div>}
          {upcoming.map((i, n) => {
            const idx = k + 1 + n
            return (
              <div key={`${i}-${idx}`} className="music-qr" onClick={() => dev.play(i)}>
                <div className="music-thumb">{songCover(i)}</div>
                <div><b>{SONGS[i][0]}</b><span>{SONGS[i][1]}</span></div>
                <button className="music-ibtn" aria-label="위로" onClick={(e) => { e.stopPropagation(); move2(idx, -1) }}><Ic n="chevU" s={18} /></button>
                <button className="music-ibtn" aria-label="아래로" onClick={(e) => { e.stopPropagation(); move2(idx, 1) }}><Ic n="chevD" s={18} /></button>
                <button className="music-ibtn" aria-label="대기열에서 제거" onClick={(e) => { e.stopPropagation(); del(idx) }}><Ic n="close" s={18} /></button>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ flex: mode === 'art' ? 1 : 0 }} />
      <div className="music-bar" ref={bar} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="music-bartrack"><div className="music-barfill" style={{ width: `${(pos / dur) * 100}%` }} /><div className="music-knob" style={{ left: `${(pos / dur) * 100}%` }} /></div>
      </div>
      <div className="music-times"><span>{fmt(pos)}</span><span>{fmt(dur)}</span></div>
      <div className="music-ctl">
        <button className={`music-ibtn sm ${dv.song && ms.shuffle ? 'on' : ''}`} aria-label="셔플" onClick={toggleShuffle}><Ic n="shuffle" s={22} /></button>
        <button className="music-ibtn" aria-label="이전 곡" onClick={prevSong}><Ic n="prev" s={34} /></button>
        <button className="music-ibtn big" aria-label={play ? '일시정지' : '재생'} onClick={() => dev.toggle()}><Ic n={play ? 'pause' : 'play'} s={50} /></button>
        <button className="music-ibtn" aria-label="다음 곡" onClick={() => step(1)}><Ic n="next" s={34} /></button>
        <button className={`music-ibtn sm ${ms.repeat ? 'on' : ''}`} aria-label="한 곡 반복" onClick={() => setMs({ repeat: ms.repeat ? 0 : 1 })}><Ic n={ms.repeat ? 'repeat1' : 'repeat'} s={22} /></button>
      </div>
      <div className="music-foot">
        <button className={`music-ibtn ${mode === 'lyrics' ? 'on' : ''}`} aria-label="가사" onClick={() => seg('lyrics')}><Ic n="lyrics" s={24} /></button>
        <button className={`music-ibtn ${m.downloads.includes(cur) ? 'red' : ''}`} aria-label="다운로드" onClick={() => toggleDl(cur)}><Ic n={m.downloads.includes(cur) ? 'check' : 'download'} s={24} /></button>
        <button className={`music-ibtn ${mode === 'queue' ? 'on' : ''}`} aria-label="재생 대기열" onClick={() => seg('queue')}><Ic n="queue" s={24} /></button>
      </div>
    </div>
  )
}

/* ───────── 루트 ───────── */
const TABS = [['listen', '지금 듣기', 'listen'], ['browse', '둘러보기', 'browse'], ['radio', '라디오', 'radio'], ['library', '보관함', 'library'], ['search', '검색', 'search']]
export default function Music() {
  const dv = useDevice()
  const { cur, play } = dv.song
  const [tab, setTab] = useState('listen')
  const [stacks, setStacks] = useState({ listen: [], browse: [], radio: [], library: [], search: [] })
  const [full, setFull] = useState(false)
  const [dlg, setDlg] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (cur !== null) setMs((x) => ({ recents: [cur, ...x.recents.filter((i) => i !== cur)].slice(0, 20) }))
  }, [cur])

  const stack = stacks[tab]
  const go = (v) => setStacks((s) => ({ ...s, [tab]: [...s[tab], v] }))
  const back = () => setStacks((s) => ({ ...s, [tab]: s[tab].slice(0, -1) }))
  const ask = (d) => setDlg(d)
  const pickTab = (t) => (t === tab ? setStacks((s) => ({ ...s, [t]: [] })) : setTab(t))
  const closeDlg = (next) => setDlg(next && next.kind ? next : null)

  const v = stack[stack.length - 1]
  const p = { go, ask, back }
  let body
  if (!v) body = { listen: <Listen {...p} />, browse: <Browse {...p} />, radio: <Radio {...p} />, library: <Library {...p} />, search: <Search {...p} q={q} setQ={setQ} /> }[tab]
  else if (v.t === 'album') body = <AlbumView id={v.id} {...p} />
  else if (v.t === 'artist') body = <ArtistView name={v.name} {...p} />
  else if (v.t === 'songs') body = <SongsView title={v.title} list={v.list} {...p} />
  else if (v.t === 'albums') body = <AlbumsView title={v.title} ids={v.ids} {...p} />
  else if (v.t === 'artists') body = <ArtistsView {...p} />
  else if (v.t === 'pls') body = <PlsView {...p} />
  else if (v.t === 'pl') body = <PlView id={v.id} {...p} />

  return (
    <div className={`music-root ${dv.dark ? 'music-dark' : ''}`}>
      <div className={`music-body ${tab !== 'listen' ? 'inactive' : ''}`} key={`${tab}-${stack.length}-${v ? v.t + (v.id || v.name || v.title || '') : ''}`}>{body}</div>
      {cur !== null && (
        <div className="music-mini" onClick={() => setFull(true)}>
          {songCover(cur)}
          <b>{SONGS[cur][0]}</b>
          <button className="music-ibtn" aria-label={play ? '일시정지' : '재생'} onClick={(e) => { e.stopPropagation(); dev.toggle() }}><Ic n={play ? 'pause' : 'play'} s={26} /></button>
          <button className="music-ibtn" aria-label="다음 곡" onClick={(e) => { e.stopPropagation(); step(1) }}><Ic n="next" s={26} /></button>
        </div>
      )}
      <div className="music-tabs">
        {TABS.map(([id, label, ic]) => (
          <button key={id} className={`music-tab ${tab === id ? 'on' : ''}`} disabled={id !== 'listen'} aria-disabled={id !== 'listen'} onClick={() => id === 'listen' && pickTab(id)}><Ic n={ic} s={26} /><span>{label}</span></button>
        ))}
      </div>
      <Full open={full} close={() => setFull(false)} />
      {dlg && <Dlg d={dlg} close={closeDlg} />}
    </div>
  )
}
