import { DAYS } from '../utils'

const EXTRA_APPS = {
  reminders: { label: '미리알림', bg: '#fff' },
  moabank: { label: '토스', bg: '#0064FF' },
  dating: { label: '결', bg: 'linear-gradient(155deg,#ff9a7b 0%,#e8548f 48%,#6a4cff 100%)' },
  netflix: { label: 'NETFLIX', bg: '#000' },
  kakao: { label: '카카오톡', bg: '#fee500' },
  twitter: { label: 'X', bg: '#000' },
  maps: { label: '지도', bg: 'linear-gradient(160deg,#5fd18a,#1fa45a)' },
}

const EXTRA_GLYPHS = {
  maps: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <defs>
        <linearGradient id="mapPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#eaf2ff"/></linearGradient>
        <linearGradient id="mapRoad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd66b"/><stop offset="1" stopColor="#ffb84d"/></linearGradient>
        <filter id="mapPinShadow" x="-40%" y="-30%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8"/></filter>
      </defs>
      <path d="M7 18.5l14-5 17 5.5 15-5v32l-15 5-17-5.5-14 5z" fill="#d7e6f6" opacity=".65" transform="translate(0 1.5)"/>
      <path d="M7 17l14-5 17 5.5 15-5v32l-15 5-17-5.5-14 5z" fill="url(#mapPaper)" stroke="#dbe7ee" strokeWidth="1"/>
      <path d="M21 12v32.5M38 17.5v32" stroke="#9fc7b4" strokeWidth="1.4"/>
      <path d="M9 25l11-4 8 5 9-3 14 4" stroke="#b8d9c7" strokeWidth="2" fill="none"/>
      <path d="M10 39l10-3 8 4 10-5 13 2" stroke="#b8d9c7" strokeWidth="2" fill="none"/>
      <path d="M22 30c0-6.6 5-11.8 11-11.8S44 23.4 44 30c0 8-11 19-11 19S22 38 22 30z" fill="#ea4335" opacity=".2" filter="url(#mapPinShadow)" transform="translate(1 2)"/>
      <path d="M22 28.5c0-6.6 5-11.8 11-11.8S44 21.9 44 28.5c0 8-11 19-11 19s-11-11-11-19z" fill="#e94b43" stroke="#d93832" strokeWidth="1"/>
      <circle cx="33" cy="28.5" r="4.2" fill="#fff"/>
    </svg>
  ),
  reminders: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[['#ff9500', 16], ['#34c759', 30], ['#007aff', 44]].map(([c, y]) => (
        <g key={y}>
          <circle cx="15" cy={y} r="4.5" fill="none" stroke={c} strokeWidth="2.2" />
          <rect x="25" y={y - 1.5} width="23" height="3" rx="1.5" fill="#d1d1d6" />
        </g>
      ))}
    </svg>
  ),
  moabank: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <defs>
        <linearGradient id="tossMark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#dceaff"/></linearGradient>
        <filter id="tossShadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>
      </defs>
      <path d="M17 25c0-7.1 5.8-12.8 13-12.8h13.5c2.6 0 4.7 2.1 4.7 4.7s-2.1 4.7-4.7 4.7H30c-1.9 0-3.4 1.5-3.4 3.4s1.5 3.4 3.4 3.4h5.8c7.2 0 13 5.8 13 12.9s-5.8 12.9-13 12.9H20.5a4.7 4.7 0 1 1 0-9.4h15.3c2 0 3.5-1.5 3.5-3.5s-1.5-3.5-3.5-3.5H30c-7.2 0-13-5.7-13-12.8z" fill="#0054d9" opacity=".24" filter="url(#tossShadow)" transform="translate(0 1)"/>
      <path d="M15.5 23.5c0-7 5.7-12.5 12.7-12.5h14.2a4.5 4.5 0 0 1 0 9H28.2c-2 0-3.6 1.6-3.6 3.5s1.6 3.5 3.6 3.5h7.3c7 0 12.7 5.6 12.7 12.5S42.5 52 35.5 52H19.8a4.5 4.5 0 0 1 0-9h15.7c2 0 3.6-1.6 3.6-3.5S37.5 36 35.5 36h-7.3c-7 0-12.7-5.6-12.7-12.5z" fill="url(#tossMark)"/>
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
      <path d="M13 12h10.5l11.1 14.8L47.5 12H51L36.2 29.2 52 48H41.5L29.7 32.2 16 48h-3.5l15.7-18.3L13 12zm6.8 3 23.2 30h3.2L23 15h-3.2z" fill="#fff" />
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <defs><linearGradient id="kakaoBubble" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#442b22"/><stop offset="1" stopColor="#281811"/></linearGradient></defs>
      <ellipse cx="30" cy="27" rx="22" ry="17.5" fill="url(#kakaoBubble)"/>
      <path d="M16 40l-2.5 8.5 11-5.8" fill="#281811"/>
      <circle cx="21" cy="27" r="2" fill="#fee500"/><circle cx="30" cy="27" r="2" fill="#fee500"/><circle cx="39" cy="27" r="2" fill="#fee500"/>
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
  music: { label: '음악', bg: 'linear-gradient(#ff6b81,#fa233b)' },
  appstore: { label: 'App Store', bg: 'linear-gradient(180deg,#1ccbfc 0%,#1a6ff0 100%)' },
  weather: { label: '날씨', bg: 'linear-gradient(#58b8ff,#2874e8)' },
  someone: { label: '썸원', bg: 'linear-gradient(#ff9aab,#f35b82)' },
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
    case 'mail':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <rect x="12" y="17" width="36" height="26" rx="4" fill="#fff" />
          <path d="M13 20l17 13 17-13" fill="none" stroke="#2a7ff0" strokeWidth="2.6" strokeLinejoin="round" />
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
          <defs>
            <linearGradient id="safariFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#e7f5ff"/></linearGradient>
            <linearGradient id="safariBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38b8ff"/><stop offset="1" stopColor="#1764d8"/></linearGradient>
            <filter id="safariShadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
          </defs>
          <circle cx="30" cy="30" r="24" fill="#b9dfff" opacity=".6"/>
          <circle cx="30" cy="30" r="22.5" fill="url(#safariFace)" stroke="#fff" strokeWidth="1.5"/>
          {[0,30,60,90,120,150].map((r)=><path key={r} d="M30 9v3" stroke="#8bb9e8" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${r} 30 30)`}/>)}
          <circle cx="30" cy="30" r="17.5" fill="none" stroke="#9bc9f2" strokeWidth="1.2"/>
          <path d="M39 17L33 33 17 39 23 23z" fill="#d9e6f3" filter="url(#safariShadow)"/>
          <path d="M39 17L33 33 23 23z" fill="#f0444d"/>
          <path d="M17 39L23 23 33 33z" fill="url(#safariBlue)"/>
          <circle cx="30" cy="30" r="2" fill="#fff" stroke="#8eb9e7" strokeWidth=".8"/>
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <path d="M20.2 13.8c1.8-1.1 4.1-.5 5.2 1.3l3.2 5.3c.9 1.5.6 3.4-.8 4.5l-2.2 1.7c2.1 4.1 5.3 7.2 9.4 9.3l1.7-2.2c1.1-1.4 3-1.7 4.5-.8l5.3 3.2c1.8 1.1 2.4 3.4 1.3 5.2l-1.2 2c-1.9 3.1-5.8 4.4-9.2 3-12.1-5-21.1-14-26.1-26.1-1.4-3.4-.1-7.3 3-9.2z" fill="#fff" stroke="#e9fff2" strokeWidth="1.1"/>
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
          <defs><linearGradient id="musicNote" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#ffe7ed"/></linearGradient></defs>
          <path d="M39.5 10.5c.8-.2 1.5.4 1.5 1.2v27.1c0 5.2-4 9.2-9 9.2-3.8 0-6.7-2.4-6.7-5.7 0-3.7 3.7-6.8 8.2-6.8 1 0 2 .2 2.8.5V20.8l-17 4.4v17.1c0 5.2-4 9.2-9 9.2-3.8 0-6.7-2.4-6.7-5.7 0-3.7 3.7-6.8 8.2-6.8 1 0 2 .2 2.8.5V18.4c0-.9.6-1.7 1.5-1.9z" fill="url(#musicNote)" transform="translate(5 -1) scale(.94)"/>
        </svg>
      )
    case 'weather':
      return <svg viewBox="0 0 60 60" width="60" height="60"><circle cx="39" cy="20" r="9" fill="#ffd85a" /><path d="M14 39c0-6 5-10 11-9 2-8 14-10 19-3 7 0 10 5 10 11 0 5-4 8-9 8H23c-5 0-9-3-9-7z" fill="#fff" /></svg>
    case 'someone':
      return <svg viewBox="0 0 60 60" width="60" height="60">
        <defs><linearGradient id="someoneHeart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#ffe5e9"/></linearGradient></defs>
        <path d="M30 49S7 35.5 7 21.5C7 12 18.5 8 26.5 17c1.2 1.3 2.4 2.8 3.5 4.3 1.1-1.5 2.3-3 3.5-4.3 8-9 19.5-5 19.5 4.5C53 35.5 30 49 30 49z" fill="#d94a73" opacity=".18" transform="translate(0 2)"/>
        <path d="M30 47S9 34.5 9 21.8C9 13.2 19.5 9.5 27 18c1 1.1 2.1 2.5 3 3.8 1-1.3 2-2.7 3-3.8 7.5-8.5 18-4.8 18 3.8C51 34.5 30 47 30 47z" fill="url(#someoneHeart)"/>
        <path d="M17 20c1.5-3.4 5.1-4.2 7.7-2.7" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" fill="none"/>
      </svg>
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
