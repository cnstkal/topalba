import { useEffect, useState } from 'react'

/* 제어센터·상태바·음악 앱이 공유하는 "기기 상태" (웹 시뮬레이터 내부 값일 뿐, 실제 기기 설정은 바꾸지 않음) */
// [제목, 아티스트, 색, 길이(초)]
export const SONGS = [
  ['저녁 산책', '가상 아티스트 A', '#ffd1dc', 198],
  ['퇴근길', '가상 아티스트 B', '#d1e8ff', 224],
  ['조용한 밤', '가상 아티스트 C', '#e6e0ff', 187],
  ['주말 오후', '가상 아티스트 D', '#fff4cc', 205],
  ['도시의 불빛', '가상 아티스트 E', '#d9f0f2', 232],
]
export const NETS = [['topalba-5G', true], ['Home_WiFi', true], ['Cafe_Free', false], ['Guest_2.4G', true]]
export const BT_DEVS = ['AirPods Pro', '자동차 오디오', '무선 키보드']
export const FOCUS = ['방해 금지', '수면', '업무', '개인 시간']
export const MIRROR = ['거실 TV', 'Apple TV', '회의실 디스플레이']

const KEY = 'device-sim-v1'
const SAVED = ['air', 'cell', 'wifi', 'bt', 'hotspot', 'airdrop', 'net', 'btDev', 'bright', 'vol', 'dark', 'low', 'rot', 'focus', 'focusLast', 'prevWifi', 'prevBt']
const DEF = {
  air: false, cell: true, wifi: true, bt: true, hotspot: false, airdrop: 1, net: 'topalba-5G', btDev: 'AirPods Pro',
  bright: 85, vol: 60, dark: false, low: false, rot: false, focus: null, focusLast: 0, prevWifi: true, prevBt: true,
  flash: false, rec: false, mirror: null,
}

let s = { ...DEF }
try {
  const r = JSON.parse(localStorage.getItem(KEY))
  if (r && typeof r === 'object') SAVED.forEach((k) => r[k] !== undefined && (s[k] = r[k]))
} catch (e) {
  /* 손상된 값은 기본값 사용 */
}
// 음악 재생 상태: pos(초) 기준점 + 시작 시각으로 계산해 화면 이동·재렌더링에도 오차가 없음
let song = { cur: null, play: false, base: 0, since: 0 }
const subs = new Set()
const emit = () => subs.forEach((f) => f())

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(SAVED.map((k) => [k, s[k]]))))
  } catch (e) {
    /* 저장 불가 환경은 무시 */
  }
}

export const dev = {
  get: () => s,
  set(patch) {
    s = { ...s, ...patch }
    save()
    emit()
  },
  toggleAir() {
    if (!s.air) dev.set({ air: true, prevWifi: s.wifi, prevBt: s.bt, cell: false, wifi: false, bt: false, hotspot: false })
    else dev.set({ air: false, cell: true, wifi: s.prevWifi, bt: s.prevBt })
  },
  /* 음악 */
  pos() {
    if (song.cur === null) return 0
    const p = song.base + (song.play ? (Date.now() - song.since) / 1000 : 0)
    return Math.min(p, SONGS[song.cur][3])
  },
  song: () => song,
  play(i) {
    song = { cur: i, play: true, base: 0, since: Date.now() }
    emit()
  },
  toggle() {
    if (song.cur === null) return dev.play(0)
    song = { ...song, base: dev.pos(), since: Date.now(), play: !song.play }
    emit()
  },
  next(d = 1) {
    const n = SONGS.length
    dev.play(song.cur === null ? 0 : (song.cur + d + n) % n)
  },
  seek(frac) {
    if (song.cur === null) return
    song = { ...song, base: frac * SONGS[song.cur][3], since: Date.now() }
    emit()
  },
}

/* 재생 중 곡 끝 처리 (앱이 열려 있지 않아도 다음 곡으로 넘어감) */
if (typeof window !== 'undefined') {
  if (window.__devMedia) clearInterval(window.__devMedia)
  window.__devMedia = setInterval(() => {
    if (song.play && song.cur !== null && dev.pos() >= SONGS[song.cur][3]) dev.next(1)
  }, 500)
}

export function useDevice() {
  const [, set] = useState(0)
  useEffect(() => {
    const f = () => set((n) => n + 1)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return { ...s, song }
}

/* 재생 진행바 등 화면 갱신용 틱 */
export function useTick(on, ms = 500) {
  const [, set] = useState(0)
  useEffect(() => {
    if (!on) return undefined
    const id = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(id)
  }, [on, ms])
}
