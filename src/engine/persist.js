import { useEffect, useState } from 'react'

// 저장된 값이 기대하는 모양(배열/객체/원시값)과 같은지 확인 — 손상된 저장 데이터가 화면을 멈추게 하지 않도록
export function shapeOk(v, init) {
  if (v === null || v === undefined) return false
  if (Array.isArray(init)) return Array.isArray(v)
  if (init && typeof init === 'object') return typeof v === 'object' && !Array.isArray(v)
  if (init === null || init === undefined) return true
  return typeof v === typeof init
}

// localStorage에서 안전하게 읽기: 파싱 실패·모양 불일치 시 기본값
export function readStored(key, init) {
  const fallback = typeof init === 'function' ? init() : init
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const v = JSON.parse(raw)
      if (shapeOk(v, fallback)) return v
    }
  } catch { /* 손상된 값은 기본값 사용 */ }
  return fallback
}

// 앱 공용 저장 훅 (localStorage, 키 접두사만 앱별로 분리)
export function usePersist(key, init, prefix = 'topalba.') {
  const k = prefix + key
  const [v, setV] = useState(() => readStored(k, init))
  useEffect(() => {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 저장 공간 부족 등은 무시 */ }
  }, [k, v])
  return [v, setV]
}
