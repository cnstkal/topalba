import { useEffect, useState } from 'react'
import { fmtStatus } from '../utils'
import { useDevice, SONGS, COVER_PAL } from '../engine/device'

// 앨범 커버 색에서 밝기가 충분한 색만 골라 막대 색 순환에 사용
const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 }
const coverColors = (i) => {
  const c = [...COVER_PAL[i % COVER_PAL.length], SONGS[i][2]].filter((x) => lum(x) > 0.3)
  return [c[0] || '#fa233b', c[1] || c[0] || '#5bc0be', c[2] || c[0] || '#ffd166']
}

export default function StatusBar({ onOpenCC, onLock }) {
  const d = useDevice()
  const [t, setT] = useState(fmtStatus())
  useEffect(() => {
    const id = setInterval(() => setT(fmtStatus()), 5000)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      <div className="statusbar">
        <span className={`sb-time ${d.rec ? 'rec' : ''}`} onClick={onLock}>
          {t}
          {d.focus !== null && (
            <svg className="sb-moon" width="12" height="12" viewBox="0 0 24 24"><path d="M20.5 14.8A8.7 8.7 0 1 1 9.2 3.500a7.2 7.2 0 0 0 11.3 11.300z" /></svg>
          )}
        </span>
        <span className="sb-right" onClick={onOpenCC}>
          {/* 셀룰러 */}
          {d.air && (
            <svg width="15" height="14" viewBox="0 0 24 24"><path d="M21.5 14.800v-1.700L13.8 8.400V4.200a1.8 1.8 0 0 0-3.6 0v4.200L2.5 13.100v1.700l7.7-2.300v4.100l-2 1.500v1.500l3.8-.9 3.8.9v-1.500l-2-1.500v-4.100z" /></svg>
          )}
          {d.cell && (
          <svg width="18" height="12" viewBox="0 0 18 12">
            <rect x="0" y="8" width="3" height="4" rx="1" />
            <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
            <rect x="10" y="3" width="3" height="9" rx="1" />
            <rect x="15" y="0" width="3" height="12" rx="1" />
          </svg>
          )}
          {/* Wi-Fi */}
          {d.wifi && (
          <svg width="17" height="12" viewBox="0 0 17 12">
            <path d="M8.5 2.500c2.3 0 4.4.9 6 2.400l1.1-1.200C13.7 2 11.2.8 8.5.8S3.3 2 1.4 3.700l1.1 1.200c1.6-1.5 3.7-2.4 6-2.400z" />
            <path d="M8.5 6c1.4 0 2.6.5 3.6 1.400l1.1-1.200C11.9 5 10.3 4.3 8.5 4.300S5.1 5 3.8 6.200l1.1 1.200C5.9 6.5 7.1 6 8.5 6z" />
            <circle cx="8.5" cy="10" r="1.7" />
          </svg>
          )}
          {/* 배터리 */}
          <svg className={d.low ? 'low' : ''} width="27" height="13" viewBox="0 0 27 13">
            <rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="#000" opacity=".4" />
            <rect x="2" y="2" width="18" height="9" rx="2.5" />
            <path d="M25 4.500v4c.8-.3 1.5-1.2 1.5-2s-.7-1.7-1.5-2z" opacity=".45" />
          </svg>
        </span>
      </div>
      {(() => {
        const sg = d.song
        const on = sg && sg.cur != null && sg.play && SONGS[sg.cur]
        const [c1, c2, c3] = on ? coverColors(sg.cur) : []
        return (
          <div className={`island${on ? ' on' : ''}`} style={on ? { '--c1': c1, '--c2': c2, '--c3': c3 } : undefined}>
            {on && (
              <div className="isl-in">
                <i className="isl-art" />
                <span className="isl-bars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} style={{ animationDuration: `${0.5 + ((i * 7) % 5) * 0.13}s, 4.5s`, animationDelay: `${-i * 0.21}s, ${-i * 0.55}s` }} />
                  ))}
                </span>
              </div>
            )}
          </div>
        )
      })()}
    </>
  )
}
