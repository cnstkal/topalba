import { useState } from 'react'
import { useGame } from '../engine/store'
import Back from '../components/Back'

const ROWS = [
  [['#ff9500', '에어플레인 모드', 'toggle'], ['#007aff', 'Wi-Fi', 'Home-WiFi'], ['#007aff', 'Bluetooth', '켬'], ['#34c759', '셀룰러', '']],
  [['#ff3b30', '알림', ''], ['#ff2d55', '사운드 및 햅틱', ''], ['#5856d6', '집중 모드', ''], ['#5856d6', '스크린 타임', '']],
  [['#8e8e93', '일반', 'about'], ['#8e8e93', '제어 센터', ''], ['#007aff', '디스플레이 및 밝기', ''], ['#007aff', '배경화면', '']],
]

export default function Settings() {
  const { actions } = useGame()
  const [air, setAir] = useState(false)
  const [about, setAbout] = useState(false)
  const [confirm, setConfirm] = useState(false)

  if (about) {
    return (
      <div className="page gray">
        <div className="nav"><Back onClick={() => setAbout(false)}>설정</Back></div>
        <div className="large-title">정보</div>
        <div className="scroll">
          <div className="group">
            {[['이름', '정윤호의 iPhone'], ['모델 이름', 'iPhone 18 Pro'], ['iOS 버전', '26'], ['용량', '256GB']].map(([k, v]) => (
              <div key={k} className="set-row"><span>{k}</span><em>{v}</em></div>
            ))}
          </div>
          <div className="group" style={{ marginTop: 28 }}>
            <button className="set-row danger" onClick={() => setConfirm(true)}>게임 처음부터 다시 시작</button>
          </div>
          {confirm && (
            <div className="alert-wrap">
              <div className="alert">
                <b>처음부터 다시 시작할까요?</b>
                <p>저장된 진행 상황이 모두 사라집니다.</p>
                <div><button onClick={() => setConfirm(false)}>취소</button><button className="red-txt" onClick={actions.reset}>초기화</button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page gray">
      <div className="large-title" style={{ paddingTop: 56 }}>설정</div>
      <div className="search-field">검색</div>
      <div className="scroll">
        <div className="group prof-set">
          <div className="set-prof"><div className="prof-av">정</div><div><b>정윤호</b><span>Apple ID, iCloud, 미디어 및 구입</span></div></div>
        </div>
        {ROWS.map((g, i) => (
          <div key={i} className="group">
            {g.map(([c, label, v]) => (
              <button key={label} className="set-row" onClick={() => v === 'about' && setAbout(true)}>
                <i style={{ background: c }} />
                <span>{label}</span>
                {v === 'toggle' ? (
                  <div className={`switch ${air ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setAir(!air) }}><i /></div>
                ) : (
                  <em>{v === 'about' ? '' : v}</em>
                )}
                <b className="chev">›</b>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
