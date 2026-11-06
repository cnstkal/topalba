import { useState } from 'react'

// 가상의 곡 목록 (실제 음원 없음)
const SONGS = [
  ['저녁 산책', '가상 아티스트 A', '#ffd1dc'],
  ['퇴근길', '가상 아티스트 B', '#d1e8ff'],
  ['조용한 밤', '가상 아티스트 C', '#e6e0ff'],
  ['주말 오후', '가상 아티스트 D', '#fff4cc'],
  ['도시의 불빛', '가상 아티스트 E', '#d9f0f2'],
]

export default function Music() {
  const [cur, setCur] = useState(null)
  const [play, setPlay] = useState(false)
  return (
    <div className="page">
      <div className="nav"><span /><span className="nav-btn">편집</span></div>
      <div className="large-title">보관함</div>
      <div className="scroll">
        {SONGS.map(([t, a, c], i) => (
          <button key={t} className="song" onClick={() => { setCur(i); setPlay(true) }}>
            <div className="song-art" style={{ background: c }} />
            <div><b style={{ color: cur === i ? '#fa233b' : undefined }}>{t}</b><span>{a}</span></div>
          </button>
        ))}
      </div>
      {cur !== null && (
        <div className="mini-player">
          <div className="song-art" style={{ background: SONGS[cur][2] }} />
          <b>{SONGS[cur][0]}</b>
          <button onClick={() => setPlay(!play)}>{play ? '❚❚' : '▶'}</button>
          <button onClick={() => setCur((cur + 1) % SONGS.length)}>▶▶</button>
        </div>
      )}
    </div>
  )
}
