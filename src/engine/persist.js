import { useEffect, useState } from 'react'

// 추가 앱 공용 저장 훅 (기존 store와 동일하게 localStorage 사용, 키만 분리)
export function usePersist(key, init) {
  const k = 'topalba.' + key
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(k)
      if (raw) return JSON.parse(raw)
    } catch {}
    return typeof init === 'function' ? init() : init
  })
  useEffect(() => {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }, [k, v])
  return [v, setV]
}
