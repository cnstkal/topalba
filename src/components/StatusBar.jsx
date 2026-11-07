import { useEffect, useState } from 'react'
import { fmtStatus } from '../utils'

export default function StatusBar({ onOpenCC }) {
  const [t, setT] = useState(fmtStatus())
  useEffect(() => {
    const id = setInterval(() => setT(fmtStatus()), 5000)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      <div className="statusbar">
        <span className="sb-time">{t}</span>
        <span className="sb-right" onClick={onOpenCC}>
          {/* 셀룰러 */}
          <svg width="18" height="12" viewBox="0 0 18 12">
            <rect x="0" y="8" width="3" height="4" rx="1" />
            <rect x="5" y="5.500" width="3" height="6.500" rx="1" />
            <rect x="10" y="3" width="3" height="9" rx="1" />
            <rect x="15" y="0" width="3" height="12" rx="1" />
          </svg>
          {/* Wi-Fi */}
          <svg width="17" height="12" viewBox="0 0 17 12">
            <path d="M8.500 2.500c2.300 0 4.400.9 6 2.400l1.100-1.200C13.700 2 11.200.8 8.500.8S3.300 2 1.400 3.700l1.100 1.200c1.600-1.500 3.700-2.400 6-2.400z" />
            <path d="M8.500 6c1.400 0 2.600.5 3.600 1.400l1.100-1.200C11.900 5 10.300 4.300 8.500 4.300S5.100 5 3.800 6.200l1.100 1.200C5.900 6.500 7.100 6 8.500 6z" />
            <circle cx="8.500" cy="10" r="1.700" />
          </svg>
          {/* 배터리 */}
          <svg width="27" height="13" viewBox="0 0 27 13">
            <rect x=".5" y=".5" width="23" height="12" rx="3.800" fill="none" stroke="#000" opacity=".4" />
            <rect x="2" y="2" width="18" height="9" rx="2.500" />
            <path d="M25 4.500v4c.8-.3 1.500-1.200 1.500-2s-.7-1.700-1.500-2z" opacity=".45" />
          </svg>
        </span>
      </div>
      <div className="island" />
    </>
  )
}
