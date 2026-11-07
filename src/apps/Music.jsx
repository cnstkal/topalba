
import { SONGS, dev, useDevice } from '../engine/device'

export default function Music() {
  const { song } = useDevice()
  const cur = song.cur
  const play = song.play
  return (
    <div className="page">
      <div className="nav"><span /><span className="nav-btn">편집</span></div>
      <div className="large-title">보관함</div>
      <div className="scroll">
        {SONGS.map(([t, a, c], i) => (
          <button key={t} className="song" onClick={() => dev.play(i)}>
            <div className="song-art" style={{ background: c }} />
            <div><b style={{ color: cur === i ? '#fa233b' : undefined }}>{t}</b><span>{a}</span></div>
          </button>
        ))}
      </div>
      {cur !== null && (
        <div className="mini-player">
          <div className="song-art" style={{ background: SONGS[cur][2] }} />
          <b>{SONGS[cur][0]}</b>
          <button onClick={() => dev.toggle()}>{play ? '❚❚' : '▶'}</button>
          <button onClick={() => dev.next(1)}>▶▶</button>
        </div>
      )}
    </div>
  )
}
