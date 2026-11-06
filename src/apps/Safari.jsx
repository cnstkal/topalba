import { useState } from 'react'
import { useGame } from '../engine/store'
import { WEB_PAGES, BOOKMARKS } from '../data/web'
import Back from '../components/Back'

export default function Safari() {
  const { state, actions } = useGame()
  const [view, setView] = useState('start') // start | results | page
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [pageId, setPageId] = useState(null)

  const visible = WEB_PAGES.filter((p) => !p.requireFlag || state.flags[p.requireFlag])
  const search = (text) => {
    const t = text.trim()
    if (!t) return
    setQuery(t)
    setQ(t)
    actions.addHistory(t)
    setView('results')
  }
  const results = visible.filter((p) => {
    const low = query.toLowerCase()
    return p.title.toLowerCase().includes(low) || p.site.toLowerCase().includes(low) || p.keywords.some((k) => low.includes(k.toLowerCase()) || k.toLowerCase().includes(low))
  })
  const page = WEB_PAGES.find((p) => p.id === pageId)

  const bar = (
    <form className="saf-bar" onSubmit={(e) => { e.preventDefault(); search(q) }}>
      <div className="saf-field">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="3" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><path d="M21 21l-6-6" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색 또는 웹사이트 이름 입력" />
      </div>
    </form>
  )

  if (view === 'page' && page) {
    return (
      <div className="page">
        <div className="nav"><Back onClick={() => setView('results')}>검색 결과</Back></div>
        <div className="scroll web">
          <div className="web-site">{page.site}</div>
          <h2>{page.title}</h2>
          {page.body.map((b, i) =>
            b.type === 'c' ? (
              <div key={i} className="web-c"><b>{b.user}</b><span>{b.text}</span></div>
            ) : (
              <p key={i}>{b.text}</p>
            ),
          )}
        </div>
        <div className="saf-url">{page.url}</div>
      </div>
    )
  }

  if (view === 'results') {
    return (
      <div className="page">
        <div className="nav"><Back onClick={() => setView('start')}>시작 페이지</Back></div>
        <div className="scroll">
          <div className="res-count">‘{query}’ 검색 결과</div>
          {results.length === 0 && <div className="empty">검색 결과가 없습니다.</div>}
          {results.map((p) => (
            <button key={p.id} className="res" onClick={() => { setPageId(p.id); setView('page') }}>
              <span>{p.url}</span>
              <b>{p.title}</b>
              <em>{p.site}</em>
            </button>
          ))}
        </div>
        {bar}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="large-title" style={{ paddingTop: 56 }}>즐겨찾기</div>
      <div className="scroll">
        <div className="bm-grid">
          {BOOKMARKS.map((b) => (
            <button key={b.label} onClick={() => search(b.q)}>
              <div className="bm-ico">{b.label.slice(0, 1)}</div>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
        <div className="sec-h">
          <span>검색 기록</span>
          {state.history.length > 0 && <button onClick={actions.clearHistory}>지우기</button>}
        </div>
        {state.history.length === 0 && <div className="empty">검색 기록이 없습니다.</div>}
        {state.history.map((h) => (
          <button key={h} className="hist" onClick={() => search(h)}>{h}</button>
        ))}
      </div>
      {bar}
    </div>
  )
}
