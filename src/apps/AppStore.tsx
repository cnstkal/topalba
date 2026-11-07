import './AppStore.css'

/* App Store '앱' 탭 목업. 모든 버튼은 장식 (눌러도 반응 없음) */
const Sv = ({ s = 24, children, ...p }) => <svg viewBox="0 0 24 24" width={s} height={s} {...p}>{children}</svg>
const St = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

/* 앱 아이콘 (벡터) */
const ICONS = {
  grok: <svg viewBox="0 0 60 60"><rect width="60" height="60" rx="14" fill="#000" /><circle cx="30" cy="31" r="14" fill="none" stroke="#b9b9bd" strokeWidth="4.500" /><path d="M12 50 49 10 34 32z" fill="#e8e8ea" /></svg>,
  gemini: <svg viewBox="0 0 60 60"><rect x=".5" y=".5" width="59" height="59" rx="14" fill="#fff" stroke="#e0e0e5" /><defs><linearGradient id="gm" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#34a853" /><stop offset=".4" stopColor="#fbbc05" /><stop offset=".7" stopColor="#ea4335" /><stop offset="1" stopColor="#4285f4" /></linearGradient></defs><path d="M30 8c2 13 7 19 22 22-15 3-20 9-22 22-2-13-7-19-22-22 15-3 20-9 22-22z" fill="url(#gm)" /></svg>,
  gpt: <svg viewBox="0 0 60 60"><rect x=".5" y=".5" width="59" height="59" rx="14" fill="#f7f7f8" stroke="#e0e0e5" /><g fill="none" stroke="#111" strokeWidth="3.200" strokeLinejoin="round">{[0, 60, 120, 180, 240, 300].map((r) => <path key={r} transform={`rotate(${r} 30 30)`} d="M30 30V13a8 8 0 0 1 14-4l5 9-14 8" />)}</g></svg>,
  baemin: <svg viewBox="0 0 60 60"><defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3fd6bf" /><stop offset="1" stopColor="#75e6cf" /></linearGradient></defs><rect width="60" height="60" rx="14" fill="url(#bm)" /><path d="M16 12v36M30 12v36M44 12v36" stroke="#111" strokeWidth="5" /><path d="M16 26h14M30 36h14" stroke="#3fd6bf" strokeWidth="6" /><path d="M16 26h14M30 36h14" stroke="#111" strokeWidth="5" /></svg>,
  vllo: <svg viewBox="0 0 60 60"><rect x=".5" y=".5" width="59" height="59" rx="14" fill="#fff" stroke="#e0e0e5" /><path d="M10 30c7-10 18-12 26-4l9-6v20l-9-6c-8 8-19 6-26-4z" fill="#ee4a62" /><circle cx="19" cy="29" r="4" fill="#fff" /><circle cx="19" cy="29" r="2" fill="#ee4a62" /></svg>,
  panora: <svg viewBox="0 0 60 60"><defs><linearGradient id="pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3b25a" /><stop offset="1" stopColor="#ec8a45" /></linearGradient></defs><rect width="60" height="60" rx="14" fill="url(#pn)" /><path d="M0 36 14 32l9-7 7 8 8-6 10 7 12-2" fill="none" stroke="#1a1208" strokeWidth="4" strokeLinejoin="round" /></svg>,
}
const Cloud = () => <Sv s={32} {...St} strokeWidth="1.700"><path d="M7 18a4.500 4.500 0 0 1-.6-9A6 6 0 0 1 18 8a4 4 0 0 1 .5 8M12 11v9M8.500 17 12 20.500 15.500 17" /></Sv>

const SEC = [
  { t: '지금 써봐야 할 AI 툴', rows: [
    ['grok', 'Grok', 'SpaceXSI AI 어시스턴트', 'dl'], ['gemini', 'Google Gemini', 'Google에서 제공하는 AI 어시스턴트', '열기'], ['gpt', 'ChatGPT', '일상에서 사용하는 AI 어시스턴트', '열기'],
  ] },
  { t: 'iOS 27을 최대한 활용하는 앱', s: '새단장을 마친 앱을 만나보세요', rows: [
    ['baemin', '배달의민족 - 배달팁 무료 배민클럽', '내가 찾던 맛집 배민엔 다 있어요', '열기'], ['vllo', 'VLLO 블로 - AI 영상 편집기', 'AI 자동 영상 편집 / 쇼츠, 릴스,…', 'dl'], ['panora', '파노라: 실시간 스트레스 워치', '스트레스 흐름을 한 눈에', '받기', '앱 내 구입'],
  ] },
]
const TABS = [
  ['투데이', <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h3" /></>],
  ['게임', <path d="M5 19c2-3 3-4 5-4l3-3c1-4 4-7 8-7 0 4-3 7-7 8l-3 3c0 2-1 3-4 5zM8 12c-2 0-3 1-4 3" />],
  ['앱', <><path d="m12 3 9 5-9 5-9-5z" fill="currentColor" /><path d="m3 12.500 9 5 9-5M3 16.500l9 5 9-5" /></>],
  ['Arcade', <><path d="M3 15c0 3 4 5 9 5s9-2 9-5l-9-4z" fill="currentColor" /><circle cx="12" cy="5" r="2.500" fill="currentColor" /><path d="M12 8v3" /></>],
  ['검색', <><circle cx="10.500" cy="10.500" r="6.500" /><path d="m20 20-4.800-4.800" /></>],
]

export default function AppStore() {
  return (
    <div className="as">
      <div className="as-sc">
        <header><h1>앱</h1><i className="as-me">소윤</i></header>
        {SEC.map((g) => (
          <section key={g.t}>
            <h2>{g.t}<Sv s={22} {...St} strokeWidth="2.600"><path d="m9 5 7 7-7 7" /></Sv></h2>
            {g.s && <p className="as-sub">{g.s}</p>}
            {g.rows.map(([ic, n, d, b, iap]) => (
              <div className="as-row" key={n}>
                <span className="as-ic">{ICONS[ic]}</span>
                <div className="as-tx"><b>{n}</b><span>{d}</span></div>
                <div className="as-bt">{b === 'dl' ? <Cloud /> : <button>{b}</button>}{iap && <small>{iap}</small>}</div>
              </div>
            ))}
          </section>
        ))}
        <section><h2 className="as-cut">오늘 뭐 보지?</h2></section>
      </div>
      <nav className="as-tab">{TABS.map(([l, g]) => (
        <span key={l} className={l === '앱' ? 'on' : ''}><Sv s={30} {...St}>{g}</Sv><em>{l}</em></span>))}</nav>
    </div>
  )
}
