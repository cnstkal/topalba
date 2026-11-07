import { useState, useEffect, useMemo, useRef } from 'react'
import { Compass, MapPin, Heart, MessageCircle, User, X, Star, SlidersHorizontal, ChevronLeft, Send, Image as ImageIcon, Ban, Flag, Trash2, Plus } from 'lucide-react'
import './Gyeol.css'

// 사진 URL을 여기에 채우세요 (사용자마다 서로 다른 사진). 없으면 모노그램으로 표시됩니다.
const PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900',
]
const NICKS = ['민재','jun_k','도윤','Theo','서준','하람','ryu','태오','시우','Kai','우진','건','지호','Noah','현','경민','Dex','은호','범','정우','Leo','찬','이든','승현','Mingu','해준','로이','다온','Jay','석','준서','Ian','무진','Han']
const AREAS = ['홍대','이태원','강남','성수','종로','신촌','잠실','해방촌','합정','건대']
const GOALS = ['가벼운 만남','데이트','진지한 관계','친구','대화 상대']
const JOBS = ['디자이너','개발자','바리스타','사진작가','간호사','대학원생','요리사','마케터','트레이너','에디터']
const BODY = ['슬림','보통','탄탄한','근육질','통통']
const TAGS = ['러닝','전시','커피','헬스','클럽','영화','여행','게임','요리','독서','캠핑','반려견','음악','와인']
const BIOS = ['주말엔 한강 러닝 하고 저녁엔 맥주','말 많은 편은 아니에요. 편하게 말 걸어요','성수 카페 투어 중. 추천 받습니다','평일엔 야근, 주말엔 전시','강아지 산책 같이 할 사람','그냥 얘기 잘 통하면 좋겠어요','운동 끝나고 먹는 치킨이 낙','영화 취향 맞는 분 찾아요','천천히 알아가는 거 좋아해요','맛집 같이 다닐 사람 구함','밤산책 좋아함. 조용한 사람 선호','여행 갔다 와서 정리 중']
const MSGS = [['오늘 뭐 했어요?','야근하고 이제 퇴근이요 ㅠ','고생했네요. 맥주 한잔?'],['사진 분위기 좋네요','고마워요 성수에서 찍은 거예요','다음에 같이 가요'],['혹시 이태원 자주 가세요?','가끔요, 주로 해방촌 쪽','오 저도 거기 좋아해요'],['안녕하세요 :)','네 안녕하세요!','러닝 좋아하신다고 해서요']]

const rnd = (i, n) => (i * 7919 + n * 104729) % 9973
const pick = (a, i, n) => a[rnd(i, n) % a.length]
const mkUsers = () => NICKS.map((nick, i) => ({
  id: i + 1, nick, age: 22 + (rnd(i, 1) % 20), area: pick(AREAS, i, 2), dist: +(0.4 + (rnd(i, 3) % 180) / 10).toFixed(1),
  online: rnd(i, 4) % 3 === 0, last: `${1 + (rnd(i, 5) % 23)}시간 전`, height: 168 + (rnd(i, 6) % 20), job: pick(JOBS, i, 7), body: pick(BODY, i, 8),
  goal: pick(GOALS, i, 9), tags: [pick(TAGS, i, 10), pick(TAGS, i, 11), pick(TAGS, i, 12)], bio: pick(BIOS, i, 13),
  photos: PHOTOS[i] ? [PHOTOS[i]] : [],
}))
const mkState = () => {
  const matchIds = [3, 7, 12, 18]
  const chats = {}
  matchIds.forEach((id, k) => { chats[id] = MSGS[k % MSGS.length].map((t, j) => ({ me: j % 2 === 1, text: t, t: Date.now() - (9 - j) * 3600e3 * (k + 1) })) })
  return { users: mkUsers(), liked: [5, 9, 21], likedMe: [2, 9, 14, 25, 3, 7, 12, 18], matches: matchIds, passed: [], blocked: [], chats, unread: { 7: 1, 12: 2 },
    me: { nick: 'me_', age: 27, bio: '', tags: [], goal: '데이트', visible: true, photos: [] }, filter: { min: 18, max: 50, dist: 30, goal: '전체' } }
}
const load = () => { try { const s = JSON.parse(localStorage.getItem('gyeol-state')); if (s && s.users) return s } catch (e) {} return mkState() }

function Photo({ u, i = 0, cls = '' }) {
  const [bad, setBad] = useState(false)
  const src = u.photos[i]
  return src && !bad ? <img className={`gyeol-photo ${cls}`} src={src} alt={u.nick} onError={() => setBad(true)} draggable={false} />
    : <div className={`gyeol-photo gyeol-mono ${cls}`}>{u.nick[0].toUpperCase()}</div>
}

export default function Gyeol() {
  const [s, setS] = useState(load)
  const [tab, setTab] = useState('explore')
  const [detail, setDetail] = useState(null)
  const [room, setRoom] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  useEffect(() => { localStorage.setItem('gyeol-state', JSON.stringify(s)) }, [s])
  const upd = (p) => setS((o) => ({ ...o, ...(typeof p === 'function' ? p(o) : p) }))
  const byId = (id) => s.users.find((u) => u.id === id)

  const like = (id) => upd((o) => {
    if (o.liked.includes(id)) return {}
    const m = o.likedMe.includes(id) && !o.matches.includes(id)
    return { liked: [...o.liked, id], passed: o.passed.filter((x) => x !== id), matches: m ? [...o.matches, id] : o.matches, chats: m ? { ...o.chats, [id]: o.chats[id] || [] } : o.chats }
  })
  const unlike = (id) => upd((o) => ({ liked: o.liked.filter((x) => x !== id), matches: o.matches.filter((x) => x !== id) }))
  const pass = (id) => upd((o) => ({ passed: [...o.passed, id] }))
  const block = (id) => { upd((o) => ({ blocked: [...o.blocked, id], liked: o.liked.filter((x) => x !== id), matches: o.matches.filter((x) => x !== id) })); setDetail(null); setRoom(null) }
  const f = s.filter
  const ok = (u) => !s.blocked.includes(u.id) && u.age >= f.min && u.age <= f.max && u.dist <= f.dist && (f.goal === '전체' || u.goal === f.goal)
  const matched = (id) => s.matches.includes(id)
  const openChat = (id) => { upd((o) => ({ unread: { ...o.unread, [id]: 0 } })); setDetail(null); setRoom(id); setTab('chat') }
  const ctx = { s, upd, like, unlike, pass, block, byId, ok, setDetail, openChat, matched }

  return (
    <div className="gyeol-app">
      <header className="gyeol-top">
        <div className="gyeol-logo">결<span>GYEOL</span></div>
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
      {detail && <Detail u={byId(detail)} {...ctx} onClose={() => setDetail(null)} />}
      {showFilter && <Filter f={f} onClose={() => setShowFilter(false)} set={(p) => upd({ filter: { ...f, ...p } })} />}
    </div>
  )
}

function Explore({ s, like, pass, ok, setDetail, upd }) {
  const queue = useMemo(() => s.users.filter((u) => ok(u) && !s.liked.includes(u.id) && !s.passed.includes(u.id)), [s])
  const u = queue[0]
  const [dx, setDx] = useState(0)
  const start = useRef(null)
  const [pi, setPi] = useState(0)
  useEffect(() => setPi(0), [u && u.id])
  if (!u) return <div className="gyeol-empty">추천이 끝났어요.<button className="gyeol-btn" onClick={() => upd({ passed: [] })}>패스한 사람 다시 보기</button></div>
  const end = () => { if (dx > 90) like(u.id); else if (dx < -90) pass(u.id); setDx(0); start.current = null }
  const n = Math.max(u.photos.length, 1)
  return (
    <div className="gyeol-explore">
      <div className="gyeol-card" style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)` }}
        onPointerDown={(e) => { start.current = e.clientX }} onPointerMove={(e) => start.current != null && setDx(e.clientX - start.current)} onPointerUp={end} onPointerCancel={end}>
        <Photo u={u} i={pi} />
        <div className="gyeol-dots">{Array.from({ length: n }).map((_, i) => <i key={i} className={i === pi ? 'on' : ''} />)}</div>
        <button className="gyeol-tap l" onClick={() => setPi((p) => Math.max(0, p - 1))} />
        <button className="gyeol-tap r" onClick={() => setPi((p) => Math.min(n - 1, p + 1))} />
        {dx > 40 && <b className="gyeol-stamp like">LIKE</b>}{dx < -40 && <b className="gyeol-stamp nope">PASS</b>}
        <div className="gyeol-info" onClick={() => Math.abs(dx) < 5 && setDetail(u.id)}>
          <h2>{u.nick} <em>{u.age}</em></h2>
          <p>{u.online && <i className="gyeol-on" />}{u.online ? '접속 중' : u.last} · {u.area} · {u.dist}km</p>
          <p className="gyeol-sub">{u.bio}</p>
          <p className="gyeol-sub">{u.height}cm · {u.job} · {u.goal}</p>
        </div>
      </div>
      <div className="gyeol-actions">
        <button onClick={() => pass(u.id)}><X size={26} /></button>
        <button className="sm" onClick={() => like(u.id)}><Star size={22} /></button>
        <button className="main" onClick={() => like(u.id)}><Heart size={26} /></button>
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
            <Photo u={u} />{matched(id) && <b className="gyeol-badge">MATCH</b>}
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
  const end = useRef(null)
  useEffect(() => { end.current && end.current.scrollIntoView() }, [room, s.chats])
  const fmt = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const send = (text) => { if (!text.trim()) return; upd((o) => ({ chats: { ...o.chats, [room]: [...(o.chats[room] || []), { me: true, text, t: Date.now() }] } })); setTxt('') }
  if (room) {
    const u = byId(room), msgs = s.chats[room] || []
    return (
      <div className="gyeol-room">
        <div className="gyeol-roomtop"><button className="gyeol-icon" onClick={() => setRoom(null)}><ChevronLeft size={22} /></button>
          <button className="gyeol-who" onClick={() => setDetail(room)}><Photo u={u} cls="sm" />{u.nick}</button>
          <button className="gyeol-icon" onClick={() => block(room)}><Ban size={18} /></button></div>
        <div className="gyeol-msgs">{msgs.map((m, i) => <div key={i} className={`gyeol-msg ${m.me ? 'me' : ''}`}><p>{m.text}</p><small>{fmt(m.t)}</small></div>)}<div ref={end} /></div>
        <div className="gyeol-input">
          <button className="gyeol-icon" onClick={() => send('📷 사진을 보냈어요')}><ImageIcon size={20} /></button>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(txt)} placeholder="메시지 입력" />
          <button className="gyeol-send" onClick={() => send(txt)}><Send size={18} /></button>
        </div>
      </div>
    )
  }
  const rooms = s.matches.filter((id) => !s.blocked.includes(id))
  if (!rooms.length) return <div className="gyeol-empty">아직 매칭이 없어요</div>
  return <div>{rooms.map((id) => { const u = byId(id), m = (s.chats[id] || []).slice(-1)[0]; const un = s.unread[id]; return (
    <button key={id} className="gyeol-row" onClick={() => { upd((o) => ({ unread: { ...o.unread, [id]: 0 } })); setRoom(id) }}>
      <Photo u={u} cls="sm" /><div><b>{u.nick}</b><p>{m ? m.text : '매칭됐어요! 먼저 말을 걸어보세요'}</p></div>
      <small>{m ? fmt(m.t) : ''}{un > 0 && <i className="gyeol-un">{un}</i>}</small></button>) })}</div>
}

function Me({ s, upd }) {
  const m = s.me
  const set = (p) => upd({ me: { ...m, ...p } })
  const add = () => { const url = prompt('사진 URL'); if (url) set({ photos: [...m.photos, url] }) }
  return (
    <div className="gyeol-me">
      <div className="gyeol-mephotos">{m.photos.map((p, i) => <div key={i}><img src={p} alt="" /><button onClick={() => set({ photos: m.photos.filter((_, j) => j !== i) })}><Trash2 size={14} /></button></div>)}<button className="add" onClick={add}><Plus size={22} /></button></div>
      <label>닉네임<input value={m.nick} onChange={(e) => set({ nick: e.target.value })} /></label>
      <label>나이 (성인만 이용 가능)<input type="number" min="19" value={m.age} onChange={(e) => set({ age: Math.max(19, +e.target.value || 19) })} /></label>
      <label>자기소개<textarea rows={3} value={m.bio} onChange={(e) => set({ bio: e.target.value })} /></label>
      <label>관계 목적<select value={m.goal} onChange={(e) => set({ goal: e.target.value })}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select></label>
      <div className="gyeol-tags">{TAGS.map((t) => <button key={t} className={m.tags.includes(t) ? 'on' : ''} onClick={() => set({ tags: m.tags.includes(t) ? m.tags.filter((x) => x !== t) : [...m.tags, t] })}>{t}</button>)}</div>
      <label className="gyeol-chk"><input type="checkbox" checked={m.visible} onChange={(e) => set({ visible: e.target.checked })} />프로필 공개</label>
      <p className="gyeol-note">가상 서비스입니다. 실제 개인정보와 위치를 수집하지 않아요.</p>
      <button className="gyeol-btn ghost" onClick={() => { if (confirm('모든 데이터를 초기화할까요?')) setS0(upd) }}>데이터 초기화</button>
    </div>
  )
}
const setS0 = (upd) => { localStorage.removeItem('gyeol-state'); upd(mkState()) }

function Detail({ u, s, like, unlike, block, openChat, matched, onClose }) {
  const [pi, setPi] = useState(0)
  const [rep, setRep] = useState(false)
  const liked = s.liked.includes(u.id)
  return (
    <div className="gyeol-detail">
      <button className="gyeol-icon back" onClick={onClose}><ChevronLeft size={22} /></button>
      <div className="gyeol-hero"><Photo u={u} i={pi} />
        {u.photos.length > 1 && <><button className="gyeol-tap l" onClick={() => setPi(Math.max(0, pi - 1))} /><button className="gyeol-tap r" onClick={() => setPi(Math.min(u.photos.length - 1, pi + 1))} /></>}</div>
      <div className="gyeol-dbody">
        <h2>{u.nick} <em>{u.age}</em></h2>
        <p>{u.online ? <><i className="gyeol-on" />접속 중</> : `마지막 접속 ${u.last}`} · {u.area} · {u.dist}km</p>
        <dl><dt>키</dt><dd>{u.height}cm</dd><dt>직업</dt><dd>{u.job}</dd><dt>체형</dt><dd>{u.body}</dd><dt>관계 목적</dt><dd>{u.goal}</dd></dl>
        <p>{u.bio}</p>
        <div className="gyeol-tags">{u.tags.map((t) => <span key={t}>{t}</span>)}</div>
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
