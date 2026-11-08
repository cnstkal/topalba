import { useEffect, useRef, useState } from 'react'
import { dev, useDevice, useTick, SONGS, NETS, BT_DEVS, FOCUS, MIRROR } from '../engine/device'
import { Calculator, Camera } from './CCTools'

/* ───────── SF Symbols 스타일 아이콘 (선 기반, 둥근 끝) ───────── */
const F = { fill: 'currentColor', stroke: 'none' }
const sv = (c, s = 28) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{c}</svg>
)
const I = {
  air: (s) => sv(<path {...F} d="M21.5 14.800v-1.700L13.8 8.400V4.200a1.8 1.8 0 0 0-3.6 0v4.200L2.5 13.100v1.700l7.7-2.300v4.100l-2 1.500v1.500l3.8-.9 3.8.9v-1.500l-2-1.500v-4.100z" />, s),
  cell: (s) => sv(<g {...F}><rect x="3" y="14" width="3.5" height="6" rx="1" /><rect x="8.5" y="10" width="3.5" height="10" rx="1" /><rect x="14" y="6" width="3.5" height="14" rx="1" /><rect x="19.5" y="2.5" width="2" height="17.5" rx="1" opacity=".0" /></g>, s),
  wifi: (s) => sv(<><path d="M2.5 9.200a14 14 0 0 1 19 0M5.6 12.700a9.5 9.5 0 0 1 12.8 0M8.7 16.100a5 5 0 0 1 6.6 0" /><circle cx="12" cy="19.5" r="1.3" {...F} /></>, s),
  bt: (s) => sv(<path d="M6.5 7.500l11 9-5.5 4.500V3l5.5 4.5-11 9" />, s),
  airdrop: (s) => sv(<><circle cx="12" cy="13" r="2" {...F} /><path d="M8.3 16.700a5.3 5.3 0 1 1 7.4 0M5.3 19.700a9.5 9.5 0 1 1 13.4 0" /></>, s),
  link: (s) => sv(<path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />, s),
  flash: (s) => sv(<path d="M8 3h8v3.500l-2 2.500V21h-4V9L8 6.500zM8 6.500h8" />, s),
  timer: (s) => sv(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.500V9.500M9.5 3h5M18.5 6l1.2-1.2" /></>, s),
  calc: (s) => sv(<><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M8.5 7.500h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" strokeWidth="2.4" /></>, s),
  cam: (s) => sv(<><path d="M3.5 8.500h3.200l1.5-2.500h7.600l1.5 2.500h3.200V19h-17z" /><circle cx="12" cy="13.5" r="3.6" /></>, s),
  rec: (s) => sv(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.2" {...F} /></>, s),
  mirror: (s) => sv(<><path d="M9 18H5.500a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H15" /><path d="M12 13l-3.5 5.500h7z" {...F} /></>, s),
  moon: (s) => sv(<path {...F} d="M20.5 14.800A8.7 8.7 0 1 1 9.2 3.500a7.2 7.2 0 0 0 11.3 11.300z" />, s),
  batt: (s) => sv(<><rect x="2" y="7.5" width="17" height="9" rx="2.8" /><path d="M21.5 10.800v2.4" /><rect x="4.2" y="9.7" width="7" height="4.6" rx="1.2" {...F} /></>, s),
  dark: (s) => sv(<><circle cx="12" cy="12" r="8.5" /><path d="M12 3.500a8.5 8.5 0 0 1 0 17z" {...F} /></>, s),
  rot: (s) => sv(<><path d="M19.8 10a8 8 0 0 0-14.3-2.200M4.2 14a8 8 0 0 0 14.3 2.2" /><path d="M5.5 4v4h4M18.5 20v-4h-4" /><rect x="9.8" y="11" width="4.4" height="3.6" rx="1" /><path d="M10.7 11v-.9a1.3 1.3 0 0 1 2.6 0V11" /></>, s),
  sun: (s) => sv(<><circle cx="12" cy="12" r="3.8" {...F} /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.600L7 7M17 17l1.4 1.400M18.4 5.600L17 7M7 17l-1.4 1.4" /></>, s),
  vol: (s) => sv(<><path d="M4 9.500h3.500L12 5.500v13l-4.5-4H4z" {...F} /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.500a7.5 7.5 0 0 1 0 11" /></>, s),
  mute: (s) => sv(<><path d="M4 9.500h3.500L12 5.500v13l-4.5-4H4z" {...F} /><path d="M16 9.500l5 5M21 9.500l-5 5" /></>, s),
  play: (s) => sv(<path {...F} d="M7.5 4.800v14.400a.8.8 0 0 0 1.2.7l11.5-7.200a.8.8 0 0 0 0-1.400L8.7 4.100a.8.8 0 0 0-1.2.7z" />, s),
  pause: (s) => sv(<g {...F}><rect x="6" y="4.5" width="4" height="15" rx="1.2" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" /></g>, s),
  prev: (s) => sv(<g {...F}><path d="M19 5.500v13a.8.8 0 0 1-1.3.6L9 12.600a.8.8 0 0 1 0-1.200l8.7-6.500a.8.8 0 0 1 1.3.6z" /><rect x="5" y="5" width="2.6" height="14" rx="1.2" /></g>, s),
  next: (s) => sv(<g {...F}><path d="M5 5.500v13a.8.8 0 0 0 1.3.6L15 12.600a.8.8 0 0 0 0-1.200L6.3 4.900A.8.8 0 0 0 5 5.500z" /><rect x="16.4" y="5" width="2.6" height="14" rx="1.2" /></g>, s),
  note: (s) => sv(<path d="M9 18V6.500l10-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />, s),
  globe: (s) => sv(<><circle cx="12" cy="10" r="7"/><path d="M5 10h14M12 3c-3 3.500-3 10.500 0 14M12 3c3 3.500 3 10.500 0 14M12 21h0M7 21h10M12 17v4"/></>, s),
  airplay: (s) => sv(<><path d="M7.500 17.500a7 7 0 1 1 9 0M4.800 20.500a11 11 0 1 1 14.400 0"/><path d="M12 14.500l4 5.500H8z" {...F}/></>, s),
  heart: (s) => sv(<path {...F} d="M12 20.500C5 15.500 3 12 3 8.800A4.800 4.800 0 0 1 12 6.500a4.800 4.800 0 0 1 9 2.300c0 3.200-2 6.700-9 11.700z"/>, s),
  ant: (s) => sv(<><circle cx="12" cy="10" r="1.600" {...F}/><path d="M12 12v8M8.700 6.700a4.700 4.700 0 0 0 0 6.600M15.300 6.700a4.700 4.700 0 0 1 0 6.600M5.800 4a8.500 8.500 0 0 0 0 12M18.200 4a8.500 8.500 0 0 1 0 12"/></>, s),
  plus: (s) => sv(<path d="M12 5v14M5 12h14" strokeWidth="2.4"/>, s),
  power: (s) => sv(<path d="M12 3v8M7 6.500a7.500 7.500 0 1 0 10 0" strokeWidth="2.2"/>, s),
  wave: (s) => sv(<g {...F} stroke="none"><rect x="2" y="9" width="2" height="6" rx="1"/><rect x="6" y="6" width="2" height="12" rx="1"/><rect x="10" y="3" width="2" height="18" rx="1"/><rect x="14" y="6" width="2" height="12" rx="1"/><rect x="18" y="9" width="2" height="6" rx="1"/></g>, s),
  check: (s) => sv(<path d="M5 12.500l4.5 4.500L19 7" strokeWidth="2.4" />, s),
}

/* ───────── 공통 조각 ───────── */
/* 짧게 누르면 onTap, 길게 누르면 onLong (드래그하면 취소) */
function Press({ className, onTap, onLong, children, label }) {
  const t = useRef(0)
  const fired = useRef(false)
  const p = useRef([0, 0])
  const clear = () => clearTimeout(t.current)
  return (
    <button
      className={className}
      aria-label={label}
      onPointerDown={(e) => {
        fired.current = false
        p.current = [e.clientX, e.clientY]
        clear()
        if (onLong) t.current = setTimeout(() => { fired.current = true; onLong() }, 480)
      }}
      onPointerMove={(e) => Math.abs(e.clientX - p.current[0]) + Math.abs(e.clientY - p.current[1]) > 10 && clear()}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (fired.current) { fired.current = false; return }
        onTap && onTap()
      }}
    >
      {children}
    </button>
  )
}

/* 드래그로 값이 실시간으로 채워지는 슬라이더 (vertical: 세로형) */
function Slider({ value, onChange, icon, label, vertical, onEnd }) {
  const ref = useRef(null)
  const set = (e) => {
    const r = ref.current.getBoundingClientRect()
    const f = vertical ? (r.bottom - e.clientY) / r.height : (e.clientX - r.left) / r.width
    onChange(Math.round(Math.max(0, Math.min(1, f)) * 100))
  }
  return (
    <div
      className={`cc-sl ${vertical ? 'v' : 'h'}`}
      data-nodrag
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e) }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && set(e)}
      onPointerUp={() => onEnd && onEnd()}
    >
      <div className="fill" style={vertical ? { height: `${value}%` } : { width: `${value}%` }} />
      {icon && <span className="ic">{icon}</span>}
    </div>
  )
}

const Sw = ({ on, onClick }) => (
  <button className={`cc-sw ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={onClick}><i /></button>
)

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* ───────── 미디어 ───────── */
function Cover({ i, big }) {
  return (
    <div className={`cc-cover ${big ? 'big' : ''}`} style={{ background: i === null ? 'rgba(255,255,255,.12)' : SONGS[i][2] }}>
      <span>{I.note(big ? 64 : 22)}</span>
    </div>
  )
}

function MediaMini({ song, onOpen }) {
  useTick(song.play)
  const cur = song.cur
  const s = cur === null ? null : SONGS[cur]
  return (
    <div className="cc-t cc-media" onClick={onOpen}>
      <div className="cc-media-h">
        <Cover i={cur} />
        <span className="cc-c ap">{I.airplay(24)}</span>
      </div>
      <div className="cc-media-t">
        <b>{s ? s[0] : '재생 중인 음악 없음'}</b>
        <span>{s ? s[1] : '재생 버튼을 눌러 보세요'}</span>
      </div>
      <div className="cc-media-c" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => dev.next(-1)} aria-label="이전 곡">{I.prev(22)}</button>
        <button onClick={() => dev.toggle()} aria-label={song.play ? '일시정지' : '재생'}>{song.play ? I.pause(28) : I.play(28)}</button>
        <button onClick={() => dev.next(1)} aria-label="다음 곡">{I.next(22)}</button>
      </div>
    </div>
  )
}

function MediaBig({ d }) {
  const { song } = d
  useTick(song.play)
  const cur = song.cur
  const s = cur === null ? null : SONGS[cur]
  const pos = dev.pos()
  return (
    <div className="cc-mp">
      <Cover i={cur} big />
      <div className="cc-mp-t">
        <div><b>{s ? s[0] : '재생 중인 음악 없음'}</b>
        <span>{s ? s[1] : '음악을 재생해 보세요'}</span></div>
        <span className="cc-mp-w">{I.wave(22)}</span>
      </div>
      <div className="cc-mp-p">
        <Slider value={s ? Math.round((pos / s[3]) * 100) : 0} onChange={(v) => dev.seek(v / 100)} label="재생 위치" />
        <div className="cc-mp-time"><span>{mmss(pos)}</span><span>{s ? `-${mmss(s[3] - pos)}` : '-0:00'}</span></div>
      </div>
      <div className="cc-mp-c">
        <button onClick={() => dev.next(-1)} aria-label="이전 곡">{I.prev(30)}</button>
        <button className="pp" onClick={() => dev.toggle()} aria-label={song.play ? '일시정지' : '재생'}>{song.play ? I.pause(40) : I.play(40)}</button>
        <button onClick={() => dev.next(1)} aria-label="다음 곡">{I.next(30)}</button>
      </div>
      <div className="cc-mp-v">
        {I.mute(18)}
        <Slider value={d.vol} onChange={(v) => dev.set({ vol: v })} label="음량" />
        {I.vol(18)}
      </div>
      <button className="cc-ap-pill">{I.airplay(22)}AirPlay</button>
    </div>
  )
}

/* ───────── 상세 설정 패널 (길게 누르기) ───────── */
function Detail({ kind, d, onClose, say }) {
  const Row = ({ on, children, onClick, sub }) => (
    <button className="cc-li" onClick={onClick}>
      <span>{children}{sub && <small>{sub}</small>}</span>
      {on && <em>{I.check(20)}</em>}
    </button>
  )
  let title = ''
  let body = null
  if (kind === 'wifi') {
    title = 'Wi-Fi'
    body = (
      <>
        <div className="cc-li sw"><span>Wi-Fi</span><Sw on={d.wifi} onClick={() => dev.set({ wifi: !d.wifi })} /></div>
        {d.wifi ? NETS.map(([n, lock]) => (
          <Row key={n} on={d.net === n} sub={lock ? '보안 네트워크' : '개방형'} onClick={() => { dev.set({ net: n }); say(`Wi-Fi: ${n}`) }}>{n}</Row>
        )) : <p className="cc-none">Wi-Fi가 꺼져 있어요</p>}
        <p className="cc-fine">시뮬레이터 내부 상태만 바뀌며 실제 기기 Wi-Fi와는 관계없어요.</p>
      </>
    )
  } else if (kind === 'bt') {
    title = 'Bluetooth'
    body = (
      <>
        <div className="cc-li sw"><span>Bluetooth</span><Sw on={d.bt} onClick={() => dev.set({ bt: !d.bt })} /></div>
        {d.bt ? BT_DEVS.map((n) => (
          <Row key={n} on={d.btDev === n} sub={d.btDev === n ? '연결됨' : '연결 안 됨'} onClick={() => dev.set({ btDev: d.btDev === n ? null : n })}>{n}</Row>
        )) : <p className="cc-none">Bluetooth가 꺼져 있어요</p>}
      </>
    )
  } else if (kind === 'airdrop') {
    title = 'AirDrop'
    body = ['수신 끔', '연락처만', '모든 사람'].map((n, i) => <Row key={n} on={d.airdrop === i} onClick={() => dev.set({ airdrop: i })}>{n}</Row>)
  } else if (kind === 'focus') {
    title = '집중 모드'
    body = (
      <>
        {FOCUS.map((n, i) => <Row key={n} on={d.focus === i} onClick={() => dev.set({ focus: i, focusLast: i })}>{n}</Row>)}
        {d.focus !== null && <button className="cc-li off" onClick={() => dev.set({ focus: null })}>지금 끄기</button>}
      </>
    )
  } else if (kind === 'mirror') {
    title = '화면 미러링'
    body = (
      <>
        {MIRROR.map((n) => <Row key={n} on={d.mirror === n} sub={d.mirror === n ? '미러링 중 (시뮬레이션)' : ''} onClick={() => dev.set({ mirror: d.mirror === n ? null : n })}>{n}</Row>)}
      </>
    )
  }
  return (
    <div className="cc-dim2" data-nodrag onClick={onClose}>
      <div className="cc-detail" onClick={(e) => e.stopPropagation()}>
        <div className="cc-detail-h"><b>{title}</b><button onClick={onClose} aria-label="닫기">닫기</button></div>
        <div className="cc-detail-b">{body}</div>
      </div>
    </div>
  )
}

const T = ({ cls = '', on, onTap, onLong, label, children }) => (
  <Press className={`cc-t ${cls} ${on ? 'on' : ''}`} onTap={onTap} onLong={onLong} label={label}>{children}</Press>
)


/* ───────── 본체 ───────── */
function Panel({ closing, onClose, onOpenApp }) {
  const d = useDevice()
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState(null)
  const [tool, setTool] = useState(null)
  const [hint, setHint] = useState('')
  const drag = useRef(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!hint) return undefined
    const id = setTimeout(() => setHint(''), 1600)
    return () => clearTimeout(id)
  }, [hint])
  const say = () => {} // 탭 시 안내 문구(토스트) 표시 안 함

  /* 세로 스와이프 = 페이지 이동, 빈 곳을 탭 = 닫기 (슬라이더·패널은 data-nodrag) */
  const down = (e) => {
    moved.current = false
    drag.current = e.target.closest('[data-nodrag],.cc-tool') ? null : [e.clientX, e.clientY]
  }
  const up = (e) => {
    const s = drag.current
    drag.current = null
    if (!s) return
    const dx = e.clientX - s[0]
    const dy = e.clientY - s[1]
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
      moved.current = true
      setPage((p) => Math.max(0, Math.min(1, p + (dy < 0 ? 1 : -1))))
    } else if (Math.abs(dx) + Math.abs(dy) > 10) moved.current = true
    else if (e.target === e.currentTarget || e.target.classList.contains('cc-vp') || e.target.classList.contains('cc-page') || e.target.classList.contains('cc-pages') || e.target.classList.contains('cc-g')) onClose()
  }
  const closeZone = useRef(null)

  const tog = (key, msg) => dev.set({ [key]: !d[key] }) || say(msg(!d[key]))
  const airBlock = () => say('비행기 모드에서는 사용할 수 없어요')
  const net = d.wifi ? d.net : '끔'
  const wifiTap = () => { dev.set({ wifi: !d.wifi }); say(!d.wifi ? `Wi-Fi: ${d.net}` : 'Wi-Fi: 끔') }
  const btTap = () => { dev.set({ bt: !d.bt }); say(!d.bt ? `Bluetooth: ${d.btDev || '켬'}` : 'Bluetooth: 끔') }
  const cellTap = () => (d.air ? airBlock() : (dev.set({ cell: !d.cell }), say(!d.cell ? '셀룰러 데이터: 켬' : '셀룰러 데이터: 끔')))
  const airTap = () => { dev.toggleAir(); say(!d.air ? '비행기 모드: 켬' : '비행기 모드: 끔') }
  const hotTap = () => (d.air || !d.cell ? say('셀룰러 데이터가 켜져 있어야 해요') : (dev.set({ hotspot: !d.hotspot }), say(!d.hotspot ? '개인용 핫스팟: 켬' : '개인용 핫스팟: 끔')))
  const airdropTap = () => { const n = (d.airdrop + 1) % 3; dev.set({ airdrop: n }); say(`AirDrop: ${['수신 끔', '연락처만', '모든 사람'][n]}`) }
  const focusName = d.focus !== null ? FOCUS[d.focus] : '집중 모드'

  return (
    <div className={`cc ${closing ? 'closing' : ''}`} onPointerDown={down} onPointerUp={up} onPointerCancel={() => (drag.current = null)} onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); moved.current = false } }}>
      <div className={`cc-hint ${hint ? 'on' : ''}`}>{hint}</div>

      <div className="cc-vp">
        <div className="cc-pages" style={{ transform: `translateY(${-page * 100}%)` }}>
          {/* 1. 즐겨찾기 */}
          <section className="cc-page">
            <div className="cc-g">
              <div className="cc-t cc-conn">
                <Press className={`cc-c big ${d.air ? 'air' : ''}`} onTap={airTap} label="비행기 모드">{I.air(30)}</Press>
                <Press className={`cc-c big ${d.airdrop > 0 ? 'blue' : ''}`} onTap={airdropTap} onLong={() => setDetail('airdrop')} label="AirDrop">{I.airdrop(30)}</Press>
                <Press className={`cc-c big ${d.wifi ? 'blue' : ''}`} onTap={wifiTap} onLong={() => setDetail('wifi')} label="Wi-Fi">{I.wifi(32)}</Press>
                <div className="cc-mini">
                  <Press className={`cc-c ${d.cell ? 'cell' : ''}`} onTap={cellTap} label="셀룰러 데이터">{I.cell(18)}</Press>
                  <Press className={`cc-c ${d.bt ? 'wh' : ''}`} onTap={btTap} onLong={() => setDetail('bt')} label="Bluetooth">{I.bt(18)}</Press>
                  <Press className={`cc-c ${d.hotspot ? 'cell' : ''}`} onTap={hotTap} label="개인용 핫스팟">{I.link(18)}</Press>
                  <Press className={`cc-c ${d.vpn ? 'blue' : ''}`} onTap={() => { dev.set({ vpn: !d.vpn }); say(`VPN: ${!d.vpn ? '켬' : '끔'}`) }} label="VPN">{I.globe(18)}</Press>
                </div>
              </div>
              <MediaMini song={d.song} onOpen={() => setPage(1)} />
              <T cls="sq rotc" on={d.rot} onTap={() => tog('rot', (v) => `세로 방향 고정: ${v ? '켬' : '끔'}`)} label="회전 잠금">{I.rot(38)}</T>
              <T cls={`sq ${d.cell ? 'grn' : ''}`} on={d.cell} onTap={cellTap} label="셀룰러">{I.cell(38)}</T>
              <div className="cc-t cc-sltile">
                <Slider vertical value={100} onChange={() => undefined} icon={I.sun(30)} label="화면 밝기" />
              </div>
              <div className="cc-t cc-sltile vol">
                <Slider vertical value={d.vol} onChange={(v) => dev.set({ vol: v })} icon={d.vol === 0 ? I.mute(30) : I.vol(30)} label="음량" />
              </div>
              <T cls="wide" on={d.focus !== null} onTap={() => dev.set({ focus: d.focus === null ? d.focusLast : null })} onLong={() => setDetail('focus')} label="집중 모드">
                <span className="cc-c sm">{I.moon(26)}</span><span>{focusName}</span><em className="chev">⌃⌄</em>
              </T>
              <T cls="sq w" on={d.flash} onTap={() => tog('flash', (v) => `손전등: ${v ? '켬' : '끔'} (시뮬레이션)`)} label="손전등">{I.flash(32)}</T>
              <T cls="sq w" on={d.bt} onTap={btTap} label="Bluetooth">{I.bt(32)}</T>
              <T cls="sq yel" on={d.low} onTap={() => tog('low', (v) => `저전력 모드: ${v ? '켬' : '끔'}`)} label="저전력 모드">{I.batt(36)}</T>
              <T cls="sq" onTap={() => setTool('cam')} label="카메라">{I.cam(34)}</T>
              <T cls="sq red" on={d.rec} onTap={() => tog('rec', (v) => `화면 기록: ${v ? '시작 (시뮬레이션)' : '종료'}`)} label="화면 기록">{I.rec(34)}</T>
              <T cls="sq" onTap={() => setTool('calc')} label="계산기">{I.calc(34)}</T>
            </div>
          </section>

          {/* 2. 음악 */}
          <section className="cc-page"><MediaBig d={d} /></section>

        </div>
      </div>

      <div className="cc-dots" data-nodrag>{[I.heart, I.note].map((ic, i) => <button key={i} className={page === i ? 'on' : ''} onClick={() => setPage(i)} aria-label={`${i + 1}페이지`}>{ic(26)}</button>)}</div>

      <div
        className="cc-close"
        data-nodrag
        ref={closeZone}
        onPointerDown={(e) => { closeZone.current._y = e.clientY; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerUp={(e) => (closeZone.current._y - e.clientY > 24 || Math.abs(closeZone.current._y - e.clientY) < 8) && onClose()}
        role="button"
        aria-label="제어 센터 닫기"
      ><i /></div>

      {detail && <Detail kind={detail} d={d} onClose={() => setDetail(null)} say={say} />}
      {tool === 'calc' && <Calculator onClose={() => setTool(null)} />}
      {tool === 'cam' && <Camera onClose={() => setTool(null)} />}
    </div>
  )
}

export default function ControlCenter({ open, onClose, onOpenApp }) {
  const [mount, setMount] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) {
      setMount(true)
      setClosing(false)
      return undefined
    }
    if (!mount) return undefined
    setClosing(true)
    const id = setTimeout(() => { setMount(false); setClosing(false) }, 240)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  if (!mount) return null
  return <Panel closing={closing} onClose={onClose} onOpenApp={onOpenApp} />
}
