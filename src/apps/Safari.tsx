import { useMemo, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { WEB_PAGES } from '../data/web'
import './Safari.css'

/* iOS Safari 목업. 동작: 네이버/구글 홈, 검색, 웹페이지, 뒤로/앞으로. 나머지 버튼은 장식 */
const SITES = [
  { id: 'naver', name: '네이버', url: 'naver.com', hosts: ['naver.com', 'm.naver.com', 'naver.example'], keywords: ['네이버', 'naver'] },
  { id: 'google', name: 'Google', url: 'google.com', hosts: ['google.com', 'google.co.kr', 'google.example'], keywords: ['구글', 'google'] },
]
const SITE = Object.fromEntries(SITES.map((s) => [s.id, s]))
const norm = (s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
const looksLikeUrl = (s) => !/\s/.test(s.trim()) && /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(s.trim())

const D = { menu: 'M4 7h16M4 12h16M4 17h10', back: 'm15 5-7 7 7 7', fwd: 'm9 5 7 7-7 7', share: 'M12 15V3M8 7l4-4 4 4M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1', book: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1h13v-3', tabs: 'M8 3h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM16 21H6a3 3 0 0 1-3-3V8', search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.8-4.8', mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4', refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5', bell: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8zM10 21h4', user: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 18c1-3 3-4 6-4s5 1 6 4', x: 'M6 6l12 12M18 6 6 18', clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2', chev: 'm6 9 6 6 6-6' }
const Ic = ({ d, s = 24, w = 1.9 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={D[d]} /></svg>

const NaverN = ({ c = '#fff' }) => <svg viewBox="0 0 60 60" width="62%" height="62%"><path d="M19 16h8.6l5.4 8.4V16H41v28h-8.4L27 35.6V44h-8z" fill={c} /></svg>
const GoogleG = () => <svg viewBox="0 0 24 24" width="62%" height="62%"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" /><path fill="#FBBC05" d="M5.3 14.3a7 7 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" /></svg>


const Sv = ({ children, s = 24, ...p }) => <svg viewBox="0 0 24 24" width={s} height={s} {...p}>{children}</svg>
const Mail = ({ c = '#fff', s = 24 }) => <Sv s={s} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="m4 8 8 6 8-6" /></Sv>
const Octo = () => <Sv s={44}><circle cx="12" cy="12" r="10" fill="#fff" /><path d="M7 8 8 5l3 1.5h2L16 5l1 3c1 1 1.5 2.2 1.5 3.5 0 3-2.5 4.5-6.5 4.5s-6.5-1.500-6.500-4.500C5.500 10.200 6 9 7 8z" fill="#111" /><circle cx="9.800" cy="11.500" r="1" fill="#fff" /><circle cx="14.200" cy="11.500" r="1" fill="#fff" /></Sv>
const XLogo = () => <Sv s={34} fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round"><path d="M4 4l16 16M20 4 4 20" /></Sv>
const Moon = () => <Sv s={30}><path d="M18 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 8.500 10.500z" fill="#6fa4f2" /><path d="M17 3l.6 1.400L19 5l-1.400.6L17 7l-.6-1.400L15 5l1.400-.6z" fill="#f7c948" /></Sv>
const Spark = () => <Sv s={22}><path d="M12 2c.8 5.500 4.500 9.200 10 10-5.500.8-9.200 4.500-10 10-.8-5.500-4.500-9.200-10-10 5.500-.8 9.200-4.500 10-10z" fill="#3182f6" /></Sv>
const Pup = () => <svg viewBox="0 0 120 64" width="120" height="64"><path d="M4 64c2-24 14-36 34-36s28 12 30 36z" fill="#4a7ad0" /><circle cx="40" cy="22" r="11" fill="#5b3a2a" /><ellipse cx="78" cy="38" rx="22" ry="16" fill="#f0b83a" /><ellipse cx="66" cy="26" rx="6" ry="9" fill="#e8872a" /><circle cx="52" cy="36" r="3" fill="#222" /></svg>
const QI = ({ bg, children }) => <i style={{ background: bg }}>{children}</i>

export default function Safari() {
  const { state, actions } = useGame()
  const [st, setSt] = useState({ h: [{ k: 'start' }], i: 0 })
  const [focus, setFocus] = useState(false)
  const [addr, setAddr] = useState('')
  const input = useRef(null)
  const visible = useMemo(() => WEB_PAGES.filter((p) => !p.requireFlag || state.flags?.[p.requireFlag]), [state.flags])
  const history = state.history || []
  const view = st.h[st.i]
  const go = (e) => { setFocus(false); input.current?.blur(); setSt((s) => ({ h: [...s.h.slice(0, s.i + 1), e], i: s.i + 1 })) }
  const step = (d) => setSt((s) => ({ ...s, i: Math.max(0, Math.min(s.h.length - 1, s.i + d)) }))
  const search = (t) => { t = t.trim(); if (!t) return; actions.addHistory(t); go({ k: 'results', q: t }) }
  const open = (url) => {
    const u = norm(url), site = SITES.find((s) => s.hosts.includes(u.split('/')[0])), p = visible.find((x) => norm(x.url) === u)
    go(site ? { k: 'site', id: site.id } : p ? { k: 'page', id: p.id } : { k: 'err', url })
  }
  const submit = (t) => { t = t.trim(); if (t) (looksLikeUrl(t) ? open(t) : search(t)) }

  const page = view.k === 'page' ? visible.find((p) => p.id === view.id) : null
  const shown = view.k === 'site' ? SITE[view.id].url : page ? page.url : view.k === 'err' ? view.url : view.k === 'results' ? view.q : ''
  const isStart = view.k === 'start'
  const kw = addr.trim().toLowerCase()
  const sugg = history.filter((h) => !kw || h.toLowerCase().includes(kw)).slice(0, 8)
  const results = useMemo(() => {
    if (view.k !== 'results') return []
    const low = view.q.toLowerCase()
    const sites = SITES.filter((s) => s.keywords.some((k) => low.includes(k) || k.includes(low)) || s.name.toLowerCase().includes(low)).map((s) => ({ kind: 'site', id: s.id, url: s.url, title: s.name, snippet: '' }))
    const pages = visible.filter((p) => p.title.toLowerCase().includes(low) || p.site.toLowerCase().includes(low) || p.keywords.some((k) => low.includes(k.toLowerCase()) || k.toLowerCase().includes(low))).map((p) => ({ kind: 'page', id: p.id, url: p.url, title: p.title, snippet: p.body.find((b) => b.type === 'p')?.text || '' }))
    return [...sites, ...pages]
  }, [view, visible])

  return (
    <div className={'sf' + (view.k === 'site' && view.id === 'naver' ? ' nv' : '')}>
      <form className="sf-top" onSubmit={(e) => { e.preventDefault(); submit(focus ? addr : shown) }}>
        <div className="sf-bar">
          {!focus && !isStart ? <span className="l"><Ic d="menu" s={26} /></span> : <span className="l"><Ic d="search" s={20} /></span>}
          <input ref={input} value={focus ? addr : shown} placeholder="웹사이트 검색 또는 입력" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
            onFocus={() => { setFocus(true); setAddr(shown); setTimeout(() => input.current?.select(), 0) }} onChange={(e) => setAddr(e.target.value)} />
          <span className="r">{focus ? null : isStart ? <Ic d="mic" s={22} /> : <Ic d="refresh" s={24} />}</span>
        </div>
        {focus && <button type="button" className="sf-cancel" onMouseDown={(e) => e.preventDefault()} onClick={() => { setFocus(false); input.current?.blur() }}>취소</button>}
      </form>

      <div className="sf-body">

        {isStart && <div className="sf-sc sf-start"><div className="sf-sec"><h2>즐겨찾기</h2></div><div className="sf-grid"><button className="sf-fav" onClick={() => open('naver.com')}><i className="ti naver" style={{ background: '#03c75a' }}><NaverN /></i><span>네이버</span></button></div></div>}

        {view.k === 'site' && view.id === 'naver' && <Naver onSearch={search} history={history} />}
        {view.k === 'site' && view.id === 'google' && (
          <div className="sf-sc gg"><div className="gl"><b style={{ color: '#4285f4' }}>G</b><b style={{ color: '#ea4335' }}>o</b><b style={{ color: '#fbbc05' }}>o</b><b style={{ color: '#4285f4' }}>g</b><b style={{ color: '#34a853' }}>l</b><b style={{ color: '#ea4335' }}>e</b></div>
            <GForm onSearch={search} /></div>
        )}

        {view.k === 'results' && (
          <div className="sf-sc">
            {results.length === 0 ? <p className="sf-none">‘{view.q}’ 검색 결과가 없습니다</p> : results.map((r) => (
              <button key={r.kind + r.id} className="sf-res" onClick={() => go({ k: r.kind, id: r.id })}><small>{r.url}</small><b>{r.title}</b>{r.snippet && <p>{r.snippet}</p>}</button>))}
          </div>
        )}
        {view.k === 'page' && page && (
          <div className="sf-sc web"><small>{page.site}</small><h2>{page.title}</h2>
            {page.body.map((b, i) => b.type === 'c' ? <div key={i} className="cm"><b>{b.user}</b><span>{b.text}</span></div> : <p key={i}>{b.text}</p>)}</div>
        )}
        {(view.k === 'err' || (view.k === 'page' && !page)) && <p className="sf-none">페이지를 찾을 수 없습니다</p>}

        {focus && (
          <div className="sf-sug"><div className="sf-sc">
            {kw && <button className="sr" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(addr)}><Ic d="search" s={18} />‘{addr.trim()}’ {looksLikeUrl(addr) ? '열기' : '검색'}</button>}
            {sugg.map((h) => <button key={h} className="sr" onMouseDown={(e) => e.preventDefault()} onClick={() => search(h)}><Ic d="clock" s={18} />{h}</button>)}
          </div></div>
        )}
      </div>

      {!focus && (
        <div className="sf-tool">
          <button disabled={st.i === 0} onClick={() => step(-1)}><Ic d="back" s={26} w={2.2} /></button>
          <button disabled={st.i >= st.h.length - 1} onClick={() => step(1)}><Ic d="fwd" s={26} w={2.2} /></button>
          <button><Ic d="share" s={26} /></button><button><Ic d="book" s={26} /></button><button><Ic d="tabs" s={26} /></button>
        </div>
      )}
    </div>
  )
}

function GForm({ onSearch }) {
  const [q, setQ] = useState('')
  return <form className="gf" onSubmit={(e) => { e.preventDefault(); onSearch(q) }}><Ic d="search" s={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Google 검색" /></form>
}

/* 네이버 모바일 홈 (샘플) */
function Naver({ onSearch, history }) {
  const [q, setQ] = useState('')
  const [ov, setOv] = useState(false)
  const d = new Date(), today = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`
  return (
    <>
    {ov && (
      <div className="nov"><div className="nop">
        <form className="nos" onSubmit={(e) => { e.preventDefault(); onSearch(q) }}>
          <button type="button" onClick={() => setOv(false)}><Ic d="back" s={26} w={1.6} /></button>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어를 입력해 주세요." />
          <button type="submit"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#03c75a" strokeWidth="2.400" strokeLinecap="round"><circle cx="10.500" cy="10.500" r="6.500" /><path d="m20 20-4.800-4.800" /></svg></button>
        </form>
        <div className="noh"><b>최근 검색어</b><span>전체삭제</span></div>
        {history.slice(0, 5).map((h) => <div className="nor" key={h}><i><Ic d="clock" s={20} w={1.6} /></i><span>{h}</span><em>{today}</em><Ic d="x" s={20} w={1.6} /></div>)}
        <div className="noh r"><b>추천 검색어</b><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#b5b5ba" strokeWidth="1.500"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.500v.01" strokeLinecap="round" /></svg></div>
        <div className="nch">{['이디오테잎 앨범 리뷰', '야구 선수 인터뷰', '미국 선거제도의 역사', '냉장고를 부탁해 해외판'].map((c) => <span key={c}><Ic d="search" s={14} w={2} />{c}</span>)}</div>
        <div className="nsw"><span>검색 이력 기반 추천 검색어 <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1769c8" strokeWidth="1.800" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .8-1 1.700M12 17v.01" /></svg></span><u /></div>
        <div className="nft"><span>자동저장 끄기 · 도움말</span><span onClick={() => setOv(false)}>닫기</span></div>
      </div></div>
    )}
    <div className="sf-sc nvp">
      <div className="nh"><Ic d="menu" s={30} /><i className="pay">pay</i><span className="sp" /><span className="bw"><Ic d="bell" s={28} /><em>2</em></span><span className="pf"><Ic d="user" s={28} /></span></div>
      <form className="nsr" onSubmit={(e) => { e.preventDefault(); onSearch(q) }}>
        <input readOnly onFocus={() => setOv(true)} onClick={() => setOv(true)} /><i className="cam" />
      </form>
      <div className="nblank" />
      <div className="nq"><span><QI bg="#2ec36b"><Mail s={14} /></QI>메일</span><span><QI bg="#5ac35a"><Sv s={14} fill="#fff"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 9h2a2 2 0 0 1 0 5h-2z" /></Sv></QI>카페</span><span><QI bg="#5b3fd6"><Sv s={14} fill="#fff"><path d="M5 5h4l6 8V5h4v14h-4L9 11v8H5z" /></Sv></QI>쇼핑</span><u /><span>뉴스</span><span>엔터</span><span>지식</span><span>쇼핑</span></div>
      <div className="nw"><Moon /><b>3.3° 서울</b><u /><span>S&P 500 <b>7,376.86</b> <em>▲0.31%</em></span></div>
      <div className="ncards"><div className="c1"><s>등급 | 점수(%) | 문법</s><b>켈리 지텔프</b></div><div className="c2"><b>수만휘-수능,공부,입…</b></div></div>
    </div>
    </>
  )
}
