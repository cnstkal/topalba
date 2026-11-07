import { useState } from 'react'
import { useDevice } from '../engine/device'

/* 밝기·손전등 같은 "화면 전체에 걸치는" 시뮬레이션 효과 (실제 기기 밝기/손전등이 아님) */
export function DeviceFX() {
  const d = useDevice()
  return (
    <>
      <div className="cc-fx-bright" style={{ opacity: 0.62 * (1 - d.bright / 100) }} />
      {d.flash && <div className="cc-fx-flash" />}
    </>
  )
}

const fmt = (n) => (Number.isFinite(n) ? String(+n.toPrecision(9)) : '오류')
const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => (b === 0 ? NaN : a / b) }

export function Calculator({ onClose }) {
  const [d, setD] = useState('0')
  const [acc, setAcc] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)
  const num = Number(d)
  const press = (k) => {
    if (d === '오류' && k !== 'AC') return
    if (/\d|\./.test(k)) {
      if (fresh) {
        setD(k === '.' ? '0.' : k)
        setFresh(false)
      } else if (!(k === '.' && d.includes('.')) && d.replace(/[-.]/g, '').length < 9) setD(d === '0' && k !== '.' ? k : d + k)
    } else if (k === 'AC') {
      setD('0'); setAcc(null); setOp(null); setFresh(true)
    } else if (k === '±') setD(fmt(-num))
    else if (k === '%') setD(fmt(num / 100))
    else if (k === '=') {
      if (op !== null && acc !== null) {
        setD(fmt(OPS[op](acc, num)))
        setAcc(null); setOp(null); setFresh(true)
      }
    } else {
      const base = op !== null && acc !== null && !fresh ? OPS[op](acc, num) : num
      setD(fmt(base)); setAcc(base); setOp(k); setFresh(true)
    }
  }
  const rows = [['AC', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '.', '=']]
  return (
    <div className="cc-tool calc">
      <div className="cc-tool-top"><b>계산기</b><button onClick={onClose}>닫기</button></div>
      <div className={`cc-calc-d ${d.length > 7 ? 's' : ''}`}>{d}</div>
      <div className="cc-calc-g">
        {rows.flat().map((k) => (
          <button key={k} className={`k ${'÷×−+='.includes(k) ? 'op' : 'AC±%'.includes(k) && k.length ? 'fn' : ''} ${k === '0' ? 'z' : ''} ${op === k && fresh ? 'sel' : ''}`} onClick={() => press(k)}>
            {k === 'AC' && !(d !== '0' || acc !== null) ? 'AC' : k}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Camera({ onClose }) {
  const [n, setN] = useState(0)
  const [flash, setFlash] = useState(false)
  const shoot = () => {
    setN((v) => v + 1)
    setFlash(true)
    setTimeout(() => setFlash(false), 140)
  }
  return (
    <div className="cc-tool cam">
      <div className="cc-cam-view">
        <div className="cc-cam-grid" />
        <span className="cc-cam-tag">시뮬레이션 · 실제 카메라 아님</span>
        {flash && <div className="cc-cam-flash" />}
      </div>
      <div className="cc-cam-bar">
        <button onClick={onClose}>닫기</button>
        <button className="cc-shutter" onClick={shoot} aria-label="촬영"><i /></button>
        <span>{n ? `${n}장` : ''}</span>
      </div>
    </div>
  )
}
