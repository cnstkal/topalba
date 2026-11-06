// 추가 앱 5종 아이콘 정의 (label/bg/glyph)
export const EXTRA_APPS = {
  reminders: { label: '미리알림', bg: '#fff' },
  moabank: { label: '모아뱅크', bg: 'linear-gradient(145deg,#3b82ff,#1746d6)' },
  dating: { label: '결', bg: 'linear-gradient(150deg,#2b2a4c,#6a4cff 70%,#ff7a59)' },
  netflix: { label: 'NETFLIX', bg: '#000' },
  kakao: { label: '카카오톡', bg: '#fee500' },
}

export const EXTRA_GLYPHS = {
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
      <path d="M14 42V20l16 14 16-14v22" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="16" r="3.2" fill="#ffd43b" />
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
