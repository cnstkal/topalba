import { useState, useEffect, useMemo, useRef } from 'react'
import { Compass, MapPin, Heart, MessageCircle, User, X, Star, SlidersHorizontal, ChevronLeft, Send, Image as ImageIcon, Ban, Flag, Trash2, Plus, Flame, RotateCcw } from 'lucide-react'
import './Gyeol.css'

// 이 폴더에 추가한 사진을 자동으로 불러와 기존 사용자들에게 분배합니다.
const PROFILE_POOL = Object.values(import.meta.glob('../assets/gyeol/profile/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })) as string[]

// 사진 URL을 여기에 채우세요 (사용자마다 서로 다른 사진). 없으면 모노그램으로 표시됩니다.
const MY_PROFILE_PHOTO = `${import.meta.env.BASE_URL}images/gyeol/profile/mars/c6433842160cbcad8fd17217706faeb5.jpg`
const PROFILE_PHOTOS = {
  '유유': `${import.meta.env.BASE_URL}images/gyeol/profile/yuyu/1daa7f6d8e9f989dfabf4a00a7945d67.jpg`,
  '검은고양이냐옹': `${import.meta.env.BASE_URL}images/gyeol/profile/검은고양이다야옹/f96a31a507278c2b8e116b65536fe060.jpg`,
}
const PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900',
]
const NICKS = ['mochi','jun_k','곰돌이','Theo','새벽감성','달콤커피','ryu','밤산책','시월','Kai','soda_pop','건빵','호두','Noah','한강러너','민트초코','Dex','은빛','범블비','정글','Leo','찬바람','이든','주말농부','Mingu','해바라기','로이','다람쥐','Jay','석양','준비물','Ian','무지개','Han','럭키원','유유','검은고양이냐옹','현수막','규리','재즈','시온','태양','준마','도토리','승냥이','지구인','성냥','우유빛']
const AREAS = ['홍대','이태원','강남','성수','종로','신촌','잠실','해방촌','합정','건대']
const GOALS = ['가벼운 만남','데이트','진지한 관계','친구','대화 상대']
const JOBS = ['디자이너','개발자','바리스타','사진작가','간호사','대학원생','요리사','마케터','트레이너','에디터']
const POSITIONS = ['탑','바텀','올라운더']
const TAGS = ['러닝','전시','커피','헬스','클럽','영화','여행','게임','요리','독서','캠핑','반려견','음악','와인']
const BIOS = ['주말엔 한강 러닝 하고 저녁엔 맥주','말 많은 편은 아니에요. 편하게 말 걸어요','성수 카페 투어 중. 추천 받습니다','평일엔 야근, 주말엔 전시','강아지 산책 같이 할 사람','그냥 얘기 잘 통하면 좋겠어요','운동 끝나고 먹는 치킨이 낙','영화 취향 맞는 분 찾아요','천천히 알아가는 거 좋아해요','맛집 같이 다닐 사람 구함','밤산책 좋아함. 조용한 사람 선호','여행 갔다 와서 정리 중']
const MSGS = [['오늘 뭐 했어요?','야근하고 이제 퇴근이요 ㅠ','고생했네요. 맥주 한잔?'],['사진 분위기 좋네요','고마워요 성수에서 찍은 거예요','다음에 같이 가요'],['혹시 이태원 자주 가세요?','가끔요, 주로 해방촌 쪽','오 저도 거기 좋아해요'],['안녕하세요 :)','네 안녕하세요!','러닝 좋아하신다고 해서요']]

const rnd = (i, n) => (i * 7919 + n * 104729) % 9973
const pick = (a, i, n) => a[rnd(i, n) % a.length]
const mkUsers = () => NICKS.map((nick, i) => ({
  id: i + 1, nick, age: nick === '럭키원' ? 29 : (nick === '검은고양이냐옹' || nick === '유유') ? 28 : 22 + (rnd(i, 1) % 20), area: pick(AREAS, i, 2), dist: +(0.4 + (rnd(i, 3) % 180) / 10).toFixed(1),
  online: rnd(i, 4) % 3 === 0, last: `${1 + (rnd(i, 5) % 23)}시간 전`, height: nick === '럭키원' ? 170 : nick === '검은고양이냐옹' ? 171 : nick === '유유' ? 186 : 168 + (rnd(i, 6) % 20), job: pick(JOBS, i, 7), position: ['럭키원', '검은고양이냐옹'].includes(nick) ? '올라운더' : nick === '유유' ? '바텀' : pick(POSITIONS, i, 8),
  goal: pick(GOALS, i, 9), tags: [pick(TAGS, i, 10), pick(TAGS, i, 11), pick(TAGS, i, 12)], bio: pick(BIOS, i, 13),
  photos: nick === '럭키원' ? [] : PROFILE_PHOTOS[nick] ? [PROFILE_PHOTOS[nick]] : PROFILE_POOL.length ? [PROFILE_POOL[(i % Math.max(1, NICKS.length - 3)) % PROFILE_POOL.length]] : (PHOTOS[i] ? [PHOTOS[i]] : []),
}))
const mkState = () => {
  const users = mkUsers()
  const matchIds = [35, 36, 37, 3, 7, 12, 18, 1, 4, 5, 6, 8, 9, 10, 11, 13, 15, 16, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48]
  const chats = {}
  const seed = (id, lines, gap = 1) => { chats[id] = lines.map((text, j) => ({ me: j % 2 === 1, text, t: Date.now() - (lines.length - j) * gap * 3600e3 })) }
  seed(35, ['오늘 끝나고 시간 돼?', '오늘은 좀 늦게 끝날 듯', '그럼 끝나고 연락해. 밥이라도 먹자', 'ㅇㅋ 끝나면 연락할게'], 7)
  seed(36, ['어제 집 잘 들어갔어?', '응ㅋㅋ 너는', '나도. 다음에 그쪽에서 보자', '이번 주 중에 시간 맞춰볼게'], 11)
  seed(37, ['이번 주말 뭐 해', '아직 별일 없어', '그럼 토요일에 볼래?', '콜 몇 시쯤?'], 18)
  seed(3, ['고생했네요. 맥주 한잔?', 'ㅋㅋ 오늘은 패스', '담에 보자'], 26)
  seed(7, ['지금 어디야', '이태원 쪽', '나도 근처인데 잠깐 볼래?'], 32)
  seed(12, ['오늘 뭐 먹었어', '아직 안 먹었어', '그럼 끝나고 간단히 먹자'], 40)
  seed(18, ['오랜만이네 잘 지내?', '그럭저럭 지내지 뭐', '시간 되면 얼굴 보자'], 52)
  seed(1, ['오늘도 출근?', '응 이제 나가', '고생해라'], 60)
  seed(2, ['스토리 봤어ㅋㅋ', '아 그거 별거 아님', 'ㅋㅋ 알겠음'], 70)
  seed(4, ['이번 주는 바빠?', '조금. 왜?', '그냥 물어봤어'], 82)
  seed(5, ['잘 지내지?', 'ㅇㅇ 너도?', '그럼그럼'], 95)
  seed(6, ['담에 술 한잔하자', '시간 맞으면 보자'], 110)
  seed(8, ['근처 갈 일 있는데', '오면 연락해'], 125)
  seed(9, ['ㅋㅋㅋㅋ 그건 좀 웃겼다', '인정'], 140)
  seed(10, ['요즘 바빠서 연락 늦었네', '괜찮아'], 155)
  seed(11, ['이번 달 안에 한번 보자', 'ㅇㅋ 일정 보고 연락할게'], 170)
  seed(13, ['혹시 오늘 가능해요?', '오늘은 어려워요', '네 다음에 연락드릴게요'], 185)
  seed(14, ['안녕하세요 프로필 보고 연락드려요', '네 무슨 일이세요?', '그냥 근처라서요'], 200)
  seed(15, ['지금 뭐 하세요?', '일하는 중이에요', '아 넵'], 215)
  seed(16, ['오랜만이에요', '그러게요 잘 지냈어요?'], 230)
  seed(38, ['안녕하세요 알바 아직 구하시나요?', '네 일정 맞으면 가능합니다', '카톡 아이디 드릴게요. mars403으로 연락 주세요', '네 카톡으로 연락드릴게요!'], 3)
  seed(39, ['탑 알바 문의드려요', '가능한 날짜랑 시간 먼저 보내주세요', '이번 주 금요일 가능할까요?', '카톡 아이디 남길게요. mars403으로 연락 주세요'], 5)
  seed(40, ['혹시 오늘 급하게 가능하세요?', '오늘은 마감됐어요. 카톡 아이디로 문의 주세요', '카톡 아이디 mars403 추가하고 연락 주세요'], 8)
  seed(41, ['안녕하세요 조건 문의하고 싶어요', '네 카톡 아이디로 연락 주시면 자세히 안내할게요', '카톡 아이디 mars403 입니다'], 12)
  seed(42, ['알바 보고 연락드렸습니다', '가능한 날짜 보내주세요. 카톡으로 안내할게요', '010-4827-1936'], 16)
  seed(43, ['안녕하세요 혹시 아직 구하세요?', '네, 자세한 내용은 카톡으로 부탁드려요', '010-4827-1936 입니다'], 22)
  seed(44, ['오늘 밤 가능하신가요?', '시간 확인해보고 번호로 답 드릴게요'], 28)
  seed(45, ['프로필 보고 연락드려요', '어떤 문의세요?', '알바 관련이요. 카톡으로 여쭤봐도 될까요?'], 35)
  seed(46, ['이번 주 일정 알 수 있을까요?', '가능한 날짜 정리해서 카톡으로 보내주세요'], 42)
  seed(47, ['안녕하세요', '네 안녕하세요', '혹시 알바 문의 가능할까요?'], 50)
  seed(48, ['혹시 번호 받을 수 있을까요?', '네 카톡 아이디 mars403 으로 연락 주세요'], 58)
  return { users, liked: [5, 9, 21], starred: [], likedMe: [2, 14, 25, 20, 22, 27, 9, 3, 7, 12, 18], matches: matchIds, passed: [], blocked: [], chats, unread: { 7: 1, 12: 2, 35: 1, 38: 1, 40: 2 },
    me: { nick: 'mars', age: 29, bio: '178 18 / 탑 / 알바 필요하시면 따로 문의', tags: [], goal: '친구', visible: true, photos: [MY_PROFILE_PHOTO] }, filter: { min: 18, max: 50, dist: 30, goal: '전체' } }
}
const load = () => { try { const s = JSON.parse(localStorage.getItem('gyeol-state')); if (s && s.users) { const seed = mkState(); const known = new Set(s.users.map(u => u.id)); const nickById = { 35: '럭키원', 36: '유유', 37: '검은고양이냐옹' }; const users = [...s.users.map((u) => { const fresh = seed.users.find((x) => x.id === u.id) || u; return { ...u, nick: fresh.nick, age: fresh.age, height: fresh.height, position: fresh.position, photos: fresh.nick === '럭키원' ? [] : PROFILE_PHOTOS[fresh.nick] ? [PROFILE_PHOTOS[fresh.nick]] : PROFILE_POOL.length ? fresh.photos : (u.photos || fresh.photos) }; }), ...seed.users.filter(u => !known.has(u.id))]; const chats = { ...seed.chats, ...(s.chats || {}) }; Object.keys(chats).forEach(id => { chats[id] = (chats[id] || []).map(m => ({ ...m, text: typeof m.text === 'string' ? m.text.replace(/010-4827-1936/g, '카톡 아이디 mars403') : m.text })) }); return { ...seed, ...s, users, matches: [...new Set([...(s.matches || []), ...seed.matches])], likedMe: [...new Set([...(s.likedMe || []), ...seed.likedMe])], chats, unread: { ...seed.unread, ...(s.unread || {}) }, starred: s.starred || [], me: { ...s.me, nick: 'mars', age: 29, bio: '178 18 / 탑 / 알바 필요하시면 따로 문의', tags: [], goal: '친구', photos: s.me?.photos?.length ? s.me.photos : [MY_PROFILE_PHOTO] } } } } catch (e) {} return mkState() }

function Photo({ u, i = 0, cls = '' }) {
  const [bad, setBad] = useState(false)
  const src = u.photos[i]
  return src && !bad ? <img className={`gyeol-photo ${cls}`} src={src} alt={u.nick} onError={() => setBad(true)} draggable={false} />
    : <div className={`gyeol-photo gyeol-mono ${u.nick === '럭키원' ? 'gyeol-solid-black' : ''} ${cls}`}>{u.nick === '럭키원' ? '' : (u.nick || '?')[0].toUpperCase()}</div>
}

// 사진이 옆으로 부드럽게 밀려 넘어가는 스트립 (key={u.id}로 사람이 바뀔 때는 새로 그려 애니메이션 없이 시작)
function PhotoStrip({ u, i }) {
  const n = Math.max(u.photos.length, 1)
  return (
    <div className="gyeol-strip" style={{ width: `${n * 100}%`, transform: `translateX(-${(i * 100) / n}%)` }}>
      {Array.from({ length: n }).map((_, k) => <div key={k} className="gyeol-slide" style={{ width: `${100 / n}%` }}><Photo u={u} i={k} /></div>)}
    </div>
  )
}

export default function Gyeol() {
  const [s, setS] = useState(load)
  const [tab, setTab] = useState('explore')
  const [detail, setDetail] = useState(null)
  const [room, setRoom] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [pendingBlock, setPendingBlock] = useState(null)
  const [match, setMatch] = useState(null)
  useEffect(() => { try { localStorage.setItem('gyeol-state', JSON.stringify(s)) } catch { /* 저장 공간 부족 등은 무시 */ } }, [s])
  const upd = (p) => setS((o) => ({ ...o, ...(typeof p === 'function' ? p(o) : p) }))
  const byId = (id) => s.users.find((u) => u.id === id)

  const like = (id) => {
    if (s.likedMe.includes(id) && !s.matches.includes(id) && !s.liked.includes(id)) setMatch(id)
    likeRaw(id)
  }
  const likeRaw = (id) => upd((o) => {
    if (o.liked.includes(id)) return {}
    const m = o.likedMe.includes(id) && !o.matches.includes(id)
    return { liked: [...o.liked, id], passed: o.passed.filter((x) => x !== id), matches: m ? [...o.matches, id] : o.matches, chats: m ? { ...o.chats, [id]: o.chats[id] || [] } : o.chats }
  })
  const unlike = (id) => upd((o) => ({ liked: o.liked.filter((x) => x !== id), matches: o.matches.filter((x) => x !== id) }))
  const star = (id) => upd((o) => ({ starred: o.starred.includes(id) ? o.starred.filter((x) => x !== id) : [...o.starred, id] }))
  const pass = (id) => upd((o) => ({ passed: [...o.passed, id] }))
  const doBlock = (id) => { setPendingBlock(null); upd((o) => ({ blocked: [...o.blocked, id], liked: o.liked.filter((x) => x !== id), matches: o.matches.filter((x) => x !== id) })); setDetail(null); setRoom(null) }
  const f = s.filter
  const ok = (u) => !s.blocked.includes(u.id) && u.age >= f.min && u.age <= f.max && u.dist <= f.dist && (f.goal === '전체' || u.goal === f.goal)
  const matched = (id) => s.matches.includes(id)
  const openChat = (id) => { upd((o) => ({ unread: { ...o.unread, [id]: 0 } })); setDetail(null); setRoom(id); setTab('chat') }
  const block = (id) => setPendingBlock(id)
  const ctx = { s, upd, like, unlike, star, pass, block, byId, ok, setDetail, openChat, matched }

  return (
    <div className="gyeol-app">
      <header className="gyeol-top">
        <div className="gyeol-logo"><Flame size={24} fill="currentColor" />결<span>GYEOL</span></div>
        {(tab === 'explore' || tab === 'nearby') && <button className="gyeol-icon" onClick={() => setShowFilter(true)}><SlidersHorizontal size={20} /></button>}
      </header>
      <main className="gyeol-body">
        {tab === 'explore' && <Explore {...ctx} />}
        {tab === 'nearby' && <Nearby {...ctx} />}
        {tab === 'likes' && <Likes {...ctx} />}
        {tab === 'chat' && <Chat {...ctx} room={room} setRoom={setRoom} />}
        {tab === 'me' && <Me {...ctx} />}
      </main>
      <nav className="gyeol-nav">
        {[['explore', Compass, '탐색'], ['nearby', MapPin, '주변'], ['likes', Heart, '좋아요'], ['chat', MessageCircle, '채팅'], ['me', User, '프로필']].map(([k, Ic, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setRoom(null) }}><Ic size={22} /><span>{l}</span></button>
        ))}
      </nav>
      {detail && byId(detail) && <Detail u={byId(detail)} {...ctx} onClose={() => setDetail(null)} />}
      {match && byId(match) && <MatchScreen u={byId(match)} me={s.me} onChat={() => { const id = match; setMatch(null); openChat(id) }} onClose={() => setMatch(null)} />}
      {pendingBlock && (
        <div className="gyeol-sheetbg" onClick={() => setPendingBlock(null)}><div className="gyeol-sheet" onClick={(e) => e.stopPropagation()}>
          <h3>차단하시겠습니까?</h3>
          <p className="gyeol-note">차단하면 이 사람의 프로필이 더 이상 보이지 않고 매칭과 채팅도 끊어져요.</p>
          <div className="gyeol-btn-row">
            <button className="gyeol-btn ghost" onClick={() => setPendingBlock(null)}>취소</button>
            <button className="gyeol-btn" onClick={() => doBlock(pendingBlock)}>차단</button>
          </div>
        </div></div>
      )}
      {showFilter && <Filter f={f} onClose={() => setShowFilter(false)} set={(p) => upd({ filter: { ...f, ...p } })} />}
    </div>
  )
}

function Explore({ s, like, star, pass, ok, setDetail, upd }) {
  // 나를 먼저 좋아한 사람(아직 매칭 전)을 덱 앞쪽에 배치 — 좋아요를 누르면 바로 매칭 연출이 보이도록
  const pending = (id: number) => s.likedMe.includes(id) && !s.matches.includes(id)
  const queue = useMemo(() => s.users.filter((u) => ok(u) && !s.liked.includes(u.id) && !s.passed.includes(u.id)).sort((a, b) => Number(pending(b.id)) - Number(pending(a.id))), [s])
  const u = queue[0]
  const next = queue[1]
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const [fly, setFly] = useState<null | 'like' | 'pass'>(null)
  const start = useRef<number | null>(null)
  const [pi, setPi] = useState(0)
  useEffect(() => { setPi(0); setFly(null); setDx(0) }, [u && u.id])
  if (!u) return <div className="gyeol-empty">추천이 끝났어요.<button className="gyeol-btn" onClick={() => upd({ passed: [] })}>패스한 사람 다시 보기</button></div>
  const act = (kind: 'like' | 'pass') => {
    if (fly) return
    setFly(kind); setDrag(false); start.current = null
    setTimeout(() => { kind === 'like' ? like(u.id) : pass(u.id) }, 280)
  }
  const end = () => { setDrag(false); if (start.current == null) return; if (dx > 90) act('like'); else if (dx < -90) act('pass'); else setDx(0); start.current = null }
  const n = Math.max(u.photos.length, 1)
  const x = fly ? (fly === 'like' ? 520 : -520) : dx
  const p = Math.min(1, Math.abs(x) / 140)
  const cardStyle = {
    transform: `translateX(${x}px) rotate(${x / 18}deg)`,
    transition: drag ? 'none' : 'transform .28s cubic-bezier(.2,.9,.3,1.2), opacity .28s',
    opacity: fly ? 0 : 1,
  }
  return (
    <div className="gyeol-explore">
      <div className="gyeol-deck">
        {next && <div className="gyeol-card back" style={{ transform: `scale(${0.94 + 0.06 * p}) translateY(${(1 - p) * 10}px)`, opacity: 0.55 + 0.45 * p }}><Photo u={next} /></div>}
        <div className={`gyeol-card ${fly ? 'flying' : ''}`} style={cardStyle}
          onPointerDown={(e) => { if (fly) return; start.current = e.clientX; setDrag(true) }} onPointerMove={(e) => start.current != null && setDx(e.clientX - start.current)} onPointerUp={end} onPointerCancel={end}>
          <PhotoStrip key={u.id} u={u} i={pi} />
          <div className="gyeol-dots">{Array.from({ length: n }).map((_, i) => <i key={i} className={i === pi ? 'on' : ''} />)}</div>
          <button className="gyeol-tap l" onClick={() => setPi((q) => Math.max(0, q - 1))} />
          <button className="gyeol-tap r" onClick={() => setPi((q) => Math.min(n - 1, q + 1))} />
          <b className="gyeol-stamp like" style={{ opacity: x > 0 ? Math.min(1, (x - 20) / 80) : 0 }}>LIKE</b>
          <b className="gyeol-stamp nope" style={{ opacity: x < 0 ? Math.min(1, (-x - 20) / 80) : 0 }}>PASS</b>
          <div className="gyeol-info" onClick={() => Math.abs(dx) < 5 && setDetail(u.id)}>
            <h2>{u.nick} <em>{u.age}</em></h2>
            <p>{u.online && <i className="gyeol-on" />}{u.online ? '접속 중' : u.last} · {u.area} · {u.dist}km</p>
            <p className="gyeol-sub">{u.bio}</p>
            <p className="gyeol-sub">{u.height}cm · {u.job} · {u.goal}</p>
          </div>
        </div>
      </div>
      <div className="gyeol-actions">
        <button className="sm rewind" aria-label="되돌리기" title="되돌리기" disabled={!s.passed.length || !!fly} onClick={() => upd((o) => ({ passed: o.passed.slice(0, -1) }))}><RotateCcw size={20} /></button>
        <button className="pass" aria-label="패스" onClick={() => act('pass')}><X size={28} strokeWidth={3} /></button>
        <button className={`sm ${s.starred.includes(u.id) ? "starred" : ""}`} aria-label={s.starred.includes(u.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"} title="즐겨찾기" onClick={() => star(u.id)}><Star size={22} fill={s.starred.includes(u.id) ? "currentColor" : "none"} /></button>
        <button className="main" aria-label="좋아요" onClick={() => act('like')}><Heart size={26} fill="currentColor" /></button>
      </div>
    </div>
  )
}

function Nearby({ s, ok, setDetail }) {
  const [sort, setSort] = useState('online')
  const list = s.users.filter(ok).sort((a, b) => sort === 'online' ? (b.online - a.online) || a.dist - b.dist : a.dist - b.dist)
  return (
    <div>
      <div className="gyeol-seg"><button className={sort === 'online' ? 'on' : ''} onClick={() => setSort('online')}>온라인 우선</button><button className={sort === 'dist' ? 'on' : ''} onClick={() => setSort('dist')}>거리순</button></div>
      <div className="gyeol-grid">
        {list.map((u) => (
          <button key={u.id} className="gyeol-cell" onClick={() => setDetail(u.id)}>
            <Photo u={u} />{u.online && <i className="gyeol-on abs" />}
            <span>{u.nick}, {u.age}<small>{u.dist}km</small></span>
          </button>
        ))}
      </div>
      <p className="gyeol-note">거리는 가상 데이터이며 실제 위치를 사용하지 않아요.</p>
    </div>
  )
}

function Likes({ s, byId, setDetail, unlike, like, openChat, matched }) {
  const [t, setT] = useState('recv')
  const ids = (t === 'recv' ? s.likedMe : s.liked).filter((id) => !s.blocked.includes(id))
  return (
    <div>
      <div className="gyeol-seg"><button className={t === 'recv' ? 'on' : ''} onClick={() => setT('recv')}>받은 {s.likedMe.length}</button><button className={t === 'sent' ? 'on' : ''} onClick={() => setT('sent')}>보낸 {s.liked.length}</button></div>
      <div className="gyeol-grid">
        {ids.map((id) => { const u = byId(id); return (
          <div key={id} className="gyeol-cell" onClick={() => matched(id) ? openChat(id) : setDetail(id)}>
            <Photo u={u} />{matched(id) && <b className="gyeol-badge">MATCH</b>}{s.starred?.includes(id) && <b className="gyeol-starbadge">★ 즐겨찾기</b>}
            <span>{u.nick}, {u.age}<small>{u.area}</small></span>
            {t === 'sent' ? <button className="gyeol-mini" onClick={(e) => { e.stopPropagation(); unlike(id) }}><X size={14} /></button>
              : !s.liked.includes(id) && <button className="gyeol-mini like" onClick={(e) => { e.stopPropagation(); like(id) }}><Heart size={14} /></button>}
          </div>) })}
      </div>
    </div>
  )
}

function Chat({ s, upd, byId, room, setRoom, setDetail, block }) {
  const [txt, setTxt] = useState('')
  const photoInput = useRef(null)
  const end = useRef(null)
  useEffect(() => { end.current && end.current.scrollIntoView() }, [room, s.chats])
  const fmt = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const send = (text) => { if (!text.trim()) return; upd((o) => ({ chats: { ...o.chats, [room]: [...(o.chats[room] || []), { me: true, text, t: Date.now() }] } })); setTxt('') }
  if (room && byId(room)) {
    const u = byId(room), msgs = s.chats[room] || []
    return (
      <div className="gyeol-room">
        <div className="gyeol-roomtop"><button className="gyeol-icon" onClick={() => setRoom(null)}><ChevronLeft size={22} /></button>
          <button className="gyeol-who" onClick={() => setDetail(room)}><Photo u={u} cls="sm" />{u.nick}</button>
          <button className="gyeol-icon" onClick={() => block(room)}><Ban size={18} /></button></div>
        <div className="gyeol-msgs">{msgs.map((m, i) => <div key={i} className={`gyeol-msg ${m.me ? 'me' : ''} ${m.image ? 'has-image' : ''}`}>{m.image ? <img className="gyeol-sent-photo" src={m.image} alt="보낸 사진" /> : <p>{m.text}</p>}<small>{fmt(m.t)}</small></div>)}<div ref={end} /></div>
        <div className="gyeol-input">
          <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
              const image = new Image()
              image.onload = () => {
                const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(image.width * scale)
                canvas.height = Math.round(image.height * scale)
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
                const data = canvas.toDataURL('image/jpeg', 0.78)
                upd((o) => ({ chats: { ...o.chats, [room]: [...(o.chats[room] || []), { me: true, image: data, t: Date.now() }] } }))
              }
              image.src = String(reader.result)
            }
            reader.readAsDataURL(file)
            e.target.value = ''
          }} />
          <button className="gyeol-icon" onClick={() => photoInput.current?.click()}><ImageIcon size={20} /></button>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(txt)} placeholder="메시지 입력" />
          <button className="gyeol-send" onClick={() => send(txt)}><Send size={18} /></button>
        </div>
      </div>
    )
  }
  const rooms = s.matches.filter((id) => !s.blocked.includes(id) && byId(id)).sort((a, b) => {
    const at = (s.chats[a] || []).slice(-1)[0]?.t || 0
    const bt = (s.chats[b] || []).slice(-1)[0]?.t || 0
    return bt - at
  })
  const renderRows = (ids) => ids.map((id) => { const u = byId(id), m = (s.chats[id] || []).slice(-1)[0], un = s.unread[id]; if (!u) return null; return (
    <button key={id} className="gyeol-row" onClick={() => { upd((o) => ({ unread: { ...o.unread, [id]: 0 } })); setRoom(id) }}>
      <Photo u={u} cls="sm" /><div><b>{u.nick}</b><p>{m ? m.text : '매칭됐어요! 먼저 말을 걸어보세요'}</p></div>
      <small>{m ? fmt(m.t) : ''}{un > 0 && <i className="gyeol-un">{un}</i>}</small></button>) })
  if (!rooms.length) return <div className="gyeol-empty">아직 대화가 없어요</div>
  return <div className="gyeol-chatlist">{renderRows(rooms)}</div>
}

function Me({ s, upd }) {
  const m = s.me
  const set = (p) => upd({ me: { ...m, ...p } })
  const add = () => { const url = prompt('사진 URL'); if (url) set({ photos: [...m.photos, url] }) }
  return (
    <div className="gyeol-me">
      <section className="gyeol-profile-card">
        <div className="gyeol-profile-cover"><span>MY PROFILE</span></div>
        <div className="gyeol-profile-main">
          <div className="gyeol-profile-avatar"><img src={m.photos[0] || MY_PROFILE_PHOTO} alt="mars 프로필" /></div>
          <span className="gyeol-profile-status">PROFILE ACTIVE</span>
          <h2>{m.nick}</h2>
          <p className="gyeol-profile-meta">{m.age}세 · {m.goal}</p>
          <p className="gyeol-profile-bio">{m.bio}</p>
          <div className="gyeol-profile-tags">{m.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        </div>
        <div className="gyeol-profile-foot"><span>결에서 만나는 나</span><b>GYEOL MEMBER</b></div>
      </section>
      <p className="gyeol-note">내 프로필 미리보기 · 가상 프로필</p>
    </div>
  )
}
const setS0 = (upd) => { try { localStorage.removeItem('gyeol-state') } catch { /* ignore */ } upd(mkState()) }

function Detail({ u, s, like, unlike, block, openChat, matched, onClose }) {
  const [pi, setPi] = useState(0)
  const [rep, setRep] = useState(false)
  const liked = s.liked.includes(u.id)
  return (
    <div className="gyeol-detail">
      <button className="gyeol-icon back" onClick={onClose}><ChevronLeft size={22} /></button>
      <div className="gyeol-hero"><PhotoStrip key={u.id} u={u} i={pi} />
        {u.photos.length > 1 && <><button className="gyeol-tap l" onClick={() => setPi(Math.max(0, pi - 1))} /><button className="gyeol-tap r" onClick={() => setPi(Math.min(u.photos.length - 1, pi + 1))} /></>}</div>
      <div className="gyeol-dbody">
        <h2>{u.nick} <em>{u.age}</em></h2>
        <p>{u.online ? <><i className="gyeol-on" />접속 중</> : `마지막 접속 ${u.last}`} · {u.area} · {u.dist}km</p>
        <dl><dt>키</dt><dd>{u.height}cm</dd><dt>포지션</dt><dd>{u.position}</dd><dt>관계 목적</dt><dd>{u.goal}</dd></dl>
        <p>{u.bio}</p>
        <div className="gyeol-safety"><button onClick={() => setRep(true)}><Flag size={14} />신고</button><button onClick={() => block(u.id)}><Ban size={14} />차단</button></div>
        {rep && <p className="gyeol-note">신고가 접수되었어요. (샘플)</p>}
      </div>
      <div className="gyeol-dbar">
        <button className={`gyeol-btn ${liked ? 'ghost' : ''}`} onClick={() => liked ? unlike(u.id) : like(u.id)}><Heart size={18} />{liked ? '좋아요 취소' : '좋아요'}</button>
        <button className="gyeol-btn ghost" disabled={!matched(u.id)} onClick={() => openChat(u.id)}><MessageCircle size={18} />{matched(u.id) ? '메시지' : '매칭 후 가능'}</button>
      </div>
    </div>
  )
}

function Filter({ f, set, onClose }) {
  return (
    <div className="gyeol-sheetbg" onClick={onClose}><div className="gyeol-sheet" onClick={(e) => e.stopPropagation()}>
      <h3>필터</h3>
      <label>나이 {f.min}–{f.max}<input type="range" min="18" max="60" value={f.min} onChange={(e) => set({ min: Math.min(+e.target.value, f.max) })} /><input type="range" min="18" max="60" value={f.max} onChange={(e) => set({ max: Math.max(+e.target.value, f.min) })} /></label>
      <label>거리 {f.dist}km 이내<input type="range" min="1" max="30" value={f.dist} onChange={(e) => set({ dist: +e.target.value })} /></label>
      <label>관계 목적<select value={f.goal} onChange={(e) => set({ goal: e.target.value })}><option>전체</option>{GOALS.map((g) => <option key={g}>{g}</option>)}</select></label>
      <button className="gyeol-btn" onClick={onClose}>적용</button>
    </div></div>
  )
}

function MatchScreen({ u, me, onChat, onClose }) {
  const bits = useMemo(() => Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4, r = 120 + Math.random() * 150
    return { x: Math.cos(a) * r, y: Math.sin(a) * r - 40, d: Math.random() * 0.25, s: 10 + Math.random() * 16, h: i % 3 === 0 }
  }), [])
  return (
    <div className="gyeol-match" onClick={onClose}>
      <div className="gyeol-match-in" onClick={(e) => e.stopPropagation()}>
        <div className="gyeol-burst">{bits.map((b, i) => <i key={i} className={b.h ? 'h' : ''} style={{ ['--x' as any]: `${b.x}px`, ['--y' as any]: `${b.y}px`, animationDelay: `${0.35 + b.d}s`, width: b.s, height: b.s }} />)}</div>
        <h1>MATCH!</h1>
        <p>{u.nick}님도 나를 좋아했어요</p>
        <div className="gyeol-match-photos">
          <div className="l"><Photo u={{ nick: me.nick, photos: me.photos }} i={0} /></div>
          <span><Heart size={26} fill="currentColor" /></span>
          <div className="r"><Photo u={u} i={0} /></div>
        </div>
        <button className="gyeol-btn" onClick={onChat}><MessageCircle size={18} />메시지 보내기</button>
        <button className="gyeol-btn ghost" onClick={onClose}>계속 탐색하기</button>
      </div>
    </div>
  )
}
