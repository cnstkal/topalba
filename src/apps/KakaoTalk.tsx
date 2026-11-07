import { useEffect, useMemo, useRef, useState } from 'react'
import './KakaoTalk.css'

type Msg = { id: number; who: string; text?: string; img?: string; t: number; reply?: string }
type Room = { id: string; name: string; group: boolean; members: number; pinned: boolean; muted: boolean; unread: number; msgs: Msg[] }
type Me = { name: string; status: string; music: string; photo?: string; bg?: string }
type Store = { me: Me; rooms: Room[]; collapsed: boolean }

const KEY = 'kakaotalk-v1'
const COLORS = ['#f4b942', '#7cc4a4', '#8ab4f8', '#e8908f', '#b79ced', '#9fb7c4', '#f2a07b', '#8fcf6f']
const color = (s: string) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]

const FRIENDS: [string, string][] = [
  ['김민준', '오늘도 출근 완료'], ['이서연', '커피 수혈 중 ☕'], ['박지호', '주말엔 등산 갑니다'], ['최유진', '졸업 논문 마무리 단계'],
  ['정다은', '고양이 집사 3년차'], ['강현우', '러닝 크루 모집해요'], ['조수빈', '여행 계획 짜는 중'], ['윤재민', '야근은 사랑입니다'],
  ['임하늘', '맛집 발견하면 공유할게'], ['한소희', '요즘 필라테스에 빠짐'], ['오승준', '월요일은 언제 끝나나'], ['서지안', '책 읽는 중 📖'],
  ['신예린', '비 오는 날이 좋아요'], ['권태양', '게임 한 판만 더'], ['황나연', '이사 준비로 정신없음'], ['안도윤', '조용히 살고 싶다'],
  ['송채원', '오늘 하루도 수고했어'], ['류시우', '자격증 공부 중입니다'], ['문가은', '베이킹 연습 중 🍪'], ['배준서', '퇴근하고 한잔?'],
  ['남지후', '카메라 들고 산책'], ['노은서', '다이어트는 내일부터'], ['홍유나', '새 직장 적응 중'], ['전민재', '운동 3일차 포기 직전'], ['고서윤', '주말 약속 있어요'],
]
const ROOMS: { n: string; g: number; m: [string, string][] }[] = [
  { n: '김민준', g: 0, m: [['김민준', '야 이번 주말에 시간 돼?'], ['me', '토요일은 괜찮은데 왜?'], ['김민준', '새로 생긴 고깃집 가보려고. 예약 가능한지 전화해볼게'], ['me', '좋지 몇 시쯤 생각해?'], ['김민준', '6시쯤? 웨이팅 길다더라'], ['me', '그럼 5시 반에 가서 줄 서자'], ['김민준', '오케이 내가 먼저 도착하면 연락할게'], ['me', '고마워 ㅋㅋ 그럼 토요일에 보자']] },
  { n: '이서연', g: 0, m: [['me', '자기야 오늘 퇴근 몇 시에 해?'], ['이서연', '7시쯤 끝날 것 같아. 저녁 뭐 먹을까'], ['me', '오늘은 파스타 어때? 회사 앞에 새로 생겼대'], ['이서연', '좋아! 근데 나 오늘 좀 피곤해서 일찍 들어가고 싶어'], ['me', '그럼 밥만 먹고 바로 데려다줄게'], ['이서연', '고마워 사랑해 ❤️'], ['me', '나도 사랑해. 이따 봐']] },
  { n: '엄마', g: 0, m: [['엄마', '아들 밥은 먹고 다니니?'], ['me', '네 먹었어요. 걱정 마세요'], ['엄마', '이번 주 일요일에 올 수 있어? 할머니 생신이야'], ['me', '아 맞다 일요일이었죠. 점심 전에 갈게요'], ['엄마', '그래 케이크는 아빠가 사오신대'], ['me', '그럼 저는 과일 좀 사 갈게요'], ['엄마', '고맙다 운전 조심해서 와']] },
  { n: '대학 동기 모임', g: 6, m: [['박지호', '다들 연말 모임 날짜 정하자'], ['최유진', '12월 셋째 주 금요일 어때?'], ['강현우', '나 그날 회식이라 힘들 듯'], ['me', '그럼 토요일로 바꾸면 어때?'], ['정다은', '토요일 좋아요! 장소는 강남 쪽?'], ['박지호', '강남은 비싸니까 건대 쪽으로 가자'], ['최유진', '건대 좋아. 내가 예약해둘게'], ['강현우', '토요일이면 나도 가능!'], ['me', '그럼 12월 20일 토요일 건대로 확정']] },
  { n: '팀 프로젝트방', g: 5, m: [['윤재민', '내일 발표 자료 최종본 올렸어요'], ['임하늘', '확인했습니다. 3페이지 수치만 수정해주세요'], ['me', '제가 바로 고칠게요'], ['윤재민', '발표는 누가 하죠?'], ['임하늘', '민철 님이 하시는 게 좋을 것 같아요'], ['me', '리허설은 오전 10시에 해요'], ['윤재민', '네 알겠습니다']] },
  { n: '한소희', g: 0, m: [['한소희', '필라테스 같이 등록할래?'], ['me', '얼마야? 체험 수업도 있어?'], ['한소희', '첫 수업은 무료래. 이번 주 목요일 저녁 가능?'], ['me', '목요일 7시 가능해'], ['한소희', '그럼 예약해둘게']] },
  { n: '가족방', g: 4, m: [['아빠', '이번 주말 날씨 좋다더라'], ['엄마', '그럼 할머니 댁에 같이 가요'], ['me', '저는 일요일 오전에 도착해요'], ['동생', '나는 알바 끝나고 저녁에 갈게'], ['아빠', '그래 운전 조심하고']] },
  { n: '조수빈', g: 0, m: [['조수빈', '제주도 항공권 알아봤어?'], ['me', '응 금요일 아침 비행기가 제일 싸더라'], ['조수빈', '숙소는 협재 쪽이 좋대'], ['me', '렌터카는 내가 예약할게'], ['조수빈', '완벽해 ㅋㅋ']] },
  { n: '러닝 크루', g: 12, m: [['강현우', '이번 일요일 한강 10km 달립니다'], ['신예린', '저는 5km만 뛸게요'], ['me', '저는 7시 집결 가능해요'], ['권태양', '끝나고 해장국 갑시다'], ['강현우', '좋아요 장소는 제가 정할게요']] },
  { n: '오승준', g: 0, m: [['오승준', '형 이번 주 스터디 오는 거 맞지?'], ['me', '응 당연하지. 자료는 준비했어'], ['오승준', '나 아직 3장 못 읽었어 ㅠㅠ'], ['me', '요약본 보내줄게']] },
  { n: '서지안', g: 0, m: [['서지안', '추천해준 책 다 읽었어'], ['me', '어땠어? 결말이 좀 의외지?'], ['서지안', '진짜 소름이었어. 다음 책도 추천해줘'], ['me', '이번엔 에세이 어때?']] },
  { n: '동네 이웃방', g: 18, m: [['황나연', '이번 주 분리수거 날 변경됐나요?'], ['안도윤', '화요일에서 수요일로 바뀌었어요'], ['송채원', '공지 올려주셔서 감사합니다'], ['me', '확인했습니다']] },
  { n: '스터디 모임', g: 7, m: [['류시우', '오늘 스터디 7시 맞나요?'], ['문가은', '네 도서관 2층에서 만나요'], ['me', '조금 늦을 수도 있어요'], ['류시우', '괜찮아요 천천히 오세요']] },
  { n: '배준서', g: 0, m: [['배준서', '퇴근하고 한잔 콜?'], ['me', '오늘은 힘들어 내일은?'], ['배준서', '내일 좋아 장소는 어디로?'], ['me', '회사 앞 포차 가자']] },
  { n: '남지후', g: 0, m: [['남지후', '어제 찍은 사진 보내줄게'], ['me', '빨리 보여줘 기대돼'], ['남지후', '노을 진짜 예쁘게 나왔어']] },
  { n: '고서윤', g: 0, m: [['고서윤', '주말 약속 시간 바뀌었어'], ['me', '몇 시로?'], ['고서윤', '3시에서 4시로!'], ['me', '알겠어 그때 보자']] },
]
const OPEN = [
  ['🎤 아이돌 직캠 수다방', '아이돌 / 팬덤', 8421, '무대 직캠 같이 보고 이야기해요', ['#직캠', '#팬덤']],
  ['☕ 카페 탐방러 모임', '맛집 / 카페', 3210, '서울 감성 카페 정보 공유', ['#카페', '#서울']],
  ['🏃 한강 러닝 크루', '운동', 1894, '매주 일요일 아침 한강 러닝', ['#러닝', '#한강']],
  ['🎮 롤 듀오 구해요', '취미 / 게임', 5602, '티어 상관없이 즐겜 유저 환영', ['#게임', '#듀오']],
  ['📚 대학생 시간표 공유방', '대학생', 12033, '수강신청 팁과 강의 후기', ['#대학생', '#수강신청']],
  ['✈️ 혼행 여행자 모임', '여행', 2740, '혼자 여행 다니는 사람들의 정보방', ['#혼행', '#여행']],
  ['🍜 맛집 지도 공유방', '맛집 / 카페', 6112, '전국 숨은 맛집을 모아요', ['#맛집', '#전국']],
  ['💪 헬스 3대 500 도전', '운동', 4388, '운동 기록 인증하고 서로 응원', ['#헬스', '#인증']],
  ['🏠 분당 맘카페 수다', '지역 모임', 2209, '분당 지역 육아 정보 공유', ['#분당', '#육아']],
  ['💬 퇴근 후 일상 수다', '일상 / 수다', 9150, '퇴근하고 편하게 수다 떨어요', ['#일상', '#수다']],
  ['🎬 영화 감상 토론방', '취미 / 게임', 1670, '개봉작 후기와 추천 이야기', ['#영화', '#후기']],
  ['🌿 부산 지역 친구 만들기', '지역 모임', 3507, '부산 사는 사람들의 번개 모임', ['#부산', '#번개']],
] as const

const pad = (n: number) => String(n).padStart(2, '0')
const fmtT = (t: number) => { const d = new Date(t); const h = d.getHours(); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}` }
const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` }
const listT = (t: number) => { const d = new Date(), x = new Date(t); return d.toDateString() === x.toDateString() ? fmtT(t) : `${x.getMonth() + 1}월 ${x.getDate()}일` }

function seed(): Store {
  const now = Date.now()
  const rooms: Room[] = ROOMS.map((r, i) => {
    let t = now - (i * 3 + 1) * 3600e3 * 5 - r.m.length * 25 * 60e3
    const msgs = r.m.map(([who, text], k) => { t += (8 + ((i * 7 + k * 13) % 40)) * 60e3; return { id: i * 100 + k, who, text, t } })
    return { id: 'r' + i, name: r.n, group: r.g > 0, members: r.g || 2, pinned: i < 2, muted: false, unread: i % 4 === 1 ? (i % 3) + 1 : 0, msgs }
  })
  return { me: { name: '나', status: '오늘도 좋은 하루', music: '' }, rooms, collapsed: false }
}
function load(): Store {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch { /* ignore */ }
  return seed()
}

const Avatar = ({ name, src, size = 44 }: { name: string; src?: string; size?: number }) => (
  <div className="kakaotalk-avatar" style={{ width: size, height: size, background: color(name), fontSize: size * 0.4 }}>
    {src ? <img src={src} alt="" /> : name.slice(0, 1)}
  </div>
)
const readFile = (f: File, cb: (s: string) => void) => { const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(f) }

export default function KakaoTalk({ close }: { params?: unknown; close?: () => void }) {
  const [st, setSt] = useState<Store>(load)
  const [tab, setTab] = useState<'friends' | 'chats' | 'open'>('friends')
  const [view, setView] = useState<{ t: 'room' | 'profile' | 'edit'; id?: string } | null>(null)
  const [q, setQ] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* quota */ } }, [st])

  const patchRoom = (id: string, f: (r: Room) => Room) => setSt(s => ({ ...s, rooms: s.rooms.map(r => (r.id === id ? f(r) : r)) }))
  const openDM = (name: string) => {
    let r = st.rooms.find(x => !x.group && x.name === name)
    if (!r) {
      r = { id: 'r' + Date.now(), name, group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: [] }
      const nr = r
      setSt(s => ({ ...s, rooms: [nr, ...s.rooms] }))
    }
    setView({ t: 'room', id: r.id })
  }

  const rooms = useMemo(() => st.rooms.filter(r => r.name.includes(q)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.msgs.at(-1)?.t ?? 0) - (a.msgs.at(-1)?.t ?? 0)), [st.rooms, q])
  const friends = FRIENDS.filter(([n, s]) => n.includes(q) || s.includes(q))
  const fav = friends.slice(0, 3)
  const room = view?.t === 'room' ? st.rooms.find(r => r.id === view.id) : undefined

  return (
    <div className="kakaotalk">
      <div className="kakaotalk-main">
        <div className="kakaotalk-head">
          <h1>{tab === 'friends' ? '친구' : tab === 'chats' ? '채팅' : '오픈채팅'}</h1>
          <button onClick={() => close?.()}>닫기</button>
        </div>
        {tab !== 'open' && <input className="kakaotalk-search" placeholder={tab === 'friends' ? '이름, 상태 메시지 검색' : '채팅방 이름 검색'} value={q} onChange={e => setQ(e.target.value)} />}
        <div className="kakaotalk-scroll">
          {tab === 'friends' && (
            <>
              <div className="kakaotalk-row" onClick={() => setView({ t: 'edit' })}>
                <Avatar name={st.me.name} src={st.me.photo} size={54} />
                <div><b>{st.me.name}</b><p>{st.me.status}</p></div>
              </div>
              <div className="kakaotalk-sec">생일인 친구</div>
              <div className="kakaotalk-row" onClick={() => setView({ t: 'profile', id: FRIENDS[4][0] })}><Avatar name={FRIENDS[4][0]} /><div><b>{FRIENDS[4][0]}</b><p>오늘 생일이에요 🎂</p></div></div>
              <div className="kakaotalk-sec">즐겨찾기 {fav.length}</div>
              {fav.map(([n, s]) => <FriendRow key={'f' + n} n={n} s={s} onOpen={() => setView({ t: 'profile', id: n })} />)}
              <div className="kakaotalk-sec kakaotalk-fold" onClick={() => setSt({ ...st, collapsed: !st.collapsed })}>친구 {friends.length} {st.collapsed ? '▾' : '▴'}</div>
              {!st.collapsed && friends.map(([n, s]) => <FriendRow key={n} n={n} s={s} onOpen={() => setView({ t: 'profile', id: n })} />)}
            </>
          )}
          {tab === 'chats' && rooms.map(r => {
            const l = r.msgs.at(-1)
            return (
              <div key={r.id} className="kakaotalk-row" onClick={() => { patchRoom(r.id, x => ({ ...x, unread: 0 })); setView({ t: 'room', id: r.id }) }}>
                <Avatar name={r.name} />
                <div className="kakaotalk-grow">
                  <b>{r.name}{r.group && <i> {r.members}</i>}{r.muted && ' 🔕'}{r.pinned && ' 📌'}</b>
                  <p>{l ? (l.img ? '사진' : l.text) : '대화를 시작해 보세요'}</p>
                </div>
                <div className="kakaotalk-meta"><span>{l ? listT(l.t) : ''}</span>{r.unread > 0 && <em>{r.unread}</em>}</div>
              </div>
            )
          })}
          {tab === 'open' && (
            <>
              {['인기 오픈채팅', '추천 오픈채팅'].map((h, k) => (
                <div key={h}>
                  <div className="kakaotalk-sec">{h}</div>
                  {OPEN.slice(k * 6, k * 6 + 6).map(o => (
                    <div key={o[0]} className="kakaotalk-row kakaotalk-static">
                      <div className="kakaotalk-open-img" style={{ background: color(o[0]) }}>{o[0].slice(0, 2)}</div>
                      <div className="kakaotalk-grow"><b>{o[0].slice(3)}</b><p>{o[3]}</p><small>{o[1]} · {o[2].toLocaleString()}명 · {o[4].join(' ')}</small></div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
        <div className="kakaotalk-tabs">
          {([['friends', '친구', '👤'], ['chats', '채팅', '💬'], ['open', '오픈채팅', '🗨️']] as const).map(([k, l, i]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setQ('') }}><span>{i}</span>{l}</button>
          ))}
          <button className="kakaotalk-disabled" aria-disabled="true"><span>🛍️</span>쇼핑</button>
          <button className="kakaotalk-disabled" aria-disabled="true"><span>⋯</span>더보기</button>
        </div>
      </div>

      {view?.t === 'profile' && (() => {
        const f = FRIENDS.find(x => x[0] === view.id)!
        return (
          <div className="kakaotalk-page kakaotalk-profile">
            <button className="kakaotalk-x" onClick={() => setView(null)}>✕</button>
            <div className="kakaotalk-pcenter"><Avatar name={f[0]} size={96} /><h2>{f[0]}</h2><p>{f[1]}</p></div>
            <button className="kakaotalk-primary" onClick={() => openDM(f[0])}>1:1 채팅</button>
          </div>
        )
      })()}
      {view?.t === 'edit' && <EditProfile me={st.me} onSave={me => { setSt({ ...st, me }); setView(null) }} onBack={() => setView(null)} />}
      {room && <ChatRoom key={room.id} room={room} me={st.me} onBack={() => setView(null)} patch={f => patchRoom(room.id, f)} onLeave={() => { setSt(s => ({ ...s, rooms: s.rooms.filter(r => r.id !== room.id) })); setView(null) }} />}
    </div>
  )
}

function FriendRow({ n, s, onOpen }: { n: string; s: string; onOpen: () => void }) {
  return <div className="kakaotalk-row" onClick={onOpen}><Avatar name={n} /><div><b>{n}</b><p>{s}</p></div></div>
}

function EditProfile({ me, onSave, onBack }: { me: Me; onSave: (m: Me) => void; onBack: () => void }) {
  const [m, setM] = useState(me)
  return (
    <div className="kakaotalk-page">
      <div className="kakaotalk-head"><button onClick={onBack}>취소</button><h1>프로필 편집</h1><button onClick={() => onSave(m)}>완료</button></div>
      <div className="kakaotalk-scroll kakaotalk-form">
        <div className="kakaotalk-preview" style={m.bg ? { backgroundImage: `url(${m.bg})` } : undefined}>
          <Avatar name={m.name} src={m.photo} size={72} /><b>{m.name}</b><p>{m.status}</p>{m.music && <small>🎵 {m.music}</small>}
        </div>
        <label>프로필 사진<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && readFile(e.target.files[0], photo => setM({ ...m, photo }))} /></label>
        <label>배경 이미지<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && readFile(e.target.files[0], bg => setM({ ...m, bg }))} /></label>
        <label>이름<input value={m.name} maxLength={20} onChange={e => setM({ ...m, name: e.target.value })} /></label>
        <label>상태 메시지<input value={m.status} maxLength={60} onChange={e => setM({ ...m, status: e.target.value })} /></label>
        <label>프로필 뮤직<input value={m.music} placeholder="곡명 - 가수" onChange={e => setM({ ...m, music: e.target.value })} /></label>
      </div>
    </div>
  )
}

const EMOJI = ['😀', '😂', '🥰', '😎', '😭', '👍', '🙏', '🔥', '🎉', '❤️', '😴', '🤔']

function ChatRoom({ room, me, onBack, patch, onLeave }: { room: Room; me: Me; onBack: () => void; patch: (f: (r: Room) => Room) => void; onLeave: () => void }) {
  const [text, setText] = useState('')
  const [menu, setMenu] = useState<Msg | null>(null)
  const [reply, setReply] = useState<Msg | null>(null)
  const [emo, setEmo] = useState(false)
  const [more, setMore] = useState(false)
  const [sq, setSq] = useState<string | null>(null)
  const [big, setBig] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const timer = useRef<number>(0)
  useEffect(() => { end.current?.scrollIntoView() }, [room.msgs.length])

  const send = (m: Partial<Msg>) => patch(r => ({ ...r, msgs: [...r.msgs, { id: Date.now(), who: 'me', t: Date.now(), reply: reply ? (reply.text || '사진') : undefined, ...m }] }))
  const submit = () => { const v = text.trim(); if (!v) return; send({ text: v }); setText(''); setReply(null) }
  const press = (m: Msg) => { timer.current = window.setTimeout(() => setMenu(m), 450) }
  const msgs = sq ? room.msgs.filter(m => m.text?.includes(sq)) : room.msgs

  return (
    <div className="kakaotalk-page kakaotalk-room">
      <div className="kakaotalk-head">
        <button onClick={onBack}>‹</button>
        <h1>{room.name}{room.group && <i> {room.members}</i>}</h1>
        <button onClick={() => setSq(sq === null ? '' : null)}>🔍</button>
        <button onClick={() => setMore(!more)}>≡</button>
      </div>
      {sq !== null && <input className="kakaotalk-search" autoFocus placeholder="대화 내용 검색" value={sq} onChange={e => setSq(e.target.value)} />}
      {more && (
        <div className="kakaotalk-pop">
          <button onClick={() => { patch(r => ({ ...r, muted: !r.muted })); setMore(false) }}>{room.muted ? '알림 켜기' : '알림 끄기'}</button>
          <button onClick={() => { patch(r => ({ ...r, pinned: !r.pinned })); setMore(false) }}>{room.pinned ? '고정 해제' : '상단 고정'}</button>
          <button onClick={() => { const n = window.prompt('채팅방 이름', room.name); if (n?.trim()) patch(r => ({ ...r, name: n.trim() })); setMore(false) }}>이름 변경</button>
          <button onClick={() => { if (window.confirm('채팅방을 나가시겠어요?')) onLeave() }}>채팅방 나가기</button>
        </div>
      )}
      <div className="kakaotalk-scroll kakaotalk-chat" onClick={() => { setMore(false); setEmo(false) }}>
        {msgs.map((m, i) => {
          const mine = m.who === 'me', newDay = i === 0 || dayKey(msgs[i - 1].t) !== dayKey(m.t)
          const first = !mine && room.group && (i === 0 || msgs[i - 1].who !== m.who)
          return (
            <div key={m.id}>
              {newDay && <div className="kakaotalk-day">{dayKey(m.t)}</div>}
              <div className={`kakaotalk-msg ${mine ? 'me' : ''}`}>
                {!mine && <Avatar name={m.who} size={36} />}
                <div>
                  {!mine && (room.group || first) && <small className="kakaotalk-who">{m.who}</small>}
                  <div className="kakaotalk-line">
                    {mine && <span className="kakaotalk-time">{i === msgs.length - 1 ? '1 ' : ''}{fmtT(m.t)}</span>}
                    <div className="kakaotalk-bubble" onTouchStart={() => press(m)} onTouchEnd={() => clearTimeout(timer.current)} onContextMenu={e => { e.preventDefault(); setMenu(m) }}>
                      {m.reply && <div className="kakaotalk-quote">↩ {m.reply}</div>}
                      {m.img ? <img src={m.img} alt="" onClick={() => setBig(m.img!)} /> : m.text}
                    </div>
                    {!mine && <span className="kakaotalk-time">{fmtT(m.t)}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {reply && <div className="kakaotalk-replybar">↩ {reply.text || '사진'}<button onClick={() => setReply(null)}>✕</button></div>}
      {emo && <div className="kakaotalk-emo">{EMOJI.map(e => <button key={e} onClick={() => { send({ text: e }); setEmo(false) }}>{e}</button>)}</div>}
      <div className="kakaotalk-input">
        <label className="kakaotalk-plus">＋<input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, img => send({ img })); e.target.value = '' }} /></label>
        <textarea rows={1} value={text} placeholder="메시지 입력" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }} />
        <button onClick={() => setEmo(!emo)}>🙂</button>
        <button className={`kakaotalk-send ${text.trim() ? 'on' : ''}`} onClick={submit}>전송</button>
      </div>
      {menu && (
        <div className="kakaotalk-dim" onClick={() => setMenu(null)}>
          <div className="kakaotalk-menu" onClick={e => e.stopPropagation()}>
            <button onClick={() => { navigator.clipboard?.writeText(menu.text || '').catch(() => {}); setMenu(null) }}>복사</button>
            <button onClick={() => { setReply(menu); setMenu(null) }}>답장</button>
            <button onClick={() => { patch(r => ({ ...r, msgs: r.msgs.filter(x => x.id !== menu.id) })); setMenu(null) }}>삭제</button>
          </div>
        </div>
      )}
      {big && <div className="kakaotalk-dim" onClick={() => setBig(null)}><img className="kakaotalk-big" src={big} alt="" /></div>}
    </div>
  )
}
