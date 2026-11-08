import { useState } from 'react'
import { useGame } from '../engine/store'
import { dev, useDevice } from '../engine/device'
import Back from '../components/Back'

/* iOS 설정 앱 스타일 심볼 (흰색 글리프, 24x24 기준) */
const S = { fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const GLYPH = {
  '에어플레인 모드': <path fill="#fff" d="M21.5 15.5v-1.8L13.6 8.8V4.2a1.6 1.6 0 0 0-3.2 0v4.6l-7.9 4.9v1.8l7.9-2.3v4.4l-2.1 1.6v1.4l3.7-1 3.7 1v-1.4l-2.1-1.6v-4.4z" />,
  'Wi-Fi': (
    <>
      <path {...S} d="M2.5 9.2a14 14 0 0 1 19 0M5.7 12.6a9.4 9.4 0 0 1 12.6 0M8.9 16a4.8 4.8 0 0 1 6.2 0" />
      <circle cx="12" cy="19.4" r="1.5" fill="#fff" />
    </>
  ),
  Bluetooth: <path {...S} d="M6.5 7.5l11 9-5.5 4.5V3l5.5 4.5-11 9" />,
  셀룰러: (
    <>
      <rect x="3" y="14.5" width="3.2" height="5" rx="1" fill="#fff" />
      <rect x="8" y="11" width="3.2" height="8.5" rx="1" fill="#fff" />
      <rect x="13" y="7.5" width="3.2" height="12" rx="1" fill="#fff" />
      <rect x="18" y="4" width="3.2" height="15.5" rx="1" fill="#fff" />
    </>
  ),
  알림: <path fill="#fff" d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2v3.6l-1.9 3.2a.9.9 0 0 0 .8 1.4h14.6a.9.9 0 0 0 .8-1.4l-1.9-3.2V9A6.2 6.2 0 0 0 12 2.8zM9.7 18.6a2.3 2.3 0 0 0 4.6 0z" />,
  '사운드 및 햅틱': (
    <>
      <path fill="#fff" d="M3.5 9.5v5h3.8l5 4V5.5l-5 4z" />
      <path {...S} d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.8 7.8 0 0 1 0 10.8" />
    </>
  ),
  '집중 모드': <path fill="#fff" d="M20.3 14.6A8.6 8.6 0 0 1 9.4 3.7a8.6 8.6 0 1 0 10.9 10.9z" />,
  '스크린 타임': <path fill="#fff" d="M6.2 3h11.6v3.4L13.4 12l4.4 5.6V21H6.2v-3.4L10.6 12 6.2 6.4z" />,
  일반: (
    <>
      <circle cx="12" cy="12" r="5.6" {...S} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="8.6" {...S} strokeWidth="3.2" strokeLinecap="butt" strokeDasharray="3.4 3.4" />
      <circle cx="12" cy="12" r="2" fill="#fff" />
    </>
  ),
  '제어 센터': (
    <>
      <path {...S} d="M3.5 8h9.5M18.5 8h2M3.5 16h2M11 16h9.5" />
      <circle cx="15.7" cy="8" r="2.4" {...S} />
      <circle cx="8.3" cy="16" r="2.4" {...S} />
    </>
  ),
  '디스플레이 및 밝기': (
    <>
      <circle cx="12" cy="12" r="4" fill="#fff" />
      <path {...S} d="M12 2.8v2.3M12 18.9v2.3M2.8 12h2.3M18.9 12h2.3M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" />
    </>
  ),
  배경화면: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" {...S} strokeWidth="1.8" />
      <path {...S} strokeWidth="1.8" d="M3.8 16.5l4.7-4.6 3.6 3.4 2.8-2.6 5.3 5" />
      <circle cx="15.8" cy="9.3" r="1.5" fill="#fff" />
    </>
  ),
}

const ROWS = [
  [['#ff9500', '에어플레인 모드', 'toggle'], ['#007aff', 'Wi-Fi', 'Home-WiFi'], ['#007aff', 'Bluetooth', 'bt'], ['#34c759', '셀룰러', '']],
  [['#ff3b30', '알림', ''], ['#ff2d55', '사운드 및 햅틱', ''], ['#5856d6', '집중 모드', ''], ['#5856d6', '스크린 타임', '']],
  [['#8e8e93', '일반', 'about'], ['#8e8e93', '제어 센터', ''], ['#007aff', '디스플레이 및 밝기', ''], ['#32ade6', '배경화면', '']],
]

const Chev = () => (
  <svg className="st-chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 1.5L7 7l-5.5 5.5" />
  </svg>
)

export default function Settings() {
  const { actions } = useGame()
  const [air, setAir] = useState(false)
  const [about, setAbout] = useState(false)
  const [bt, setBt] = useState(false)
  const d = useDevice()
  const [confirm, setConfirm] = useState(false)

  if (about) {
    return (
      <div className="page gray st">
        <div className="nav st-nav">
          <Back onClick={() => setAbout(false)}>설정</Back>
          <span className="st-nav-title">정보</span>
        </div>
        <div className="scroll st-scroll">
          <div className="st-group">
            {[['이름', '박성화의 iPhone'], ['모델 이름', 'iPhone 18 Pro'], ['iOS 버전', '26'], ['용량', '256GB']].map(([k, v]) => (
              <div key={k} className="st-row plain">
                <span className="st-lb">{k}</span>
                <em className="st-val">{v}</em>
              </div>
            ))}
          </div>
          <div className="st-group" style={{ marginTop: 30 }}>
            <button className="st-row plain danger" onClick={() => setConfirm(true)}>게임 처음부터 다시 시작</button>
          </div>
        </div>
        {confirm && (
          <div className="st-dim">
            <div className="st-alert">
              <div className="st-alert-b">
                <b>처음부터 다시 시작할까요?</b>
                <p>저장된 진행 상황이 모두 사라집니다.</p>
              </div>
              <div className="st-alert-act">
                <button onClick={() => setConfirm(false)}>취소</button>
                <button className="red-txt" onClick={actions.reset}>초기화</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (bt) {
    return (
      <div className="page gray st bt">
        <button className="bt-back" onClick={() => setBt(false)} aria-label="뒤로">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10l8 8" /></svg>
        </button>
        <div className="scroll st-scroll">
          <div className="st-group bt-card">
            <i className="bt-ic"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 7.5l11 9-5.5 4.5V3l5.5 4.5-11 9" /></svg></i>
            <h1>Bluetooth</h1>
            <p>음악 스트리밍, 전화 통화 및 게임과 같은 활동에 사용할 수 있는 액세서리에 연결하십시오. <a>더 알아보기…</a></p>
            <div className="bt-sw-row"><span>Bluetooth</span><div className={`st-sw ${d.bt ? 'on' : ''}`} role="switch" aria-checked={d.bt} onClick={() => dev.set({ bt: !d.bt })}><i /></div></div>
          </div>
          <>
              <div className="st-group bt-allow"><button className="st-row plain">새로운 연결 허용</button></div>
              <p className="bt-note">제어 센터에서 새로운 Bluetooth에 연결하는 기능이 꺼져 있습니다.</p>
              <div className="bt-h">나의 기기</div>
              <div className="st-group">
                {['AirPods', 'Bluetooth Keyboard'].map((n) => (
                  <div key={n} className="st-row plain"><span className="st-lb">{n}</span><em className="st-val">연결 안 됨</em><i className="bt-info">i</i></div>
                ))}
              </div>
              <div className="bt-h">다른 기기 <span className="bt-spin" /></div>
              <p className="bt-note">Apple Watch를 iPhone과 페어링하려면, <a>Apple Watch 앱</a>(으)로 이동하십시오.</p>
          </>
        </div>
      </div>
    )
  }

  return (
    <div className="page gray st">
      <div className="st-title">설정</div>
      <div className="st-search">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></svg>
        <span>검색</span>
        <svg className="st-mic" width="15" height="18" viewBox="0 0 15 20" fill="currentColor"><rect x="4" y="0" width="7" height="12" rx="3.5" /><path d="M1 9.5a6.5 6.5 0 0 0 13 0M7.5 16v3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </div>
      <div className="scroll st-scroll">
        <div className="st-group">
          <div className="st-row st-prof">
            <div className="st-av">박</div>
            <div className="st-prof-t"><b>박성화</b><span>Apple ID, iCloud, 미디어 및 구입</span></div>
            <Chev />
          </div>
        </div>
        {ROWS.map((g, i) => (
          <div key={i} className="st-group">
            {g.map(([c, label, v]) => (
              <button key={label} className="st-row" onClick={() => { if (v === 'about') setAbout(true); else if (v === 'bt') setBt(true) }}>
                <i className="st-ic" style={{ background: c }}>
                  <svg width="20" height="20" viewBox="0 0 24 24">{GLYPH[label]}</svg>
                </i>
                <span className="st-lb">{label}</span>
                {v === 'toggle' ? (
                  <div className={`st-sw ${air ? 'on' : ''}`} role="switch" aria-checked={air} onClick={(e) => { e.stopPropagation(); setAir(!air) }}><i /></div>
                ) : (
                  <>
                    {v === 'bt' ? <em className="st-val">{d.bt ? '켬' : '끔'}</em> : v !== 'about' && v && <em className="st-val">{v}</em>}
                    <Chev />
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
