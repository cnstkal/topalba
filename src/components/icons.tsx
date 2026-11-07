import { DAYS } from '../utils'

const EXTRA_APPS = {
  reminders: { label: '미리알림', bg: '#fff' },
  moabank: { label: '신한 SOL뱅크', bg: 'linear-gradient(145deg,#2f6bff,#0046ff)' },
  dating: { label: '결', bg: 'linear-gradient(150deg,#2b2a4c,#6a4cff 70%,#ff7a59)' },
  netflix: { label: 'NETFLIX', bg: '#000' },
  kakao: { label: '카카오톡', bg: '#fee500' },
  maps: { label: '지도', bg: 'linear-gradient(160deg,#f8f4e9,#e4ddca)' },
}

const EXTRA_GLYPHS = {
  maps: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {/* 가상 벡터 지도 아이콘: 공원 / 하천 / 도로 / 경로 / 핀 */}
      <rect width="60" height="60" fill="#f4efe2" />
      <path d="M0 0H27L21 24H0z" fill="#cfe5bc" />
      <path d="M0 40C14 38 26 46 38 41S52 44 60 42V52C50 55 42 51 34 54S12 52 0 53z" fill="#bfe1f0" />
      <path d="M44 0 38 60" stroke="#dedad0" strokeWidth="6.5" fill="none" />
      <path d="M0 27 60 22" stroke="#fff" strokeWidth="5.5" fill="none" />
      <path d="M13 0 9 60M56 0 53 60" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M44 0 38 60" stroke="#fff" strokeWidth=".9" strokeDasharray="3 3" fill="none" />
      <path d="M9 46 13 27 41 24 39 10" stroke="#2f7cf6" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="46" r="3.4" fill="#fff" stroke="#2f7cf6" strokeWidth="2" />
      <path d="M39 29c-5.500-5.500-8-8.500-8-12.500a8 8 0 0 1 16 0c0 4-2.500 7-8 12.500z" fill="#ff453a" stroke="#fff" strokeWidth="1.800" />
      <circle cx="39" cy="16.500" r="2.800" fill="#fff" />
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
    <svg viewBox="0 0 32 32" width="60" height="60">
      <path d="M21 10.5C19.8 9 18.2 8.3 16 8.3c-2.6 0-4.3 1.2-4.3 3 0 4.3 8.8 1.7 8.8 6.5 0 1.9-1.8 3.3-4.6 3.3-2.2 0-4-.8-5.2-2.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23.6" cy="23.6" r="2" fill="#8fd3ff" />
    </svg>
  ),
  dating: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <path d="M12 38c6-14 14-14 18-4 4-10 12-10 18 4" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M12 46c6-14 14-14 18-4 4-10 12-10 18 4" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".45" />
    </svg>
  ),
  netflix: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <path d="M20 12h6l8 22V12h6v36h-6l-8-22v22h-6z" fill="#e50914" />
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <ellipse cx="30" cy="29" rx="20" ry="16" fill="#3b1e1e" />
      <path d="M19 44l6-5 3 5z" fill="#3b1e1e" />
      <text x="30" y="35" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fee500" fontFamily="Arial">TALK</text>
    </svg>
  ),
}


const S = { fill: 'none', stroke: '#fff', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }

// 홈 화면 앱 정의 (순서/배치는 여기서 관리)
export const APPS = {
  messages: { label: '메시지', bg: 'linear-gradient(#67e86c,#1fc84a)' },
  sns: { label: '그램', bg: 'linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf)' },
  mail: { label: '메일', bg: 'linear-gradient(#3fa9f5,#1a6cf0)' },
  photos: { label: '사진', bg: '#fff' },
  calendar: { label: '캘린더', bg: '#fff' },
  notes: { label: '메모', bg: 'linear-gradient(#ffe36b 0 28%,#fffdf2 28%)' },
  safari: { label: 'Safari', bg: '#fff' },
  phone: { label: '전화', bg: 'linear-gradient(#67e86c,#1fc84a)' },
  settings: { label: '설정', bg: 'linear-gradient(#c7c7cc,#8e8e93)' },
  clock: { label: '시계', bg: '#000' },
  music: { label: '음악', bg: 'linear-gradient(#ff6b81,#fa233b)' },
  appstore: { label: 'App Store', bg: 'linear-gradient(#3fb9fc,#1578f5)' },
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
          <circle cx="30" cy="30" r="22" fill="none" stroke="#2a8cf7" strokeWidth="3" />
          <path d="M40 20L34 34 20 40 26 26z" fill="#ff3b30" />
          <path d="M40 20L34 34 26 26z" fill="#2a8cf7" opacity=".0" />
          <path d="M20 40L26 26 34 34z" fill="#d1d1d6" />
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <path d="M22 16c2-1 4 0 5 2l2 4c.6 1.3.2 2.6-1 3.4l-2 1.4c1.6 3.2 4 5.6 7.2 7.4l1.6-2c.9-1.100 2.300-1.300 3.500-.7l4 2.200c1.800 1 2.200 3 1 4.700-3 4-8 3.600-13-.4-6-4.800-9-11-6.600-17.200.2-.6.600-1.200 1.300-1.800z" fill="#fff" />
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
          <path d="M40 14v22.500a6 6 0 1 1-3-5.200V21l-14 3.500V40a6 6 0 1 1-3-5.200V19z" fill="#fff" />
        </svg>
      )
    case 'weather':
      return <svg viewBox="0 0 60 60" width="60" height="60"><circle cx="39" cy="20" r="9" fill="#ffd85a" /><path d="M14 39c0-6 5-10 11-9 2-8 14-10 19-3 7 0 10 5 10 11 0 5-4 8-9 8H23c-5 0-9-3-9-7z" fill="#fff" /></svg>
    case 'someone':
      return <svg viewBox="0 0 60 60" width="60" height="60"><path d="M30 48S8 35 8 21c0-10 13-14 22-3 9-11 22-7 22 3 0 14-22 27-22 27z" fill="#fff" /></svg>
    case 'appstore':
      return (
        <svg viewBox="0 0 60 60" width="60" height="60">
          <path d="M30 14l-3 5M30 14l3 5M22 40l12-22M38 40L26 18M19 33h22" {...S} strokeWidth="3.400" transform="translate(0 2)" />
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
    <button className="app-icon" onClick={onClick} ref={innerRef} style={{ width: size }}>
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
