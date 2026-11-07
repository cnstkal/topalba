import { useState } from 'react'

const TOGGLES = [
  { id: 'air', label: '비행기 모드', icon: '✈️' },
  { id: 'cell', label: '셀룰러', icon: '📶' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📡' },
  { id: 'bt', label: 'Bluetooth', icon: '🔵' },
]
const ROUND = ['🔦', '⏱', '🧮', '📷']

export default function ControlCenter({ open, onClose }) {
  const [on, setOn] = useState({ air: false, cell: true, wifi: true, bt: true })
  const [bright, setBright] = useState(70)
  const [vol, setVol] = useState(50)

  if (!open) return null

  const flip = (id) => setOn((s) => ({ ...s, [id]: !s[id] }))

  return (
    <div className="cc" onClick={onClose}>
      <div className="cc-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cc-grid">
          <div className="cc-block cc-net">
            {TOGGLES.map((t) => (
              <button key={t.id} className={`cc-tog ${on[t.id] ? 'on' : ''}`} onClick={() => flip(t.id)}>
                <span className="cc-ic">{t.icon}</span>
                <span className="cc-lb">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="cc-block cc-sliders">
            <label>
              ☀︎ 밝기
              <input type="range" min="0" max="100" value={bright} onChange={(e) => setBright(+e.target.value)} />
            </label>
            <label>
              🔊 소리
              <input type="range" min="0" max="100" value={vol} onChange={(e) => setVol(+e.target.value)} />
            </label>
          </div>
        </div>
        <div className="cc-row">
          {ROUND.map((i) => (
            <button key={i} className="cc-round">
              {i}
            </button>
          ))}
        </div>
        <button className="cc-handle" onClick={onClose} aria-label="제어 센터 닫기" />
      </div>
    </div>
  )
}
