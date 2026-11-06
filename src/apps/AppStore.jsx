import { useState } from 'react'

const LIST = [
  ['메모 정리', '일상 기록 도우미', '#ffe36b'],
  ['날씨누리', '오늘의 날씨', '#8ecbff'],
  ['맛집지도', '근처 식당 찾기', '#ffb199'],
  ['걷기 기록', '하루 걸음 수', '#b6e8b0'],
  ['가계부 노트', '간단한 지출 관리', '#d7c8ff'],
]

export default function AppStore() {
  const [got, setGot] = useState({})
  const d = new Date()
  return (
    <div className="page">
      <div className="nav"><span className="muted">{d.getMonth() + 1}월 {d.getDate()}일</span><span /></div>
      <div className="large-title">투데이</div>
      <div className="scroll">
        <div className="feature"><span>오늘의 앱</span><b>하루를 정리하는 가벼운 도구들</b></div>
        {LIST.map(([n, s, c]) => (
          <div key={n} className="store-row">
            <div className="song-art" style={{ background: c, borderRadius: 14, width: 60, height: 60 }} />
            <div><b>{n}</b><span>{s}</span></div>
            <button className={got[n] ? 'got' : ''} onClick={() => setGot({ ...got, [n]: true })}>{got[n] ? '열기' : '받기'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
