import { useEffect, useRef, useState } from 'react'

const CITIES = [['서울', 0, '오늘'], ['뉴욕', -14, '어제'], ['런던', -9, '오늘'], ['도쿄', 0, '오늘']]

export default function Clock() {
  const [tab, setTab] = useState('world')
  const [now, setNow] = useState(new Date())
  const [ms, setMs] = useState(0)
  const [run, setRun] = useState(false)
  const t0 = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!run) return
    t0.current = Date.now() - ms
    const id = setInterval(() => setMs(Date.now() - t0.current), 50)
    return () => clearInterval(id)
  }, [run])

  const city = ([name, off, day]) => {
    const d = new Date(now.getTime() + off * 3600000)
    return (
      <div key={name} className="clock-row">
        <div><span>{day}</span><b>{name}</b></div>
        <em>{String(d.getHours() % 12 || 12)}:{String(d.getMinutes()).padStart(2, '0')}<small>{d.getHours() < 12 ? '오전' : '오후'}</small></em>
      </div>
    )
  }
  const sw = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(Math.floor(ms / 10) % 100).padStart(2, '0')}`

  return (
    <div className="page">
      {tab === 'world' ? (
        <>
          <div className="nav"><span className="nav-btn">편집</span><span /></div>
          <div className="large-title">세계 시계</div>
          <div className="scroll">{CITIES.map(city)}</div>
        </>
      ) : (
        <div className="sw">
          <div className="sw-time">{sw}</div>
          <div className="sw-btns">
            <button onClick={() => { setRun(false); setMs(0) }}>재설정</button>
            <button className={run ? 'stop' : 'start'} onClick={() => setRun(!run)}>{run ? '중단' : '시작'}</button>
          </div>
        </div>
      )}
      <div className="toolbar">
        <button className={tab === 'world' ? 'on' : ''} onClick={() => setTab('world')}>세계 시계</button>
        <button className={tab === 'sw' ? 'on' : ''} onClick={() => setTab('sw')}>스톱워치</button>
      </div>
    </div>
  )
}
