import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { WEB_PAGES } from '../data/web'
import './Safari.css'

/* ───────────────────────── 가상 사이트 ─────────────────────────
   실제 외부 사이트는 열 수 없는 가상 브라우저이므로, 네이버와 Google은
   이 앱 안에서 제공하는 "샘플 페이지"로 열립니다. 검색은 기존 WEB_PAGES 로직을 그대로 씁니다. */
const SITES = [
  { id: 'naver', name: '네이버', url: 'naver.example', hosts: ['naver.example', 'naver.com', 'm.naver.com'], keywords: ['네이버', 'naver'] },
  { id: 'google', name: 'Google', url: 'google.example', hosts: ['google.example', 'google.com', 'google.co.kr'], keywords: ['구글', 'google'] },
]
const SITE = Object.fromEntries(SITES.map((s) => [s.id, s]))
const DEFAULTS = [
  { id: 'd:naver', label: '네이버', url: 'naver.example', icon: 'naver' },
  { id: 'd:google', label: 'Google', url: 'google.example', icon: 'google' },
]
const WEB_TINTS = ['#5e7ce2', '#e2735e', '#4ca98f', '#a65ee2', '#d9a43a', '#5aa0d6']

const norm = (s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
const looksLikeUrl = (s) => !/\s/.test(s.trim()) && /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(s.trim())
const tintOf = (s) => WEB_TINTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % WEB_TINTS.length]

/* ───────────────────────── 아이콘 (전부 SVG 벡터) ───────────────────────── */
const Svg = ({ size = 22, sw = 1.8, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)
const Ic = {
  left: (p) => <Svg sw={2.2} {...p}><path d="M15 5l-7 7 7 7" /></Svg>,
  right: (p) => <Svg sw={2.2} {...p}><path d="M9 5l7 7-7 7" /></Svg>,
  share: (p) => <Svg {...p}><path d="M12 15V3M8 7l4-4 4 4M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" /></Svg>,
  book: (p) => <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1h13v-3" /></Svg>,
  tabs: (p) => <Svg {...p}><rect x="8" y="3" width="13" height="13" rx="2.5" /><path d="M16 20H6a3 3 0 0 1-3-3V8" /></Svg>,
  plus: (p) => <Svg sw={2.2} {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  close: (p) => <Svg size={16} sw={2.4} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>,
  search: (p) => <Svg size={16} sw={2.4} {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></Svg>,
  lock: (p) => <Svg size={13} sw={2.4} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>,
  globe: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></Svg>,
  shield: (p) => <Svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></Svg>,
  trash: (p) => <Svg size={20} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>,
  pencil: (p) => <Svg size={18} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>,
  up: (p) => <Svg size={18} sw={2.4} {...p}><path d="M6 15l6-6 6 6" /></Svg>,
  down: (p) => <Svg size={18} sw={2.4} {...p}><path d="M6 9l6 6 6-6" /></Svg>,
  clock: (p) => <Svg size={18} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  copy: (p) => <Svg size={20} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></Svg>,
  warn: (p) => <Svg size={40} sw={1.5} {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></Svg>,
}

// 사이트 로고 (벡터)
function SiteIcon({ kind, size = 60, tint }) {
  const r = size * 0.23
  if (kind === 'naver')
    return (
      <svg className="safari-ico" width={size} height={size} viewBox="0 0 60 60" aria-label="네이버">
        <rect width="60" height="60" rx="14" fill="#03C75A" />
        <path d="M19 16h8.6l5.4 8.4V16H41v28h-8.4L27 35.6V44h-8z" fill="#fff" />
      </svg>
    )
  if (kind === 'google')
    return (
      <svg className="safari-ico" width={size} height={size} viewBox="0 0 60 60" aria-label="Google">
        <rect x=".5" y=".5" width="59" height="59" rx="14" fill="#fff" stroke="#e0e0e5" />
        <g transform="translate(15 15) scale(1.25)">
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
        </g>
      </svg>
    )
  return (
    <div className="safari-ico safari-ico-web" style={{ width: size, height: size, borderRadius: r, background: tint || '#8e8e93' }}>
      <Ic.globe size={size * 0.52} sw={1.7} />
    </div>
  )
}

/* ───────────────────────── 저장 (새로고침 후 유지) ─────────────────────────
   검색 기록은 기존 게임 상태(state.history)를 그대로 사용하고,
   즐겨찾기/탭/방문 기록만 별도 키에 저장합니다. 기본 즐겨찾기는 코드에 두고,
   사용자가 추가·수정·삭제한 내용만 저장합니다. */
const KEY = 'safari-ui-v1'
const newTab = () => ({ id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, hist: [{ k: 'start' }], i: 0 })
function load() {
  let s = {}
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { /* noop */ }
  const tabs = Array.isArray(s.tabs) && s.tabs.length ? s.tabs : [newTab()]
  return { custom: s.custom || [], hidden: s.hidden || [], edits: s.edits || {}, order: s.order || [], visits: s.visits || {}, tabs, active: tabs.some((t) => t.id === s.active) ? s.active : tabs[0].id }
}
function useStore() {
  const [S, setS] = useState(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* noop */ } }, [S])
  return [S, setS]
}

function bookmarksOf(S) {
  const list = [...DEFAULTS, ...S.custom].filter((b) => !S.hidden.includes(b.id)).map((b) => ({ ...b, ...(S.edits[b.id] || {}) }))
  const pos = (b) => { const i = S.order.indexOf(b.id); return i < 0 ? 1e6 : i }
  return list.sort((a, b) => pos(a) - pos(b))
}
function iconOf(b, visible) {
  if (b.icon && norm(b.url) === norm((DEFAULTS.find((d) => d.id === b.id) || {}).url || '')) return b.icon
  const s = SITES.find((x) => x.hosts.includes(norm(b.url).split('/')[0]))
  return s ? s.id : 'web'
}

/* ───────────────────────── 주소 해석 ───────────────────────── */
function resolve(input, visible) {
  const u = norm(input)
  const host = u.split('/')[0]
  const site = SITES.find((s) => s.hosts.includes(host))
  if (site) return { k: 'site', id: site.id }
  const wp = visible.find((p) => norm(p.url) === u)
  if (wp) return { k: 'page', id: wp.id }
  return null
}

export default function Safari() {
  const { state, actions } = useGame()
  const [S, setS] = useStore()
  const [focus, setFocus] = useState(false)
  const [addr, setAddr] = useState('')
  const [tabsOpen, setTabsOpen] = useState(false)
  const [mgr, setMgr] = useState(null) // null | { form?: {...} }
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [kb, setKb] = useState(0)
  const input = useRef(null)

  const visible = useMemo(() => WEB_PAGES.filter((p) => !p.requireFlag || state.flags?.[p.requireFlag]), [state.flags])
  const tab = S.tabs.find((t) => t.id === S.active) || S.tabs[0]
  const cur = tab.hist[tab.i]
  const bookmarks = useMemo(() => bookmarksOf(S), [S])
  const history = state.history || []

  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const f = () => setKb(Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop)))
    v.addEventListener('resize', f)
    v.addEventListener('scroll', f)
    f()
    return () => { v.removeEventListener('resize', f); v.removeEventListener('scroll', f) }
  }, [])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 1800); return () => clearTimeout(id) }, [toast])

  // ── 이동 ──
  const patchTab = (fn) => setS((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === tab.id ? fn(t) : t)) }))
  const metaOf = (e) => {
    if (e.k === 'site') return { key: SITE[e.id].url, label: SITE[e.id].name, url: SITE[e.id].url, icon: e.id }
    if (e.k === 'page') { const p = WEB_PAGES.find((x) => x.id === e.id); return p && { key: p.url, label: p.site, url: p.url, icon: 'web' } }
    return null
  }
  const go = (entry) => {
    setFocus(false)
    input.current?.blur()
    patchTab((t) => ({ ...t, hist: [...t.hist.slice(0, t.i + 1), entry], i: t.i + 1 }))
    const m = metaOf(entry)
    if (m) setS((s) => ({ ...s, visits: { ...s.visits, [m.key]: { ...m, n: (s.visits[m.key]?.n || 0) + 1 } } }))
  }
  const search = (text) => {
    const t = text.trim()
    if (!t) return
    actions.addHistory(t)
    go({ k: 'results', q: t })
  }
  const open = (url) => go(resolve(url, visible) || { k: 'err', url })
  const submit = (text) => {
    const t = text.trim()
    if (!t) return
    looksLikeUrl(t) ? open(t) : search(t)
  }
  const canBack = tab.i > 0
  const canFwd = tab.i < tab.hist.length - 1
  const step = (d) => patchTab((t) => ({ ...t, i: Math.max(0, Math.min(t.hist.length - 1, t.i + d)) }))

  // ── 탭 ──
  const addTab = () => { const t = newTab(); setS((s) => ({ ...s, tabs: [...s.tabs, t], active: t.id })); setTabsOpen(false) }
  const closeTab = (id) =>
    setS((s) => {
      let tabs = s.tabs.filter((t) => t.id !== id)
      if (!tabs.length) tabs = [newTab()]
      return { ...s, tabs, active: s.active === id ? tabs[Math.min(s.tabs.findIndex((t) => t.id === id), tabs.length - 1)].id : s.active }
    })

  // ── 현재 화면 정보 ──
  const page = cur.k === 'page' ? visible.find((p) => p.id === cur.id) : null
  const curUrl = cur.k === 'page' ? (page ? page.url : '') : cur.k === 'site' ? SITE[cur.id].url : cur.k === 'err' ? cur.url : ''
  const view = cur.k === 'page' && !page ? { k: 'err', url: WEB_PAGES.find((p) => p.id === cur.id)?.url || '' } : cur
  const display = view.k === 'results' ? view.q : view.k === 'start' ? '' : view.k === 'err' ? view.url : curUrl
  const titleOf = (e) => {
    if (e.k === 'start') return '시작 페이지'
    if (e.k === 'results') return `‘${e.q}’ 검색`
    if (e.k === 'site') return SITE[e.id].name
    if (e.k === 'page') { const p = visible.find((x) => x.id === e.id); return p ? p.title : '페이지를 찾을 수 없음' }
    return '페이지를 찾을 수 없음'
  }
  const shareable = view.k === 'page' || view.k === 'site'
  const bookmarked = shareable && bookmarks.some((b) => norm(b.url) === norm(curUrl))

  const addCurrentBookmark = () => {
    if (!shareable || bookmarked) return
    const label = view.k === 'site' ? SITE[view.id].name : page.site
    setS((s) => ({ ...s, custom: [...s.custom, { id: `c:${Date.now()}`, label, url: curUrl }] }))
    setToast('즐겨찾기에 추가했습니다')
  }
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(curUrl) } catch { /* noop */ }
    setShareOpen(false)
    setToast('링크를 복사했습니다')
  }

  const onFocus = () => { setFocus(true); setAddr(display); setTimeout(() => input.current?.select(), 0) }
  const cancel = () => { setFocus(false); input.current?.blur() }

  // ── 검색 결과 (기존 WEB_PAGES 필터 로직 유지) ──
  const results = useMemo(() => {
    if (view.k !== 'results') return []
    const low = view.q.toLowerCase()
    const sites = SITES.filter((s) => s.keywords.some((k) => low.includes(k) || k.includes(low)) || s.name.toLowerCase().includes(low)).map((s) => ({ kind: 'site', id: s.id, url: s.url, title: s.name, site: s.name, snippet: '가상 브라우저에서 제공하는 샘플 페이지입니다.' }))
    const pages = visible
      .filter((p) => p.title.toLowerCase().includes(low) || p.site.toLowerCase().includes(low) || p.keywords.some((k) => low.includes(k.toLowerCase()) || k.toLowerCase().includes(low)))
      .map((p) => ({ kind: 'page', id: p.id, url: p.url, title: p.title, site: p.site, snippet: p.body.find((b) => b.type === 'p')?.text || '' }))
    return [...sites, ...pages]
  }, [view, visible])

  const frequent = Object.values(S.visits).sort((a, b) => b.n - a.n).slice(0, 4)
  const visitCount = Object.values(S.visits).reduce((a, v) => a + v.n, 0)

  // ── 주소창 제안 ──
  const kw = addr.trim().toLowerCase()
  const sug = {
    bm: kw ? bookmarks.filter((b) => b.label.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw)) : [],
    pages: kw ? visible.filter((p) => p.title.toLowerCase().includes(kw) || p.site.toLowerCase().includes(kw) || p.url.toLowerCase().includes(kw)) : [],
    hist: history.filter((h) => !kw || h.toLowerCase().includes(kw)).slice(0, 8),
  }

  return (
    <div className="safari-root">
      {/* ───── 콘텐츠 ───── */}
      <div className="safari-content" key={`${tab.id}:${tab.i}`}>
        {view.k === 'start' && (
          <div className="safari-scroll">
            <section>
              <div className="safari-sec"><h2>즐겨찾기</h2><button onClick={() => setMgr({})}>편집</button></div>
              <div className="safari-grid">
                {bookmarks.map((b) => (
                  <button key={b.id} className="safari-tile" onClick={() => open(b.url)}>
                    <SiteIcon kind={iconOf(b)} tint={tintOf(b.url)} />
                    <span>{b.label}</span>
                  </button>
                ))}
                <button className="safari-tile add" onClick={() => setMgr({ form: { id: null, label: '', url: '' } })} aria-label="즐겨찾기 추가">
                  <div className="safari-addbox"><Ic.plus size={24} /></div>
                  <span>추가</span>
                </button>
              </div>
            </section>

            {frequent.length > 0 && (
              <section>
                <div className="safari-sec"><h2>자주 방문한 사이트</h2></div>
                <div className="safari-grid">
                  {frequent.map((v) => (
                    <button key={v.key} className="safari-tile" onClick={() => open(v.url)}>
                      <SiteIcon kind={v.icon} tint={tintOf(v.url)} />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="safari-sec"><h2>개인정보 보호 리포트</h2></div>
              <div className="safari-privacy">
                <Ic.shield size={30} />
                <div>
                  <b>추적 방지 사용 중</b>
                  <span>{visitCount > 0 ? `이번에 방문한 페이지 ${visitCount}개` : '아직 방문한 페이지가 없습니다.'}</span>
                </div>
              </div>
            </section>

            <section>
              <div className="safari-sec">
                <h2>검색 기록</h2>
                {history.length > 0 && <button onClick={actions.clearHistory}>지우기</button>}
              </div>
              {history.length === 0 ? (
                <div className="safari-note">검색 기록이 없습니다.</div>
              ) : (
                <div className="safari-list">
                  {history.map((h) => (
                    <button key={h} onClick={() => search(h)}><Ic.clock />{h}</button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view.k === 'results' && (
          <div className="safari-scroll">
            <div className="safari-count">‘{view.q}’ 검색 결과</div>
            {results.length === 0 ? (
              <div className="safari-none">
                <Ic.search size={34} />
                <b>검색 결과가 없습니다</b>
                <span>다른 검색어를 입력하거나 철자를 확인해 보세요.</span>
              </div>
            ) : (
              results.map((r) => (
                <button key={`${r.kind}:${r.id}`} className="safari-res" onClick={() => go(r.kind === 'site' ? { k: 'site', id: r.id } : { k: 'page', id: r.id })}>
                  <SiteIcon kind={r.kind === 'site' ? r.id : 'web'} size={28} tint={tintOf(r.url)} />
                  <div>
                    <small>{r.url}</small>
                    <b>{r.title}</b>
                    <p>{r.snippet}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {view.k === 'page' && page && (
          <div className="safari-scroll safari-web">
            <div className="safari-site">{page.site}</div>
            <h2>{page.title}</h2>
            {page.body.map((b, i) =>
              b.type === 'c' ? (
                <div key={i} className="safari-comment"><b>{b.user}</b><span>{b.text}</span></div>
              ) : (
                <p key={i}>{b.text}</p>
              ),
            )}
          </div>
        )}

        {view.k === 'site' && <SitePage id={view.id} onSearch={search} onOpen={open} />}

        {view.k === 'err' && (
          <div className="safari-none full">
            <Ic.warn />
            <b>페이지를 찾을 수 없습니다</b>
            <span>이 가상 브라우저에서는 ‘{view.url}’ 주소를 열 수 없습니다.</span>
            <button className="safari-btn" onClick={() => go({ k: 'start' })}>시작 페이지로</button>
          </div>
        )}
      </div>

      {/* ───── 주소창 제안 ───── */}
      {focus && (
        <div className="safari-suggest" style={{ paddingBottom: 70 + kb }}>
          <div className="safari-scroll">
            {kw && (
              <button className="safari-row" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(addr)}>
                <Ic.search /><span>‘{addr.trim()}’ {looksLikeUrl(addr) ? '열기' : '검색'}</span>
              </button>
            )}
            {sug.bm.length > 0 && <div className="safari-sh">즐겨찾기</div>}
            {sug.bm.map((b) => (
              <button key={b.id} className="safari-row" onMouseDown={(e) => e.preventDefault()} onClick={() => open(b.url)}>
                <SiteIcon kind={iconOf(b)} size={24} tint={tintOf(b.url)} /><span>{b.label}<small>{b.url}</small></span>
              </button>
            ))}
            {sug.pages.length > 0 && <div className="safari-sh">웹페이지</div>}
            {sug.pages.map((p) => (
              <button key={p.id} className="safari-row" onMouseDown={(e) => e.preventDefault()} onClick={() => go({ k: 'page', id: p.id })}>
                <SiteIcon kind="web" size={24} tint={tintOf(p.url)} /><span>{p.title}<small>{p.url}</small></span>
              </button>
            ))}
            <div className="safari-sh safari-sh-flex">
              <span>{kw ? '검색 기록' : '최근 검색어'}</span>
              {history.length > 0 && !kw && <button onMouseDown={(e) => e.preventDefault()} onClick={actions.clearHistory}>지우기</button>}
            </div>
            {sug.hist.map((h) => (
              <button key={h} className="safari-row" onMouseDown={(e) => e.preventDefault()} onClick={() => search(h)}>
                <Ic.clock /><span>{h}</span>
              </button>
            ))}
            {sug.hist.length === 0 && !kw && <div className="safari-note">최근 검색어가 없습니다. 검색어나 웹사이트 주소를 입력해 보세요.</div>}
            {kw && !sug.bm.length && !sug.pages.length && !sug.hist.length && <div className="safari-note">일치하는 제안이 없습니다. 입력을 마치고 이동 키를 누르면 검색합니다.</div>}
          </div>
        </div>
      )}

      {/* ───── 하단: 주소창 + 툴바 ───── */}
      <div className="safari-bottom" style={kb ? { transform: `translateY(-${kb}px)`, paddingBottom: 8 } : undefined}>
        <form className="safari-barwrap" onSubmit={(e) => { e.preventDefault(); submit(focus ? addr : display) }}>
          <div className={`safari-bar ${focus ? 'on' : ''}`}>
            <span className="safari-barico">{!focus && shareable ? <Ic.lock /> : <Ic.search />}</span>
            <input
              ref={input}
              value={focus ? addr : display}
              onChange={(e) => setAddr(e.target.value)}
              onFocus={onFocus}
              placeholder="검색 또는 웹사이트 이름 입력"
              enterKeyHint="go"
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              inputMode="search"
            />
            {focus && addr && <button type="button" className="safari-clear" onMouseDown={(e) => e.preventDefault()} onClick={() => setAddr('')} aria-label="지우기"><Ic.close size={12} /></button>}
          </div>
          {focus && <button type="button" className="safari-cancel" onMouseDown={(e) => e.preventDefault()} onClick={cancel}>취소</button>}
        </form>
        {!focus && (
          <div className="safari-toolbar">
            <button disabled={!canBack} onClick={() => step(-1)} aria-label="뒤로"><Ic.left /></button>
            <button disabled={!canFwd} onClick={() => step(1)} aria-label="앞으로"><Ic.right /></button>
            <button disabled={!shareable} onClick={() => setShareOpen(true)} aria-label="공유"><Ic.share /></button>
            <button onClick={() => setMgr({})} aria-label="즐겨찾기"><Ic.book /></button>
            <button onClick={() => setTabsOpen(true)} aria-label="탭" className="safari-tabbtn"><Ic.tabs /><i>{S.tabs.length}</i></button>
          </div>
        )}
      </div>

      {/* ───── 탭 관리 ───── */}
      {tabsOpen && (
        <div className="safari-tabs">
          <div className="safari-tabgrid">
            {S.tabs.map((t) => {
              const e = t.hist[t.i]
              return (
                <div key={t.id} className={`safari-card ${t.id === S.active ? 'on' : ''}`}>
                  <button className="safari-cardx" onClick={() => closeTab(t.id)} aria-label="탭 닫기"><Ic.close size={12} /></button>
                  <button className="safari-cardbody" onClick={() => { setS((s) => ({ ...s, active: t.id })); setTabsOpen(false) }}>
                    <div className="safari-cardpreview">
                      {e.k === 'start' ? <div className="safari-mini"><i /><i /><i /><i /></div> : <SiteIcon kind={e.k === 'site' ? e.id : 'web'} size={44} tint={tintOf(titleOf(e))} />}
                    </div>
                    <b>{titleOf(e)}</b>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="safari-tabbar">
            <button onClick={addTab} aria-label="새 탭"><Ic.plus /></button>
            <span>탭 {S.tabs.length}개</span>
            <button className="safari-done" onClick={() => setTabsOpen(false)}>완료</button>
          </div>
        </div>
      )}

      {/* ───── 공유 ───── */}
      {shareOpen && (
        <div className="safari-modal" onClick={() => setShareOpen(false)}>
          <div className="safari-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="safari-sharehead">
              <SiteIcon kind={view.k === 'site' ? view.id : 'web'} size={44} tint={tintOf(curUrl)} />
              <div><b>{titleOf(view)}</b><small>{curUrl}</small></div>
            </div>
            <button className="safari-row" onClick={copyUrl}><Ic.copy /><span>링크 복사</span></button>
            <button className="safari-row" disabled={bookmarked} onClick={() => { addCurrentBookmark(); setShareOpen(false) }}>
              <Ic.book size={20} /><span>{bookmarked ? '이미 즐겨찾기에 있음' : '즐겨찾기에 추가'}</span>
            </button>
            <button className="safari-btn gray" onClick={() => setShareOpen(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* ───── 즐겨찾기 관리 ───── */}
      {mgr && (
        <Manager
          S={S} setS={setS} bookmarks={bookmarks} initialForm={mgr.form}
          canAddCurrent={shareable && !bookmarked} onAddCurrent={addCurrentBookmark}
          onOpen={(url) => { setMgr(null); open(url) }} onClose={() => setMgr(null)}
        />
      )}

      {toast && <div className="safari-toast">{toast}</div>}
    </div>
  )
}

/* ───────────────────────── 가상 사이트 홈 ───────────────────────── */
function SitePage({ id, onSearch, onOpen }) {
  const [q, setQ] = useState('')
  const s = SITE[id]
  const topics = [['날씨', '날씨'], ['맛집', '맛집'], ['커뮤니티', '커뮤니티'], ['기사', '기사']]
  return (
    <div className="safari-scroll safari-site-home">
      <div className="safari-virtual">가상 브라우저 안에서 제공되는 샘플 페이지입니다.</div>
      <div className={`safari-brand ${id}`}>
        <SiteIcon kind={id} size={72} />
        <h1>{s.name}</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSearch(q) }} className={`safari-sitesearch ${id}`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${s.name} 검색`} />
        <button type="submit" aria-label="검색"><Ic.search size={18} /></button>
      </form>
      <div className="safari-topics">
        {topics.map(([label, query]) => (
          <button key={label} onClick={() => onSearch(query)}>{label}</button>
        ))}
        {SITES.filter((x) => x.id !== id).map((x) => (
          <button key={x.id} onClick={() => onOpen(x.url)}>{x.name}</button>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── 즐겨찾기 관리 시트 ───────────────────────── */
function Manager({ S, setS, bookmarks, initialForm, canAddCurrent, onAddCurrent, onOpen, onClose }) {
  const [edit, setEdit] = useState(!!initialForm)
  const [form, setForm] = useState(initialForm || null) // { id, label, url }
  const [confirm, setConfirm] = useState(null)

  const move = (id, d) =>
    setS((s) => {
      const ids = bookmarksOf(s).map((b) => b.id)
      const i = ids.indexOf(id)
      const j = i + d
      if (j < 0 || j >= ids.length) return s
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
      return { ...s, order: ids }
    })
  const remove = (b) =>
    setS((s) => (b.id.startsWith('c:') ? { ...s, custom: s.custom.filter((x) => x.id !== b.id) } : { ...s, hidden: [...s.hidden, b.id] }))
  const save = () => {
    const label = form.label.trim()
    const url = form.url.trim()
    if (!label || !url) return
    setS((s) =>
      form.id
        ? { ...s, edits: { ...s.edits, [form.id]: { label, url } } }
        : { ...s, custom: [...s.custom, { id: `c:${Date.now()}`, label, url }] },
    )
    setForm(null)
  }
  const restorable = S.hidden.length > 0 || DEFAULTS.some((d) => S.edits[d.id])
  const restore = () =>
    setS((s) => { const e = { ...s.edits }; DEFAULTS.forEach((d) => delete e[d.id]); return { ...s, hidden: [], edits: e } })

  return (
    <div className="safari-modal safari-mgr">
      <div className="safari-mgrsheet">
        <div className="safari-mgrhead">
          <button onClick={() => setEdit((e) => !e)}>{edit ? '완료' : '편집'}</button>
          <b>즐겨찾기</b>
          <button onClick={onClose}>닫기</button>
        </div>
        <div className="safari-mgrbody">
          {canAddCurrent && (
            <button className="safari-row" onClick={onAddCurrent}><Ic.plus size={20} /><span>현재 페이지를 즐겨찾기에 추가</span></button>
          )}
          {bookmarks.map((b, i) => (
            <div key={b.id} className="safari-mgrrow">
              {edit && <button className="safari-minus" onClick={() => setConfirm(b)} aria-label="삭제"><i /></button>}
              <button className="safari-mgrmain" onClick={() => (edit ? setForm({ id: b.id, label: b.label, url: b.url }) : onOpen(b.url))}>
                <SiteIcon kind={iconOf(b)} size={36} tint={tintOf(b.url)} />
                <span>{b.label}<small>{b.url}</small></span>
              </button>
              {edit && (
                <div className="safari-order">
                  <button disabled={i === 0} onClick={() => move(b.id, -1)} aria-label="위로"><Ic.up /></button>
                  <button disabled={i === bookmarks.length - 1} onClick={() => move(b.id, 1)} aria-label="아래로"><Ic.down /></button>
                </div>
              )}
            </div>
          ))}
          {!bookmarks.length && <div className="safari-note">즐겨찾기가 없습니다.</div>}
          <button className="safari-row" onClick={() => setForm({ id: null, label: '', url: '' })}><Ic.plus size={20} /><span>새로운 즐겨찾기 추가</span></button>
          {restorable && <button className="safari-row" onClick={restore}><Ic.clock /><span>기본 즐겨찾기 복원</span></button>}
        </div>
      </div>

      {form && (
        <div className="safari-modal safari-formwrap" onClick={() => setForm(null)}>
          <form className="safari-form" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); save() }}>
            <b>{form.id ? '즐겨찾기 수정' : '즐겨찾기 추가'}</b>
            <label>이름<input autoFocus value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="이름" /></label>
            <label>주소<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="예: naver.example" autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label>
            <div className="safari-formbtn">
              <button type="button" onClick={() => setForm(null)}>취소</button>
              <button type="submit" className="primary" disabled={!form.label.trim() || !form.url.trim()}>저장</button>
            </div>
          </form>
        </div>
      )}

      {confirm && (
        <div className="safari-modal safari-formwrap" onClick={() => setConfirm(null)}>
          <div className="safari-alert" onClick={(e) => e.stopPropagation()}>
            <p>‘{confirm.label}’을(를) 삭제하시겠습니까?</p>
            <button className="danger" onClick={() => { remove(confirm); setConfirm(null) }}>삭제</button>
            <button onClick={() => setConfirm(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}
