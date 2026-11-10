import { DAYS } from '../utils'

const EXTRA_APPS = {
  moabank: { label: '토스뱅크', bg: '#0064FF' },
  dating: { label: '결', bg: 'linear-gradient(155deg,#ff9a7b 0%,#e8548f 48%,#6a4cff 100%)' },
  netflix: { label: 'NETFLIX', bg: '#000' },
  kakao: { label: '카카오톡', bg: '#fee500' },
  twitter: { label: 'X', bg: '#000' },
  maps: { label: '지도', bg: 'linear-gradient(160deg,#6fe3a0,#16a050)' },
  tetris: { label: '테트리스', bg: 'linear-gradient(160deg,#6a3df0 0%,#2a1a8c 55%,#120a3a 100%)' },
}

const EXTRA_GLYPHS = {
  tetris: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <g><rect x="6" y="43" width="11" height="11" rx="2.5" fill="#22d3ee" /><rect x="7.2" y="44.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="17.5" y="43" width="11" height="11" rx="2.5" fill="#22d3ee" /><rect x="18.7" y="44.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="29" y="43" width="11" height="11" rx="2.5" fill="#22d3ee" /><rect x="30.2" y="44.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="40.5" y="43" width="11" height="11" rx="2.5" fill="#22d3ee" /><rect x="41.7" y="44.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="6" y="31.5" width="11" height="11" rx="2.5" fill="#4ade80" /><rect x="7.2" y="32.7" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="17.5" y="31.5" width="11" height="11" rx="2.5" fill="#fb7185" /><rect x="18.7" y="32.7" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="40.5" y="31.5" width="11" height="11" rx="2.5" fill="#facc15" /><rect x="41.7" y="32.7" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="40.5" y="20" width="11" height="11" rx="2.5" fill="#facc15" /><rect x="41.7" y="21.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="23" y="8" width="11" height="11" rx="2.5" fill="#c084fc" /><rect x="24.2" y="9.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="11.5" y="8" width="11" height="11" rx="2.5" fill="#c084fc" /><rect x="12.7" y="9.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="34.5" y="8" width="11" height="11" rx="2.5" fill="#c084fc" /><rect x="35.7" y="9.2" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /><rect x="23" y="-3.5" width="11" height="11" rx="2.5" fill="#c084fc" /><rect x="24.2" y="-2.3" width="8.6" height="3.6" rx="1.6" fill="#fff" opacity=".4" /></g>
    </svg>
  ),
  maps: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <defs><linearGradient id="gbp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6b6b" /><stop offset="1" stopColor="#e11d2e" /></linearGradient></defs>
      <path d="M9 19l14-5v29l-14 5z" fill="#e8f7ee" />
      <path d="M23 14l14 5v29l-14-5z" fill="#fff" />
      <path d="M37 19l14-5v29l-14 5z" fill="#d3f0df" />
      <path d="M13 41c6-2 8-8 15-8s10 6 18 3" fill="none" stroke="#7fd4a3" strokeWidth="2.4" strokeDasharray="1 4.5" strokeLinecap="round" />
      <ellipse cx="30" cy="46" rx="6" ry="1.8" fill="#000" opacity=".18" />
      <path d="M30 44c-7-7-10-11-10-16a10 10 0 0 1 20 0c0 5-3 9-10 16z" fill="url(#gbp)" />
      <circle cx="30" cy="28" r="3.8" fill="#fff" />
    </svg>
  ),
  moabank: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <path d="M30 10c-12 0-20 7.800-20 17.500 0 5.300 2.500 9.800 6.400 12.800L14 50l10.500-5.200c1.700.4 3.500.6 5.500.6 12 0 20-7.800 20-17.900S42 10 30 10z" fill="#fff" />
      <path d="M30 18.500l3 7.500 7.500 3-7.500 3-3 7.500-3-7.500-7.500-3 7.500-3z" fill="#0064ff" strokeLinejoin="round" stroke="#0064ff" strokeWidth="2" />
    </svg>
  ),
  dating: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <defs>
        <clipPath id="gyA"><circle cx="23.500" cy="30" r="14.500" /></clipPath>
        <linearGradient id="gyL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb199" /><stop offset="1" stopColor="#ff5e8a" /></linearGradient>
      </defs>
      <circle cx="23.500" cy="30" r="14.500" fill="#fff" opacity=".95" />
      <circle cx="36.500" cy="30" r="14.500" fill="#fff" opacity=".38" />
      <circle cx="36.500" cy="30" r="14.500" fill="url(#gyL)" clipPath="url(#gyA)" />
    </svg>
  ),
  netflix: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <path d="M20 12h6l8 22V12h6v36h-6l-8-22v22h-6z" fill="#e50914" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <g fill="none" strokeLinecap="butt">
        <path d="M16 12.5L43.5 47.5" stroke="#fff" strokeWidth="6.2" />
        <path d="M44.5 12.5L28.8 32.6M25.2 37.2L16.5 48" stroke="#fff" strokeWidth="2.6" />
      </g>
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <ellipse cx="30" cy="28" rx="21" ry="17" fill="#3a1d1d" />
      <path d="M17 40l-3 9 11-6z" fill="#3a1d1d" />
      <text x="30" y="33.5" textAnchor="middle" fontSize="14" fontWeight="800" letterSpacing="-.5" fill="#fee500" fontFamily="Helvetica Neue,Arial,sans-serif">TALK</text>
    </svg>
  ),
}


const S = { fill: 'none', stroke: '#fff', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }

// 홈 화면 앱 정의 (순서/배치는 여기서 관리)
export const APPS = {
  messages: { label: '메시지', bg: 'linear-gradient(#67e86c,#1fc84a)' },
  sns: { label: '인스타그램', bg: 'linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf)' },
  photos: { label: '사진', bg: '#fff' },
  calendar: { label: '캘린더', bg: '#fff' },
  notes: { label: '메모', bg: 'linear-gradient(#ffe36b 0 28%,#fffdf2 28%)' },
  safari: { label: 'Safari', bg: '#fff' },
  phone: { label: '전화', bg: 'linear-gradient(#67e86c,#1fc84a)' },
  settings: { label: '설정', bg: 'linear-gradient(#c7c7cc,#8e8e93)' },
  clock: { label: '시계', bg: '#000' },
  music: { label: '음악', bg: 'linear-gradient(#ff7a8e,#fa1f3d)' },
  appstore: { label: 'App Store', bg: 'linear-gradient(180deg,#1ccbfc 0%,#1a6ff0 100%)' },
  weather: { label: '날씨', bg: 'linear-gradient(#5fb2ff,#2f72dc)' },
  someone: { label: '썸원', bg: 'linear-gradient(#ffa9b9,#f04a78)' },
  ...EXTRA_APPS,
}

export function Glyph({ id }) {
  switch (id) {
    case 'messages':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <ellipse cx="30" cy="28" rx="20" ry="16" fill="#fff" />
          <path d="M14 46c4-2 6-5 6-8l6 2z" fill="#fff" />
        </svg>
      )
    case 'sns':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <rect x="15" y="15" width="30" height="30" rx="9" {...S} strokeWidth="3" />
          <circle cx="30" cy="30" r="7.5" {...S} strokeWidth="3" />
          <circle cx="39.5" cy="20.5" r="2" fill="#fff" />
        </svg>
      )
    case 'photos':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          {[['#ff5e57', 0], ['#ffa63d', 45], ['#ffe14d', 90], ['#5ed35e', 135], ['#3fc6e8', 180], ['#4d7cf5', 225], ['#a855f7', 270], ['#ff5fa2', 315]].map(([c, r]) => (
            <ellipse key={r} cx="30" cy="20" rx="6.5" ry="10" fill={c} opacity=".82" transform={`rotate(${r} 30 30)`} style={{ mixBlendMode: 'multiply' }} />
          ))}
        </svg>
      )
    case 'notes':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          {[28, 36, 44, 52].map((y) => (
            <line key={y} x1="8" x2="52" y1={y} y2={y} stroke="#e5d9a0" strokeWidth="1" />
          ))}
        </svg>
      )
    case 'safari':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <defs><linearGradient id="gsf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5ac8fa" /><stop offset="1" stopColor="#0a6cf0" /></linearGradient></defs>
          <circle cx="30" cy="30" r="25" fill="url(#gsf)" />
          {Array.from({ length: 12 }, (_, i) => i * 30).map((r) => (
            <line key={r} x1="30" x2="30" y1="7" y2={r % 90 ? 9 : 11} stroke="#fff" strokeWidth={r % 90 ? 1 : 1.8} strokeLinecap="round" transform={`rotate(${r} 30 30)`} />
          ))}
          <path d="M42 18L34.5 34.5 18 42l7.5-16.5z" fill="#fff" />
          <path d="M42 18L34.5 34.5 25.5 25.5z" fill="#ff3b30" />
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <path transform="translate(7.2 7.2) scale(1.9)" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#fff" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <circle cx="30" cy="30" r="15" fill="#4a4a4f" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
            <rect key={r} x="27" y="11" width="6" height="9" rx="2" fill="#4a4a4f" transform={`rotate(${r} 30 30)`} />
          ))}
          <circle cx="30" cy="30" r="9" fill="#a8a8ad" />
          <circle cx="30" cy="30" r="5" fill="#4a4a4f" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <circle cx="30" cy="30" r="25" fill="#fff" />
          <line x1="30" y1="30" x2="30" y2="14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="30" x2="40" y2="35" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="30" cy="30" r="2" fill="#ff9500" />
        </svg>
      )
    case 'music':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <path d="M23 42V20.5l23-5.5v21" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M23 20.5l23-5.5v6l-23 5.5z" fill="#fff" />
          <ellipse cx="18" cy="42.5" rx="6.5" ry="5.2" fill="#fff" transform="rotate(-18 18 42.5)" />
          <ellipse cx="41" cy="37" rx="6.5" ry="5.2" fill="#fff" transform="rotate(-18 41 37)" />
        </svg>
      )
    case 'weather':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <defs>
            <linearGradient id="gwcl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cfe2fb" /></linearGradient>
            <linearGradient id="gwsun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd45c" /><stop offset="1" stopColor="#ffa726" /></linearGradient>
          </defs>
          <circle cx="39" cy="20" r="10" fill="url(#gwsun)" />
          <path d="M14 43c-4.4 0-8-3.3-8-7.6 0-4 3-7.2 6.9-7.6 1.7-5.8 7-9.8 13.2-9.3 5.3.4 9.6 4.2 10.6 9.2.5-.1 1-.1 1.6-.1 5 0 9 3.6 9 8.1S42.6 43 38 43H14z" fill="url(#gwcl)" />
        </svg>
      )
    case 'someone':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <defs><linearGradient id="gsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ffdfe7" /></linearGradient></defs>
          <path d="M30 49S9 36 9 22c0-9 12-13 21-3 9-10 21-6 21 3 0 14-21 27-21 27z" fill="url(#gsh)" />
          <path d="M16 22c0-3.500 3-6 6.500-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
        </svg>
      )
    case 'appstore':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 44L33.500 16.500" strokeWidth="4.200" />
            <path d="M41 44L26.500 16.500" strokeWidth="4.200" />
            <path d="M15.500 36.500H44.500" strokeWidth="4.200" />
          </g>
        </svg>
      )
    default:
      return EXTRA_GLYPHS[id] || null
  }
}

export function AppIcon({ id, size = 60, badge = 0, noLabel, onClick, innerRef }) {
  const a = APPS[id]
  const today = new Date()
  const scale = size / 60
  return (
    <button className="app-icon" data-app={id} aria-label={a.label} onClick={onClick} ref={innerRef} style={{ width: size }}>
      <div className="app-icon-art" style={{ width: size, height: size, background: a.bg, borderRadius: size * 0.225 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 60, height: 60 }}>
          {id === 'calendar' ? (
            <div className="cal-icon">
              <div className="cal-icon-d">{DAYS[today.getDay()]}</div>
              <div className="cal-icon-n">{today.getDate()}</div>
            </div>
          ) : (
            <Glyph id={id} />
          )}
        </div>
        {badge > 0 && <span className="badge">{badge > 99 ? '99+' : badge}</span>}
      </div>
      {!noLabel && <span className="app-label">{a.label}</span>}
    </button>
  )
}
