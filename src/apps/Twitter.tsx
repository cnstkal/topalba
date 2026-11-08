// @ts-nocheck
import { useState } from 'react'
import './Twitter.css'

/* X(트위터) 목업: 홈 타임라인 / 내 프로필 / 트윗 상세 / DM 목록·채팅만 동작, 나머지는 장식 */
const P = {
  home: 'M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.8-4.8',
  grok: 'M12 4a8 8 0 1 0 5.500 13.800M7 20 20 4', bell: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8zM10 21h4',
  chat: 'M12 3.500c4.700 0 8.500 3.200 8.500 7.500S16.700 18.500 12 18.500c-1 0-2-.15-2.900-.45L4.500 20l1.100-3.700C4.500 15 3.500 13.100 3.500 11c0-4.300 3.800-7.500 8.500-7.500z',
  rt: 'M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3', heart: 'M12 20s-8-4.800-8-10.500A4.500 4.500 0 0 1 12 7a4.500 4.500 0 0 1 8 2.500C20 15.200 12 20 12 20z',
  views: 'M6 20v-7M12 20V5M18 20v-10', mark: 'M6 3h12v18l-6-4.500L6 21z', share: 'M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  back: 'm15 5-7 7 7 7', dots: 'M5 12h.01M12 12h.01M19 12h.01', plus: 'M12 5v14M5 12h14', down: 'm6 9 6 6 6-6', right: 'm9 6 6 6-6 6',
  phone: 'M6 3h3l2 5-2 1.500a11 11 0 0 0 5.500 5.500L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z', video: 'M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3zM16 11l5-3v8l-5-3',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4', newchat: 'M12 3.500c4.700 0 8.500 3.200 8.500 7.500S16.700 18.500 12 18.500c-1 0-2-.15-2.900-.45L4.500 20l1.100-3.700C4.500 15 3.500 13.100 3.500 11c0-4.300 3.800-7.500 8.500-7.500zM17 2v5M14.500 4.500h5',
  bag: 'M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', pin: 'M12 21s-6-5.500-6-11a6 6 0 0 1 12 0c0 5.500-6 11-6 11z', cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  img: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.500h.01', poll: 'M5 7h8M5 12h14M5 17h10', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.500 3.500 3.500 14.500 0 18M12 3c-3.500 3.500-3.500 14.500 0 18', x: 'M6 6l12 12M18 6 6 18',
  post: 'M5 4h14v16H5zM9 9h6M9 13h4', reply: 'M12 3.500c4.700 0 8.500 3.200 8.500 7.500S16.700 18.500 12 18.500c-1 0-2-.15-2.900-.45L4.500 20l1.100-3.700C4.500 15 3.500 13.100 3.500 11c0-4.300 3.800-7.500 8.500-7.500z', media: 'M4 5h16v14H4zM10 9l5 3-5 3z',
}
const Ic = ({ n, s = 22, f, w = 1.8 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill={f ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={n === 'dots' ? 3 : w} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
const X = ({ s = 22 }) => <svg viewBox="0 0 24 24" width={s} height={s}><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
const Lock = () => <svg viewBox="0 0 24 24" width="15" height="15" className="lk"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="#000" strokeWidth="2.500" /><rect x="4.500" y="10" width="15" height="11" rx="3" fill="#000" /></svg>
const TweetText = ({ text = '' }) => text.split(/(#[가-힣A-Za-z0-9_]+)/g).map((part, i) => part.startsWith('#') ? <span key={i} className="lnk">{part}</span> : <span key={i}>{part}</span>)
const Vf = () => <svg viewBox="0 0 24 24" width="17" height="17" className="lk"><circle cx="12" cy="12" r="10" fill="#1d9bf0" /><path d="m7.500 12.500 3 3 6-6.500" stroke="#fff" strokeWidth="2.400" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>

/* 내 프로필 및 게시글 이미지 */
const MY_PROFILE_IMAGE = `${import.meta.env.BASE_URL}images/twitter/my/profile/DKi8pCTUEAA6X-o.webp`
const MY_POST_IMAGES = {
  1: `${import.meta.env.BASE_URL}images/twitter/my/post/1/00481b9f8659a8778f09b8638a60a0f5.jpg`,
  2: `${import.meta.env.BASE_URL}images/twitter/my/post/2/06b5fbbcbe1a9bb2d5f059ea9644654c.jpg`,
  3: `${import.meta.env.BASE_URL}images/twitter/my/post/3/25870163289db1d47f79e03e7a35c296.jpg`,
}
const MyAv = ({ s = 48 }) => <span className="myav"><Av corgi s={s} /><img src={MY_PROFILE_IMAGE} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} /></span>

/* 아바타 (전부 벡터) */
const Av = ({ c = '#8aa', s = 48, def, corgi, black }) => (
  <svg viewBox="0 0 48 48" width={s} height={s} className="av">
    <defs><clipPath id={'c' + s}><circle cx="24" cy="24" r="24" /></clipPath></defs>
    <g clipPath={`url(#c${s})`}>
      {black ? <rect width="48" height="48" fill="#000000" /> : corgi ? (<><rect width="48" height="48" fill="#35383f" /><path d="M8 18 6 5l11 5zM40 18 42 5 31 10z" fill="#d98a3b" /><circle cx="24" cy="25" r="15" fill="#e8a24a" /><path d="M24 14c5 0 7 4 7 9l-3 9h-8l-3-9c0-5 2-9 7-9z" fill="#fff" /><ellipse cx="24" cy="31" rx="7" ry="5.500" fill="#fff" /><circle cx="18" cy="23" r="2" fill="#222" /><circle cx="30" cy="23" r="2" fill="#222" /><ellipse cx="24" cy="29" rx="2.800" ry="2" fill="#222" /><path d="M12 12h24l-2-6H14z" fill="#b97a45" /></>)
        : (<><rect width="48" height="48" fill={def ? '#cfd9de' : c} /><circle cx="24" cy="19" r="8" fill={def ? '#5b7083' : 'rgba(255,255,255,.55)'} /><path d="M6 48c1-12 8-16 18-16s17 4 18 16z" fill={def ? '#5b7083' : 'rgba(255,255,255,.55)'} /></>)}
    </g>
  </svg>
)
const Me = ({ s = 32, onClick }) => <button className="me" onClick={onClick}><MyAv s={s} /></button>

/* 데이터 */
const TL = [
  { name: '현준', h: '1645612', t: '12분', text: '이제 슬슬 붕어빵 나오네', c: '#000000', black: 1, rts: 0, lk: 5, vw: 78 },
  { name: 'q', h: 'fptmxkdl', t: '1시간', text: '점메추좀', c: '#8b9b78', rp: 4, rts: 0, lk: 2, vw: 140 },
  { name: '쫑', h: 'jjong_444', t: '3시간', text: '지금 번개할 사람? 신림쪽인데', c: '#7d8797', rp: 8, rts: 4, lk: 48, vw: 402 },
  { name: 'miri', h: 'myluvno1_', t: '5시간', text: '아그만해아진짜반해버리기전에그만하라고', c: '#9b7d9f', rts: 204, lk: 583, vw: 3052, media: 1 },
  { name: '듀댕이', h: 'duuuuuuuuu_y', t: '어제', text: '#게친소\n솔크 싫어', c: '#607d86', rts: 9, lk: 20, vw: 329, media: 1 },
]
const PROF = [
  { text: '#ㄱㅊㅅ', imageId: 1, t: '2025. 3. 2.', rp: 4, rts: 205, lk: 1057, vw: 5032, media: 1 },
  { text: '', imageId: 2, t: '2025. 2. 14.', rp: 29, rts: 504, lk: 2361, vw: 7801, media: 1 },
  { text: '날씨 좋네', t: '2024. 12. 21.', rp: 12, rts: 6, lk: 273, vw: 2021 },
  { text: '', imageId: 3, t: '2024. 8. 9.', rp: 4, rts: 718, lk: 3047, vw: 9862, media: 1 },
]
const DM = [
  ['모르는사람', '방금', '안녕하세요 친해지고 싶어요', '#9a5a5a'],
  ['daily__jun', '3분', '몇 살이세요? 실례가 안 된다면', '#65758a'],
  ['오늘도출근', '18분', '혹시 디엠 자주 하세요?', '#b18a72'],
  ['honeytoast', '1시간', '사진 분위기 좋으시네요', '#7a6b8f'],
  ['익명', '어제', '연락하면서 지내고 싶어요', '#9a7777'],
  ['mood_00', '어제', '혹시 애인 있으세요?', '#607d79'],
  ['김도현', '2일', '안녕하세요ㅎㅎ', '#8b7968'],
  ['밤산책', '3일', '친하게 지내요!', '#53647c'],
  ['monday__', '1주', '몇 년생이세요?', '#a18c77'],
  ['bluehour', '1주', '답장 가능하실까요', '#776b8a'],
  ['no_name', '2주', '혹시 어디 사세요?', '#8c6f72'],
  ['새벽감성', '3주', '친해지고 싶어서 연락드렸어요', '#6b7d8d'],
  ['하루살이', '4주', '어디 사세요? 저 근처인데 우연히 마주칠 수도ㅎㅎ', '#7f6a8e'],
  ['꿀떡_s', '1개월', '사진 프로필 진짜 예뻐요 혹시 몇 살이에요', '#b07d6c'],
  ['sunny.side', '1개월', '저랑 친구 해요! 취미 얘기하고 싶어요', '#6f8c74'],
  ['ㅇㅇ_mm', '2개월', '어디야?', '#5f6b7a'],
  ['달빛산책러', '2개월', '혹시 서울 사세요? 같이 밥 먹을래요', '#4f6b8f'],
  ['익명의고양이', '3개월', '연락 좀 받아주시면 안 돼요?ㅠ', '#8a7a6a'],
]
const CHAT = [
  ['r', '안녕하세요! 친해지고 싶어서 디엠했어요'],
  ['r', '혹시 몇 살이세요?'],
  ['r', '답장 한 번만 부탁드려요ㅎㅎ'],
  ['r', '사진 잘 보고 있어요'],
  ['r', '시간 되면 만나서 커피라도 마실래요?'],
  ['r', '읽으셨는데 답이 없으시네ㅠ'],
]

const Act = ({ r, l, v, rp, bm = 1 }) => (
  <div className="act"><span><Ic n="reply" s={19} />{rp || ''}</span><span><Ic n="rt" s={19} />{r || ''}</span><span><Ic n="heart" s={19} />{l || ''}</span><span><Ic n="views" s={19} />{v || ''}</span>{bm && <Ic n="mark" s={19} />}<Ic n="share" s={19} /></div>
)

export default function Twitter() {
  const [sc, setSc] = useState('home'), [st, setSt] = useState([])
  const [draft, setDraft] = useState(''), [pic, setPic] = useState(false), [mine, setMine] = useState([]), [toast, setToast] = useState(false), [sheet, setSheet] = useState(false)
  const wl = [...draft].reduce((a, c) => a + (c.charCodeAt(0) > 0x10ff ? 2 : 1), 0), rem = 280 - wl
  const can = (draft.trim() || pic) && rem >= 0
  const post = () => {
    if (!can) return
    setMine([{ text: draft.trim(), t: '방금', media: pic ? 1 : 0, me: 1 }, ...mine])
    setDraft(''); setPic(false); setSt([]); setSc('home'); setToast(true); setTimeout(() => setToast(false), 3500)
  }
  const cancel = () => (draft.trim() || pic ? setSheet(true) : back())
  const to = (s) => { setSt([...st, sc]); setSc(s) }
  const back = () => { const p = st[st.length - 1] || 'home'; setSt(st.slice(0, -1)); setSc(p) }
  const tab = (s) => { setSt([]); setSc(s) }
  const Head = ({ title, left, right }) => <div className="th">{left || <button onClick={back}><Ic n="back" s={26} w={2.4} /></button>}<b>{title}</b>{right || <Ic n="dots" s={22} />}</div>

  let body
  if (sc === 'compose') {
    const col = rem < 0 ? '#f4212e' : rem <= 20 ? '#ffd400' : '#1d9bf0'
    body = (
      <div className="cp">
        <div className="cph"><button onClick={cancel}>취소</button><button className={'pst' + (can ? '' : ' off')} onClick={post}>게시하기</button></div>
        <div className="cpb sc">
          <Av corgi s={40} />
          <div className="cpm">
            <span className="aud">모든 사람 <Ic n="down" s={14} w={2.6} /></span>
            <textarea autoFocus rows={6} value={draft} placeholder="무슨 일이 일어나고 있나요?" onChange={(e) => setDraft(e.target.value)} />
            {pic && <div className="med cpp"><i /><button onClick={() => setPic(false)}><Ic n="x" s={18} w={2.6} /></button><em>ALT 추가</em></div>}
          </div>
        </div>
        <div className="rpl"><Ic n="globe" s={18} w={2} />모든 사람이 답글을 달 수 있습니다</div>
        <div className="cpt">
          <button onClick={() => setPic(true)}><Ic n="img" s={23} /></button>
          <button><b className="gif">GIF</b></button>
          <button><Ic n="poll" s={23} /></button>
          <button><Ic n="pin" s={23} /></button>
          <span className="sp" />
          {wl > 0 && (
            <svg viewBox="0 0 28 28" width="28" height="28" className="ring"><circle cx="14" cy="14" r="10" fill="none" stroke="#eff3f4" strokeWidth="2.5" /><circle cx="14" cy="14" r="10" fill="none" stroke={col} strokeWidth="2.5" strokeDasharray={`${Math.min(wl / 280, 1) * 62.83} 62.83`} transform="rotate(-90 14 14)" strokeLinecap="round" />{rem <= 20 && <text x="14" y="18" textAnchor="middle" fontSize="10" fill={rem < 0 ? col : '#536471'}>{rem}</text>}</svg>
          )}
          <i className="pl"><Ic n="plus" s={20} w={2.4} /></i>
        </div>
        {sheet && (
          <div className="shd" onClick={() => setSheet(false)}><div className="sht" onClick={(e) => e.stopPropagation()}>
            <p>게시물을 저장하시겠어요?</p><small>나중에 보내려면 임시 보관함에 저장하세요.</small>
            <button onClick={() => { setDraft(''); setPic(false); setSheet(false); back() }} className="dl">삭제</button>
            <button onClick={() => { setSheet(false); back() }}>임시 보관함에 저장</button>
            <button onClick={() => setSheet(false)} className="ln">취소</button>
          </div></div>
        )}
      </div>
    )
  } else if (sc === 'detail') {
    const t = TL[3]
    body = (
      <>
        <Head title="게시" right={<span />} />
        <div className="sc">
          <div className="dh"><Av c={t.c} s={48} /><div><b>{t.name}</b><span>@{t.h}</span></div><X s={24} /><i>.com</i></div>
          <p className="dt">{t.text}</p>
          <p className="dm">오후 4:11 · 2026. 11. 7. · 조회 <b>44만회</b></p>
          <div className="dc"><span><Ic n="reply" s={22} />1</span><span><Ic n="rt" s={22} />350</span><span><Ic n="heart" s={22} />2436</span><span><Ic n="mark" s={22} />184</span><Ic n="share" s={22} /></div>
          <div className="tw sm"><Av def s={48} /><div className="m"><p className="n"><b>j미호</b> <span>@jimin0524000 · 8시</span><em><Ic n="grok" s={18} /><Ic n="dots" s={18} /></em></p><p className="x">뭘 찾으신거에요 대체..</p><Act r="" l="50" v="5.8만" /></div></div>
        </div>
        <div className="rp"><Me s={36} /><span>답글 게시하기</span></div>
      </>
    )
  } else if (sc === 'profile') {
    body = (
      <div className="sc pf">
        <div className="ban"><button className="rb" onClick={back}><Ic n="back" s={24} w={2.4} /></button><button className="rb"><Ic n="search" s={22} w={2.4} /></button></div>
        <div className="pav"><MyAv s={80} /></div>
        <h1>ㅅㅎ</h1><p className="hd">@cnsjbqH72w</p>
        <p className="ml"><span><Ic n="bag" s={18} />기업가</span></p>
        <p className="ml"><span><Ic n="cal" s={18} />2023년 7월에 가입함 <Ic n="right" s={14} /></span></p>
        <p className="fw"><b>12</b> 팔로잉 <b>1972</b> 팔로워</p>
        <div className="pb"><span>프로필 공유</span><span>프로필 수정</span></div>
        <div className="pt"><span className="on"><Ic n="post" s={22} /> 게시물 <Ic n="down" s={14} /></span><Ic n="reply" s={22} /><Ic n="rt" s={22} /><Ic n="media" s={22} /></div>
        {[...mine, ...PROF].map((p, i) => (
          <div key={i} className="tw"><div className="lc"><MyAv s={48} />{p.thread && <u />}</div>
            <div className="m"><p className="n"><b>ㅅㅎ</b> <span>@cnsjbqH72w · {p.t}</span><em><X s={20} /></em></p>{p.text && <p className="x"><TweetText text={p.text} /></p>}{p.media && <div className="med"><img src={MY_POST_IMAGES[p.imageId]} alt="" /></div>}
              <Act r={p.rts} l={p.lk} v={p.vw} rp={p.rp} /></div></div>
        ))}
        <button className="fab" onClick={() => to('compose')}><Ic n="plus" s={30} w={2.2} /></button>
      </div>
    )
  } else if (sc === 'chat') {
    body = (
      <>
        <div className="th ch"><button onClick={back}><Ic n="back" s={26} w={2.4} /></button><Av c="#3b4559" s={32} /><b>DM</b><span className="sp" /><Ic n="phone" s={24} /><Ic n="video" s={26} /></div>
        <div className="sc msgs">{CHAT.map(([k, t, u], i) => k === 'd' ? <p key={i} className="dd">{t}</p> : k === 'rd' ? <p key={i} className="rd">{t}</p> : <div key={i} className={'bb ' + k}><span>{u ? <u>{t}</u> : t}</span></div>)}</div>
        <div className="ci"><i><Ic n="plus" s={26} w={2.2} /></i><span>쪽지<Ic n="mic" s={22} /></span></div>
      </>
    )
  } else if (sc === 'dm') {
    body = (
      <>
        <div className="th ch2"><Me s={32} onClick={() => to('profile')} /><b>Chat</b><span className="pill">전체 <Ic n="down" s={16} w={2.4} /></span></div>
        <div className="sc"><div className="sr"><Ic n="search" s={20} />검색</div>
          {DM.map(([n, t, m, c, go, vf, def]) => <div key={n} className="dr" onClick={() => to('chat')}><Av c={c} def={def} s={56} /><div className="m"><p><b>{n}</b>{vf ? <Vf /> : null}<span>{t}</span></p><small>{m}</small></div></div>)}
        </div>
        <button className="fab"><Ic n="newchat" s={28} w={2} /></button>
      </>
    )
  } else {
    body = (
      <>
        <div className="th hm"><Me s={32} onClick={() => to('profile')} /><X s={30} /><span className="sp" /></div>
        <div className="tabs"><span className="on">추천 <Ic n="down" s={16} w={2.4} /></span><span>팔로우 중</span><Ic n="plus" s={24} w={2.2} /></div>
        <div className="sc">
          {[...mine.map((m) => ({ ...m, name: 'ㅅㅎ', h: 'cnsjbqH72w', my: 1 })), ...TL].map((t, i) => (
            <div key={i} className="tw" onClick={t.detail ? () => to('detail') : undefined}><div className="lc">{t.my ? <MyAv s={48} /> : <Av c={t.c} def={t.def} corgi={t.corgi} black={t.black} s={48} />}</div>
              <div className="m">
                <p className="n"><b>{t.name}</b> <span>@{t.h} · {t.t}</span><em><X s={20} /></em></p>
                {t.text && <p className="x"><TweetText text={t.text} /></p>}
                {t.media && <div className="med"><img src={MY_POST_IMAGES[t.imageId]} alt="" /></div>}
                {t.q && <div className="qt"><p><Av def s={20} /> <b>{t.q.name}</b> <span>@{t.q.h} · {t.q.t}</span></p><p className="x"><TweetText text={t.q.text} /></p></div>}
                <Act r={t.rts} l={t.lk} v={t.vw} rp={t.rp} />
              </div></div>
          ))}
        </div>
        <button className="fab" onClick={() => to('compose')}><Ic n="plus" s={30} w={2.2} /></button>
      </>
    )
  }
  return (
    <div className="xapp">
      {body}
      {toast && <div className="toast">게시물을 전송했습니다<button onClick={() => { setSt(['home']); setSc('profile'); setToast(false) }}>보기</button></div>}
      {sc !== 'compose' && <nav className="tb2">{[['home'], ['search'], ['grok'], ['bell'], ['chat']].map(([i], x) => (
        <button key={x} onClick={x === 0 ? () => tab('home') : x === 4 ? () => tab('dm') : undefined}>
          <Ic n={i} s={27} w={2} f={(x === 0 && ['home', 'profile', 'detail'].includes(sc)) || (x === 4 && ['dm', 'chat'].includes(sc))} />
          {x === 0 && sc !== 'dm' && sc !== 'chat' && <u />}{x === 2 && <b>1</b>}
        </button>))}</nav>}
    </div>
  )
}
