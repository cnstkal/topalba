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
  post: 'M5 4h14v16H5zM9 9h6M9 13h4', reply: 'M12 3.500c4.700 0 8.500 3.200 8.500 7.500S16.700 18.500 12 18.500c-1 0-2-.15-2.900-.45L4.500 20l1.100-3.700C4.500 15 3.500 13.100 3.500 11c0-4.300 3.800-7.500 8.500-7.500z', media: 'M4 5h16v14H4zM10 9l5 3-5 3z',
}
const Ic = ({ n, s = 22, f, w = 1.8 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill={f ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={n === 'dots' ? 3 : w} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
const X = ({ s = 22 }) => <svg viewBox="0 0 24 24" width={s} height={s}><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
const Lock = () => <svg viewBox="0 0 24 24" width="15" height="15" className="lk"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="#000" strokeWidth="2.500" /><rect x="4.500" y="10" width="15" height="11" rx="3" fill="#000" /></svg>
const Vf = () => <svg viewBox="0 0 24 24" width="17" height="17" className="lk"><circle cx="12" cy="12" r="10" fill="#1d9bf0" /><path d="m7.500 12.500 3 3 6-6.500" stroke="#fff" strokeWidth="2.400" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>

/* 아바타 (전부 벡터) */
const Av = ({ c = '#8aa', s = 48, def, corgi }) => (
  <svg viewBox="0 0 48 48" width={s} height={s} className="av">
    <defs><clipPath id={'c' + s}><circle cx="24" cy="24" r="24" /></clipPath></defs>
    <g clipPath={`url(#c${s})`}>
      {corgi ? (<><rect width="48" height="48" fill="#35383f" /><path d="M8 18 6 5l11 5zM40 18 42 5 31 10z" fill="#d98a3b" /><circle cx="24" cy="25" r="15" fill="#e8a24a" /><path d="M24 14c5 0 7 4 7 9l-3 9h-8l-3-9c0-5 2-9 7-9z" fill="#fff" /><ellipse cx="24" cy="31" rx="7" ry="5.500" fill="#fff" /><circle cx="18" cy="23" r="2" fill="#222" /><circle cx="30" cy="23" r="2" fill="#222" /><ellipse cx="24" cy="29" rx="2.800" ry="2" fill="#222" /><path d="M12 12h24l-2-6H14z" fill="#b97a45" /></>)
        : (<><rect width="48" height="48" fill={def ? '#cfd9de' : c} /><circle cx="24" cy="19" r="8" fill={def ? '#5b7083' : 'rgba(255,255,255,.55)'} /><path d="M6 48c1-12 8-16 18-16s17 4 18 16z" fill={def ? '#5b7083' : 'rgba(255,255,255,.55)'} /></>)}
    </g>
  </svg>
)
const Me = ({ s = 32, onClick }) => <button className="me" onClick={onClick}><Av c="#3a4a78" s={s} /></button>

/* 데이터 */
const TL = [
  { rt: '샤림보르기니 님이 재게시함', name: '뉴해피', vf: 1, h: 'IF_SU_SH_', t: '5시', text: '프라우드!!!!!! 제스트!!!!!!!!!\n티원이 화물맵을 이겼습니다!!!!!!!!', def: 1, media: 1, rts: 27, lk: 24, vw: 1333 },
  { name: '루!!', lock: 1, h: 'rxzcos', t: '2분', text: '제 침대에 강아지님이 방문해 주셨어요ㅠㅠ', c: '#c98a6a', vw: 5, dimRt: 1 },
  { rt: '빙빙이(상태:나우아임엄) 님이 재게시함', name: '아지', h: 'qdmoar', t: '1일', text: '말투가 거의 뭐 남자 없냐, 남자급', c: '#b8636e', q: { name: '우태정', h: 'tlqkftoRl44', t: '1일', text: '씨발… 군대 안 오냐, 군대?' }, rts: '2222', lk: '1.1만', vw: '22만' },
  { name: '배르트', h: 'baeerlt', t: '1일', text: '좆같네 진짜\n실친 트위터 계정 찾아버림\n근데 그걸로 놀릴 수준의 계정이 아니었음\n진지하게 아는 척 했다가 연 끊길 만한....', c: '#4a3524', detail: 1, rts: 350, lk: 2436, vw: '44만' },
]
const PROF = [
  { text: 'nadeu_u', t: '2026. 1. 31.', vw: 46 }, { link: 'saju-kid.com/share/4c25949d…', t: '2026. 1. 23.', rp: 1, vw: 78, thread: 1 }, { link: 'saju-kid.com/share/1af600a6…', t: '2026. 4. 6.', rp: 1, vw: 45 },
]
const DM = [
  ['밥', '3일', '게시물을 보냈습니다', '#9a5a5a'], ['렙', '1주', '팔신걸어져', '#3b4559', 'chat'], ['윤호체크무늬빤츄통꼬츄홍중소츄성화…', '3주', 'ㅎㅎㅎ', '#555a6a'], ['샤림보르기니', '4주', 'ㅎㅎ', '#f5d24a'],
  ['떠', '5주', '어머어머 완전환영이지^^', '#f6cfd6'], ['ももうさぎ', '6주', 'もちろんです', '#7a5a42', 0, 1], ['루루', '', '', '', 0, 0, 1],
]
const CHAT = [
  ['r', '정혁이개패버릴거야..'], ['l', '나또실물보면 좋다고 헤벌레할거같아서 더 슬픔'], ['r', '백퍼.'], ['l', '헐…'], ['d', '10월 26일 (월) 오후 10:19'],
  ['l', '새로운최애를 박는 삐계만들었오'], ['l', '오고싶음오고, 안와두댐'], ['l', '@ubexhg', 1], ['r', '당연히가야지씨빠^^'], ['r', '팔신걸어져'], ['rd', '읽음'],
]

const Act = ({ r, l, v, rp, bm = 1 }) => (
  <div className="act"><span><Ic n="reply" s={19} />{rp || ''}</span><span className={r === 0 ? 'dim' : ''}><Ic n="rt" s={19} />{r}</span><span><Ic n="heart" s={19} />{l}</span><span><Ic n="views" s={19} />{v}</span>{bm && <Ic n="mark" s={19} />}<Ic n="share" s={19} /></div>
)

export default function Twitter() {
  const [sc, setSc] = useState('home'), [st, setSt] = useState([])
  const to = (s) => { setSt([...st, sc]); setSc(s) }
  const back = () => { const p = st[st.length - 1] || 'home'; setSt(st.slice(0, -1)); setSc(p) }
  const tab = (s) => { setSt([]); setSc(s) }
  const Head = ({ title, left, right }) => <div className="th">{left || <button onClick={back}><Ic n="back" s={26} w={2.4} /></button>}<b>{title}</b>{right || <Ic n="dots" s={22} />}</div>

  let body
  if (sc === 'detail') {
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
        <div className="pav"><Av corgi s={80} /></div>
        <h1>sa <Lock /></h1><p className="hd">@jukee_3</p>
        <p className="ml"><span><Ic n="bag" s={18} />기업가</span><span><Ic n="pin" s={18} />생일: 1994년 1월 16일</span></p>
        <p className="ml"><span><Ic n="cal" s={18} />2020년 2월에 가입함 <Ic n="right" s={14} /></span></p>
        <p className="fw"><b>55</b> 팔로잉 <b>0</b> 팔로워</p>
        <div className="pb"><span>프로필 공유</span><span>프로필 수정</span></div>
        <div className="pt"><span className="on"><Ic n="post" s={22} /> 게시물 <Ic n="down" s={14} /></span><Ic n="reply" s={22} /><Ic n="rt" s={22} /><Ic n="media" s={22} /></div>
        {PROF.map((p, i) => (
          <div key={i} className="tw"><div className="lc"><Av corgi s={48} />{p.thread && <u />}</div>
            <div className="m"><p className="n"><b>sa</b> <Lock /> <span>@jukee_3 · {p.t}</span><em><X s={20} /></em></p>{p.text ? <p className="x">{p.text}</p> : <p className="x lnk">{p.link}</p>}
              <Act r="" l="" v={p.vw} rp={p.rp} /></div></div>
        ))}
        <button className="fab"><Ic n="plus" s={30} w={2.2} /></button>
      </div>
    )
  } else if (sc === 'chat') {
    body = (
      <>
        <div className="th ch"><button onClick={back}><Ic n="back" s={26} w={2.4} /></button><Av c="#3b4559" s={32} /><b>렙</b><span className="sp" /><Ic n="phone" s={24} /><Ic n="video" s={26} /></div>
        <div className="sc msgs">{CHAT.map(([k, t, u], i) => k === 'd' ? <p key={i} className="dd">{t}</p> : k === 'rd' ? <p key={i} className="rd">{t}</p> : <div key={i} className={'bb ' + k}><span>{u ? <u>{t}</u> : t}</span></div>)}</div>
        <div className="ci"><i><Ic n="plus" s={26} w={2.2} /></i><span>쪽지<Ic n="mic" s={22} /></span></div>
      </>
    )
  } else if (sc === 'dm') {
    body = (
      <>
        <div className="th ch2"><Me s={32} onClick={() => to('profile')} /><b>Chat</b><span className="pill">전체 <Ic n="down" s={16} w={2.4} /></span></div>
        <div className="sc"><div className="sr"><Ic n="search" s={20} />검색</div>
          {DM.map(([n, t, m, c, go, vf, def]) => <div key={n} className="dr" onClick={go ? () => to('chat') : undefined}><Av c={c} def={def} s={56} /><div className="m"><p><b>{n}</b>{vf ? <Vf /> : null}<span>{t}</span></p><small>{m}</small></div></div>)}
        </div>
        <button className="fab"><Ic n="newchat" s={28} w={2} /></button>
      </>
    )
  } else {
    body = (
      <>
        <div className="th hm"><Me s={32} onClick={() => to('profile')} /><X s={30} /><span className="sp" /></div>
        <div className="tabs"><span>추천</span><span className="on">팔로우 중 <Ic n="down" s={16} w={2.4} /></span><Ic n="plus" s={24} w={2.2} /></div>
        <div className="sc">
          {TL.map((t, i) => (
            <div key={i} className="tw" onClick={t.detail ? () => to('detail') : undefined}><div className="lc"><Av c={t.c} def={t.def} s={48} /></div>
              <div className="m">{t.rt && <p className="rt"><Ic n="rt" s={16} w={2.2} /> {t.rt}</p>}
                <p className="n"><b>{t.name}</b>{t.vf ? <Vf /> : null}{t.lock ? <Lock /> : null} <span>@{t.h} · {t.t}</span><em><X s={20} /></em></p>
                <p className="x">{t.text}</p>
                {t.media && <div className="med"><i /></div>}
                {t.q && <div className="qt"><p><Av def s={20} /> <b>{t.q.name}</b> <span>@{t.q.h} · {t.q.t}</span></p><p className="x">{t.q.text}</p></div>}
                <Act r={t.rts || (t.dimRt ? 0 : '')} l={t.lk || ''} v={t.vw} />
              </div></div>
          ))}
        </div>
        <button className="fab"><Ic n="plus" s={30} w={2.2} /></button>
      </>
    )
  }
  return (
    <div className="xapp">
      {body}
      <nav className="tb2">{[['home'], ['search'], ['grok'], ['bell'], ['chat']].map(([i], x) => (
        <button key={x} onClick={x === 0 ? () => tab('home') : x === 4 ? () => tab('dm') : undefined}>
          <Ic n={i} s={27} w={2} f={(x === 0 && ['home', 'profile', 'detail'].includes(sc)) || (x === 4 && ['dm', 'chat'].includes(sc))} />
          {x === 0 && sc !== 'dm' && sc !== 'chat' && <u />}{x === 2 && <b>1</b>}
        </button>))}</nav>
    </div>
  )
}
