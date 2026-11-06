import { useState } from 'react'
import Back from '../components/Back'
import { usePersist } from '../engine/persist'
import '../styles/reminders.css'

const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const SEED = () => [
  { id: 1, title: '마케팅팀 회의 자료 준비', notes: '', date: todayStr(), time: '15:00', done: false },
  { id: 2, title: '우유, 달걀 사기', notes: '', date: '', time: '', done: false },
  { id: 3, title: '엄마께 전화드리기', notes: '주말 일정 여쭤보기', date: todayStr(), time: '', done: true },
]
const LISTS = [
  ['today', '오늘', '#007aff', (r) => r.date === todayStr() && !r.done],
  ['sched', '예정', '#ff3b30', (r) => r.date && !r.done],
  ['all', '전체', '#3a3a3c', (r) => !r.done],
  ['done', '완료됨', '#8e8e93', (r) => r.done],
]
const fmt = (r) => {
  if (!r.date) return ''
  const [, m, d] = r.date.split('-')
  return `${+m}월 ${+d}일${r.time ? ' ' + r.time : ''}`
}

export default function Reminders({ close }) {
  const [items, setItems] = usePersist('reminders', SEED)
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null)

  const save = () => {
    if (!edit.title.trim()) return setEdit(null)
    setItems((a) => edit.id ? a.map((r) => (r.id === edit.id ? edit : r)) : [...a, { ...edit, id: Date.now() }])
    setEdit(null)
  }
  const toggle = (id) => setItems((a) => a.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))

  if (edit) {
    return (
      <div className="page gray rm">
        <div className="nav">
          <button onClick={() => setEdit(null)}>취소</button>
          <b style={{ color: '#000' }}>{edit.id ? '세부사항' : '새로운 미리알림'}</b>
          <button style={{ fontWeight: 600, opacity: edit.title.trim() ? 1 : .4 }} onClick={save}>{edit.id ? '완료' : '추가'}</button>
        </div>
        <div className="rm-card">
          <input autoFocus placeholder="제목" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <textarea placeholder="메모" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
        </div>
        <div className="rm-card">
          <label><span>날짜</span><input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value, time: e.target.value ? edit.time : '' })} /></label>
          <label><span>시간</span><input type="time" disabled={!edit.date} value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></label>
        </div>
        {edit.id && (
          <button className="rm-del" onClick={() => { setItems((a) => a.filter((r) => r.id !== edit.id)); setEdit(null) }}>미리알림 삭제</button>
        )}
      </div>
    )
  }

  const cur = LISTS.find((l) => l[0] === list)
  const shown = cur ? items.filter(cur[3]).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) : []

  return (
    <div className="page gray rm">
      <div className="nav">
        {list ? <Back onClick={() => setList(null)}>목록</Back> : <button onClick={close}>완료</button>}
        <span />
      </div>
      {!list ? (
        <div className="rm-scroll">
          <div className="rm-grid">
            {LISTS.map(([id, name, c, f]) => (
              <button key={id} onClick={() => setList(id)}>
                <i style={{ background: c }} />
                <em>{items.filter(f).length}</em>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rm-scroll">
          <h1 style={{ color: cur[2] }}>{cur[1]}</h1>
          {shown.length === 0 && <p className="rm-empty">미리알림 없음</p>}
          {shown.map((r) => (
            <div className="rm-row" key={r.id}>
              <button className={`rm-chk ${r.done ? 'on' : ''}`} onClick={() => toggle(r.id)} />
              <div className="rm-body" onClick={() => setEdit(r)}>
                <div className={r.done ? 'rm-t done' : 'rm-t'}>{r.title}</div>
                {r.notes && <div className="rm-n">{r.notes}</div>}
                {r.date && <div className={`rm-d ${r.date < todayStr() && !r.done ? 'late' : ''}`}>{fmt(r)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="rm-new" onClick={() => setEdit({ title: '', notes: '', date: list === 'today' ? todayStr() : '', time: '', done: false })}>
        <b>+</b> 새로운 미리알림
      </button>
    </div>
  )
}
