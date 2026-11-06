import { useState } from 'react'
import Back from '../components/Back'
import { useGame } from '../engine/store'

export default function Notes() {
  const { state, actions } = useGame()
  const [edit, setEdit] = useState(null)

  const save = () => {
    if (edit && (edit.title.trim() || edit.body.trim())) {
      actions.saveNote({ ...edit, title: edit.title.trim() || edit.body.split('\n')[0].slice(0, 20) })
    }
    setEdit(null)
  }

  if (edit) {
    return (
      <div className="page">
        <div className="nav">
          <Back onClick={save}>메모</Back>
          <button className="nav-btn" onClick={() => { actions.deleteNote(edit.id); setEdit(null) }}>삭제</button>
        </div>
        <div className="note-edit">
          <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="제목" />
          <textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} placeholder="내용을 입력하세요" />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav"><span /><span className="nav-btn">편집</span></div>
      <div className="large-title">메모</div>
      <div className="search-field">검색</div>
      <div className="scroll">
        <div className="group">
          {state.notes.map((n) => (
            <button key={n.id} className="note-row" onClick={() => setEdit({ id: n.id, title: n.title, body: n.body })}>
              <b>{n.title}</b>
              <span>{new Date(n.ts).getMonth() + 1}/{new Date(n.ts).getDate()} &nbsp; {n.body.split('\n')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <span className="muted">{state.notes.length}개의 메모</span>
        <button className="compose" onClick={() => setEdit({ id: `nn${Date.now()}`, title: '', body: '' })}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d9a400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
