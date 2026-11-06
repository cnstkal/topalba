import { useState } from 'react'
import Back from '../components/Back'
import { DAYS } from '../utils'

const today = new Date()
const Y = today.getFullYear()
const M = today.getMonth()
const D = today.getDate()

// 일정 데이터. 추후 스토리 데이터와 연동 가능
const EVENTS = [
  { id: 'ev1', day: D, title: '마케팅팀 내일 회의 준비', time: '종일', place: '회사', note: '회의 자료 최종 확인' },
  { id: 'ev2', day: D, title: '저녁 약속', time: '오후 8:00', place: '집', note: '' },
  { id: 'ev3', day: Math.min(28, D + 3), title: '치과 예약', time: '오후 6:30', place: '서울 치과', note: '정기 검진' },
  { id: 'ev4', day: Math.min(28, D + 9), title: '월간 보고', time: '오전 10:00', place: '회의실 B', note: '' },
]

export default function Calendar() {
  const [sel, setSel] = useState(D)
  const [detail, setDetail] = useState(null)
  const first = new Date(Y, M, 1).getDay()
  const days = new Date(Y, M + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const evs = EVENTS.filter((e) => e.day === sel)
  const ev = EVENTS.find((e) => e.id === detail)

  if (ev) {
    return (
      <div className="page">
        <div className="nav"><Back onClick={() => setDetail(null)}>{M + 1}월</Back></div>
        <div className="scroll ev-detail">
          <h2>{ev.title}</h2>
          <div className="muted">{M + 1}월 {ev.day}일 {DAYS[new Date(Y, M, ev.day).getDay()]}요일 · {ev.time}</div>
          <div className="card-list">
            <div><span>위치</span>{ev.place}</div>
            <div><span>메모</span>{ev.note || '없음'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav"><span className="red-txt">{Y}년</span><span /></div>
      <div className="large-title">{M + 1}월</div>
      <div className="cal-week">{DAYS.map((d, i) => <span key={d} style={{ color: i === 0 ? '#ff3b30' : undefined }}>{d}</span>)}</div>
      <div className="cal-grid">
        {cells.map((d, i) => (
          <button key={i} disabled={!d} onClick={() => setSel(d)} className={d === sel ? 'sel' : ''}>
            {d && (
              <>
                <span className={`cal-n ${d === D ? 'today' : ''} ${i % 7 === 0 ? 'sun' : ''}`}>{d}</span>
                {EVENTS.some((e) => e.day === d) && <i className="cal-dot" />}
              </>
            )}
          </button>
        ))}
      </div>
      <div className="cal-list-h">{M + 1}월 {sel}일 {DAYS[new Date(Y, M, sel).getDay()]}요일</div>
      <div className="scroll">
        {evs.length === 0 && <div className="empty">일정 없음</div>}
        {evs.map((e) => (
          <button key={e.id} className="ev-row" onClick={() => setDetail(e.id)}>
            <i />
            <div><b>{e.title}</b><span>{e.time}</span></div>
          </button>
        ))}
      </div>
    </div>
  )
}
