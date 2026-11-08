// @ts-nocheck
/*
 * 지도 앱 전용 가상 데이터
 * - 실제 지도/지리정보/타일/API를 사용하지 않습니다.
 * - 모든 도로, 건물, 장소, 이름은 창작된 가상 데이터이며 실제 신림동과 무관합니다.
 * - 격자(lattice)를 비틀어 만든 도로망 위에 블록별 건물을 절차적으로 생성합니다.
 */

export const W = 1720
export const H = 1500
export const SCALE = 1.7 // 지도 1단위 = 가상 1.7m

/* ---------- 색상 ---------- */
const C = {
  ground: '#f4f0e6',
  pad: '#eee9dc',
  house: ['#e5dccb', '#e0d6c2', '#e9e0cf', '#dcd3c0'],
  apt: ['#d9d8d3', '#dedcd5', '#d2d2cf'],
  comm: ['#e7d8bd', '#dfcfb2', '#ebdfc8', '#e2d6c0'],
  office: ['#d6d7d6', '#dcdcda', '#cfd1d2'],
  park: '#cfe5bc',
  tree: '#b4d49e',
  path: '#f9f5e8',
  water: '#bfe1f0',
  waterEdge: '#a6cfe3',
  bank: '#d9ead0',
  main: '#dedad0',
  mainEdge: '#c8c3b5',
  norm: '#ffffff',
  normEdge: '#e2ddcf',
  alley: '#fbf9f2',
  alleyEdge: '#e8e3d6',
}

/* ---------- 난수 ---------- */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r1 = (n) => Math.round(n * 10) / 10

/* ---------- 도로 격자 ---------- */
const NI = 10 // 세로선(열) 정점 수
const NJ = 9 // 가로선(행) 정점 수
const SX = 172
const SY = 168

// 선 종류: M 간선, n 일반, a 골목, R 하천
const HCLS = ['n', 'M', 'a', 'n', 'M', 'a', 'n', 'R', 'n']
const VCLS = ['n', 'a', 'M', 'a', 'n', 'M', 'a', 'n', 'a', 'n']
export const HNAMES = ['달무리순환로', '별빛대로', '가온길', '서림거리', '신림중앙로', '소담길', '은하천로', '은하천', '남순환로']
export const VNAMES = ['서림순환로', '단풍길', '은하로', '마루길', '신림1길', '서림대로', '솔빛길', '신림2길', '소나무길', '동순환로']
const WID = { M: 26, n: 14, a: 7, R: 34 }
const MARGIN = { M: 19, n: 11.5, a: 7.5, R: 30 }

const V = []
for (let j = 0; j < NJ; j++) {
  V[j] = []
  for (let i = 0; i < NI; i++) {
    const rnd = rng(1000 + i * 31 + j * 7)
    let x = 62 + i * SX + (rnd() - 0.5) * 30
    let y = 60 + j * SY + (rnd() - 0.5) * 28
    x += 22 * Math.sin(y / 210) + 10 * Math.sin(y / 97)
    y += 18 * Math.sin(x / 260) + 8 * Math.cos(x / 120)
    V[j][i] = [x, y]
  }
}
const vt = (i, j) => V[j][i]
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

// 블록 (i,j): 꼭짓점 TL(i,j) TR(i+1,j) BR(i+1,j+1) BL(i,j+1)
function bil(i, j, u, v) {
  const A = vt(i, j), B = vt(i + 1, j), Cc = vt(i + 1, j + 1), D = vt(i, j + 1)
  return lerp(lerp(A, B, u), lerp(D, Cc, u), v)
}
function blockDims(i, j) {
  const A = vt(i, j), B = vt(i + 1, j), Cc = vt(i + 1, j + 1), D = vt(i, j + 1)
  return { w: (dist2(A, B) + dist2(D, Cc)) / 2, h: (dist2(A, D) + dist2(B, Cc)) / 2 }
}
const polyD = (pts) => 'M' + pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'Z'

/* ---------- 블록 종류 ---------- */
const BLOCK_NAMES = {}
const BT = {}
const setB = (i, j, t, name) => { BT[i + ',' + j] = t; if (name) BLOCK_NAMES[i + ',' + j] = name }
setB(4, 3, 'comm', '신림역 주변 상업지구'); setB(5, 3, 'comm'); setB(4, 4, 'comm'); setB(6, 4, 'comm')
setB(5, 4, 'plaza', '신림문화광장')
setB(3, 3, 'market', '별빛시장'); setB(3, 4, 'market')
setB(6, 3, 'office', '서림 업무지구')
setB(1, 1, 'park', '은하공원'); setB(7, 1, 'park', '달무리 소공원'); setB(2, 6, 'park', '느티나무 산책공원'); setB(6, 6, 'park', '은하천변 쉼터')
setB(2, 2, 'school', '서림초등학교(가상)')
setB(7, 4, 'parking', '공영주차장'); setB(3, 5, 'parking', '공영주차장')
setB(0, 3, 'house', '서림주택가'); setB(1, 3, 'house'); setB(0, 4, 'house'); setB(1, 4, 'house'); setB(0, 5, 'house'); setB(1, 5, 'house'); setB(2, 4, 'house'); setB(2, 5, 'house')
setB(7, 2, 'apt', '은하아파트 단지'); setB(8, 2, 'apt'); setB(7, 3, 'apt'); setB(8, 3, 'apt')
setB(7, 5, 'house', '솔빛마을'); setB(8, 5, 'house'); setB(7, 6, 'house'); setB(8, 6, 'house')
function typeOf(i, j) {
  const k = i + ',' + j
  if (BT[k]) return BT[k]
  const r = rng(77 + i * 13 + j * 29)()
  if (r < 0.46) return 'house'
  if (r < 0.66) return 'apt'
  if (r < 0.9) return 'comm'
  return 'office'
}

/* ---------- 블록 그리기 ---------- */
const layers = {
  pads: {}, // fill -> d
  bld: {}, // fill -> d
  inner: {}, // 아파트 내부
  trees: '',
  paths: '', // 산책로
  alleys: '', // 건물 사이 통로
  water: '',
  lines: '', // 얇은 선(주차선 등)
  tracks: '',
  fields: '',
}
const add = (obj, key, d) => { obj[key] = (obj[key] || '') + d }
const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length]

function quadAt(i, j, u0, v0, u1, v1, inset = 0, r) {
  // 비틀린 사각형. inset은 px 단위(대략)
  const d = blockDims(i, j)
  const iu = inset / d.w, iv = inset / d.h
  const a = bil(i, j, u0 + iu, v0 + iv), b = bil(i, j, u1 - iu, v0 + iv), c = bil(i, j, u1 - iu, v1 - iv), e = bil(i, j, u0 + iu, v1 - iv)
  return [a, b, c, e]
}
// L자형(모서리 일부를 잘라낸) 다각형 - 꼭짓점을 시계 방향으로 직접 구성
function lShape(i, j, u0, v0, u1, v1, r, inset = 0) {
  const d = blockDims(i, j)
  const iu = inset / d.w, iv = inset / d.h
  u0 += iu; u1 -= iu; v0 += iv; v1 -= iv
  const a = 0.32 + r() * 0.26, b = 0.32 + r() * 0.26
  const cuL = u0 + (u1 - u0) * a, cuR = u1 - (u1 - u0) * a
  const cvT = v0 + (v1 - v0) * b, cvB = v1 - (v1 - v0) * b
  const P = (u, v) => bil(i, j, u, v)
  const corner = Math.floor(r() * 4)
  const c = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
  const rep = [
    [P(u0, cvT), P(cuL, cvT), P(cuL, v0)],
    [P(cuR, v0), P(cuR, cvT), P(u1, cvT)],
    [P(u1, cvB), P(cuR, cvB), P(cuR, v1)],
    [P(cuL, v1), P(cuL, cvB), P(u0, cvB)],
  ]
  const out = []
  c.forEach((p, n) => { if (n === corner) out.push(...rep[n]); else out.push(p) })
  return out
}

function edgeMargins(i, j) {
  // [좌, 우, 상, 하] px
  return [MARGIN[VCLS[i]], MARGIN[VCLS[i + 1]], MARGIN[HCLS[j]], MARGIN[HCLS[j + 1]]]
}

function drawBlock(i, j) {
  const t = typeOf(i, j)
  const r = rng(5000 + i * 101 + j * 37)
  const d = blockDims(i, j)
  const [ml, mr, mt, mb] = edgeMargins(i, j)
  const u0 = ml / d.w, u1 = 1 - mr / d.w, v0 = mt / d.h, v1 = 1 - mb / d.h
  const padPts = [bil(i, j, u0, v0), bil(i, j, u1, v0), bil(i, j, u1, v1), bil(i, j, u0, v1)]
  const bw = (u1 - u0) * d.w, bh = (v1 - v0) * d.h
  const lu = (px) => px / d.w, lv = (px) => px / d.h
  const U = (f) => u0 + (u1 - u0) * f
  const Vv = (f) => v0 + (v1 - v0) * f

  if (t === 'park') {
    add(layers.pads, C.park, polyD(padPts))
    layers.pads['__parkstroke'] = (layers.pads['__parkstroke'] || '') + polyD(padPts)
    // 산책로
    const p = [0.08, 0.5, 0.92].map((f) => bil(i, j, U(f), Vv(0.18 + r() * 0.2)))
    const q = [0.1, 0.5, 0.9].map((f) => bil(i, j, U(0.15 + r() * 0.15 + f * 0.6), Vv(f)))
    layers.paths += `M${r1(p[0][0])} ${r1(p[0][1])}Q${r1(p[1][0])} ${r1(p[1][1] + 30)} ${r1(p[2][0])} ${r1(p[2][1] + 40)}`
    layers.paths += `M${r1(q[0][0])} ${r1(q[0][1])}Q${r1(q[1][0] - 40)} ${r1(q[1][1])} ${r1(q[2][0])} ${r1(q[2][1])}`
    // 연못
    if (r() < 0.6 || BLOCK_NAMES[i + ',' + j] === '은하공원') {
      const c = bil(i, j, U(0.65), Vv(0.62))
      const rx = 20 + r() * 14, ry = 12 + r() * 8
      layers.water += `M${r1(c[0] - rx)} ${r1(c[1])}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(rx * 2)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-rx * 2)} 0Z`
    }
    for (let n = 0; n < 16; n++) {
      const c = bil(i, j, U(0.06 + r() * 0.88), Vv(0.06 + r() * 0.88))
      const rr = 4 + r() * 4
      layers.trees += `M${r1(c[0] - rr)} ${r1(c[1])}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(rr * 2)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-rr * 2)} 0Z`
    }
    // 정자
    add(layers.bld, '#e4d9c4', polyD(quadAt(i, j, U(0.3), Vv(0.3), U(0.3) + lu(18), Vv(0.3) + lv(14), 0)))
    return
  }

  add(layers.pads, C.pad, polyD(padPts))

  if (t === 'plaza') {
    add(layers.pads, '#f8f4ea', polyD(quadAt(i, j, u0, v0, u1, v1, 3)))
    const c = bil(i, j, U(0.5), Vv(0.5))
    layers.water += `M${r1(c[0] - 22)} ${r1(c[1])}a22 22 0 1 0 44 0a22 22 0 1 0 -44 0Z`
    layers.lines += `M${r1(c[0] - 34)} ${r1(c[1])}a34 34 0 1 0 68 0a34 34 0 1 0 -68 0Z`
    ;[[0.12, 0.14], [0.88, 0.14], [0.12, 0.86], [0.88, 0.86], [0.5, 0.1], [0.5, 0.9]].forEach(([a, b]) => {
      const p = bil(i, j, U(a), Vv(b))
      layers.trees += `M${r1(p[0] - 6)} ${r1(p[1])}a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z`
    })
    add(layers.bld, '#e1d6bf', polyD(quadAt(i, j, U(0.06), Vv(0.4), U(0.06) + lu(20), Vv(0.4) + lv(36), 0)))
    add(layers.bld, '#e1d6bf', polyD(quadAt(i, j, U(0.94) - lu(20), Vv(0.45), U(0.94), Vv(0.45) + lv(30), 0)))
    return
  }

  if (t === 'parking') {
    add(layers.pads, '#e7e5df', polyD(quadAt(i, j, u0, v0, u1, v1, 3)))
    for (let n = 1; n < 9; n++) {
      const a = bil(i, j, U(0.08 + n * 0.1), Vv(0.1)), b = bil(i, j, U(0.08 + n * 0.1), Vv(0.46))
      const c = bil(i, j, U(0.08 + n * 0.1), Vv(0.56)), e = bil(i, j, U(0.08 + n * 0.1), Vv(0.92))
      layers.lines += `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}M${r1(c[0])} ${r1(c[1])}L${r1(e[0])} ${r1(e[1])}`
    }
    add(layers.bld, '#d6d5d0', polyD(quadAt(i, j, U(0.04), Vv(0.46), U(0.04) + lu(26), Vv(0.46) + lv(16), 0)))
    return
  }

  if (t === 'school') {
    // 본관(ㄷ자) + 운동장
    const m = (f0, g0, f1, g1) => quadAt(i, j, U(f0), Vv(g0), U(f1), Vv(g1), 0)
    add(layers.bld, '#d8d6cf', polyD(m(0.08, 0.08, 0.92, 0.26)))
    add(layers.bld, '#d8d6cf', polyD(m(0.08, 0.26, 0.24, 0.52)))
    add(layers.bld, '#d8d6cf', polyD(m(0.76, 0.26, 0.92, 0.52)))
    layers.fields += polyD(m(0.1, 0.58, 0.9, 0.93))
    const c = bil(i, j, U(0.5), Vv(0.755))
    layers.tracks += `M${r1(c[0] - 46)} ${r1(c[1])}a46 22 0 1 0 92 0a46 22 0 1 0 -92 0Z`
    return
  }

  if (t === 'market') {
    // 가는 점포 열 + 통로
    const cols = 5
    for (let c = 0; c < cols; c++) {
      const f0 = 0.04 + c * 0.19, f1 = f0 + 0.15
      for (let rw = 0; rw < 2; rw++) {
        const g0 = 0.06 + rw * 0.48, g1 = g0 + 0.4
        add(layers.bld, rw ? '#ecd9b8' : '#e5cfa8', polyD(quadAt(i, j, U(f0), Vv(g0), U(f1), Vv(g1), 0.8)))
      }
      const a = bil(i, j, U(f0 + 0.075), Vv(0.04)), b = bil(i, j, U(f0 + 0.075), Vv(0.96))
      layers.alleys += `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`
    }
    return
  }

  if (t === 'apt') {
    const n = 2 + Math.floor(r() * 3)
    const cuts = [0, ...Array.from({ length: n - 1 }, () => 0.28 + r() * 0.44).sort((x, y) => x - y), 1]
    const rowsplit = 0.38 + r() * 0.24
    for (let a = 0; a < cuts.length - 1; a++) {
      const f0 = U(cuts[a]), f1 = U(cuts[a + 1])
      const top = r() < 0.6
      const [g0, g1] = top ? [Vv(0.08), Vv(rowsplit - 0.04)] : [Vv(rowsplit + 0.06), Vv(0.92)]
      const [h0, h1] = top ? [Vv(rowsplit + 0.06), Vv(0.9)] : [Vv(0.1), Vv(rowsplit - 0.04)]
      const fill = pick(C.apt, r)
      if (r() < 0.5) add(layers.bld, fill, polyD(lShape(i, j, f0, g0, f1, g1, r, 9)))
      else add(layers.bld, fill, polyD(quadAt(i, j, f0, g0, f1, g1, 9)))
      if (r() < 0.85) {
        const q = quadAt(i, j, f0, h0, f1, h1, 11 + r() * 8)
        add(layers.bld, pick(C.apt, r), polyD(q))
        add(layers.inner, 'x', polyD(quadAt(i, j, f0, h0, f1, h1, 15 + r() * 8)))
      }
    }
    for (let n2 = 0; n2 < 6; n2++) {
      const p = bil(i, j, U(r()), Vv(rowsplit))
      layers.trees += `M${r1(p[0] - 4)} ${r1(p[1])}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z`
    }
    return
  }

  if (t === 'office') {
    const big = lShape(i, j, U(0.06), Vv(0.06), U(0.62), Vv(0.9), r, 4)
    add(layers.bld, pick(C.office, r), polyD(big))
    add(layers.inner, 'x', polyD(quadAt(i, j, U(0.14), Vv(0.2), U(0.5), Vv(0.74), 6)))
    add(layers.bld, pick(C.office, r), polyD(quadAt(i, j, U(0.68), Vv(0.06), U(0.94), Vv(0.46), 3)))
    add(layers.bld, pick(C.comm, r), polyD(quadAt(i, j, U(0.68), Vv(0.54), U(0.94), Vv(0.9), 3)))
    return
  }

  // house / comm
  const isC = t === 'comm'
  const palette = isC ? C.comm : C.house
  const rows = isC ? 2 : bh > 130 ? 3 : 2
  const split = [0]
  for (let q = 1; q < rows; q++) split.push(q / rows + (r() - 0.5) * 0.1)
  split.push(1)
  for (let rw = 0; rw < rows; rw++) {
    const g0 = Vv(split[rw]) + lv(rw ? 3 : 0), g1 = Vv(split[rw + 1]) - lv(rw < rows - 1 ? 3 : 0)
    if (rw > 0) {
      const a = bil(i, j, u0, Vv(split[rw])), b = bil(i, j, u1, Vv(split[rw]))
      layers.alleys += `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`
    }
    let pos = 0
    while (pos < 0.97) {
      const wpx = isC ? 30 + r() * 46 : 20 + r() * 30
      let f1 = Math.min(1, pos + wpx / bw)
      if (1 - f1 < 0.12) f1 = 1
      if (r() > (isC ? 0.97 : 0.9)) { pos = f1; continue }
      const f0 = U(pos), ff = U(f1)
      const fill = pick(palette, r)
      const ins = 1 + r() * 2.2
      if (r() < (isC ? 0.2 : 0.3)) add(layers.bld, fill, polyD(lShape(i, j, f0, g0, ff, g1, r, ins)))
      else add(layers.bld, fill, polyD(quadAt(i, j, f0, g0, ff, g1, ins)))
      pos = f1
    }
  }
}

/* ---------- 도로 그리기 ---------- */
const roadPaths = { a: '', n: '', M: '' }
const crossPaths = { M: '', n: '' }
const centerDash = { M: '' }
const arrows = []
let riverD = ''
const ONEWAY = {} // 'h:j:i' or 'v:i:j' -> 1(증가방향) / -1(감소방향)

const EDGES = [] // {a:[i,j], b:[i,j], cls, ow, name}
function polylineD(pts) {
  return 'M' + pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L')
}
for (let j = 0; j < NJ; j++) {
  const pts = []
  for (let i = 0; i < NI; i++) pts.push(vt(i, j))
  const cls = HCLS[j]
  if (cls === 'R') riverD = polylineD(pts)
  else roadPaths[cls] += polylineD(pts)
  if (cls === 'M') centerDash.M += polylineD(pts)
  for (let i = 0; i < NI - 1; i++) {
    if (cls === 'R') continue
    let ow = 0
    if (cls === 'n' && j % 3 !== 0 && rng(900 + i * 7 + j * 19)() < 0.28) ow = rng(300 + i * 5 + j)() < 0.5 ? 1 : -1
    EDGES.push({ a: [i, j], b: [i + 1, j], cls, ow, name: HNAMES[j] })
  }
}
for (let i = 0; i < NI; i++) {
  const pts = []
  for (let j = 0; j < NJ; j++) pts.push(vt(i, j))
  const cls = VCLS[i]
  roadPaths[cls] += polylineD(pts)
  if (cls === 'M') centerDash.M += polylineD(pts)
  for (let j = 0; j < NJ - 1; j++) {
    // 골목은 하천을 건너지 않음
    if (cls === 'a' && (j === 6 || j === 7)) continue
    let ow = 0
    if (cls === 'n' && i % 3 !== 0 && rng(1900 + i * 7 + j * 19)() < 0.28) ow = rng(700 + i * 5 + j)() < 0.5 ? 1 : -1
    EDGES.push({ a: [i, j], b: [i, j + 1], cls, ow, name: VNAMES[i] })
  }
}
// 골목 선: 하천을 가로지르는 부분 제거 위해 재구성
roadPaths.a = ''
for (let j = 0; j < NJ; j++) if (HCLS[j] === 'a') { const pts = []; for (let i = 0; i < NI; i++) pts.push(vt(i, j)); roadPaths.a += polylineD(pts) }
for (let i = 0; i < NI; i++) if (VCLS[i] === 'a') {
  const p1 = [], p2 = []
  for (let j = 0; j <= 6; j++) p1.push(vt(i, j))
  for (let j = 7; j < NJ; j++) p2.push(vt(i, j))
  roadPaths.a += polylineD(p1) + polylineD(p2)
}

// 횡단보도 + 일방통행 화살표
EDGES.forEach((e) => {
  const A = vt(e.a[0], e.a[1]), B = vt(e.b[0], e.b[1])
  const len = dist2(A, B)
  const ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len
  const nx = -uy, ny = ux
  if (e.cls === 'M' || e.cls === 'n') {
    const w = WID[e.cls]
    ;[0, 1].forEach((end) => {
      const base = end === 0 ? A : B
      const dir = end === 0 ? 1 : -1
      const off = w / 2 + 7
      for (let s = -2; s <= 2; s++) {
        const cx = base[0] + ux * dir * off + nx * s * (w / 5.5)
        const cy = base[1] + uy * dir * off + ny * s * (w / 5.5)
        const hx = ux * dir * 2.6, hy = uy * dir * 2.6
        crossPaths[e.cls] += `M${r1(cx - hx)} ${r1(cy - hy)}L${r1(cx + hx)} ${r1(cy + hy)}`
      }
    })
  }
  if (e.ow) {
    const m = lerp(A, B, 0.5)
    const dir = e.ow
    const dx = ux * dir, dy = uy * dir
    arrows.push(`M${r1(m[0] - dx * 5 - dy * 3.5)} ${r1(m[1] - dy * 5 + dx * 3.5)}L${r1(m[0] + dx * 5)} ${r1(m[1] + dy * 5)}L${r1(m[0] - dx * 5 + dy * 3.5)} ${r1(m[1] - dy * 5 - dx * 3.5)}`)
  }
})

/* ---------- 블록 생성 ---------- */
for (let j = 0; j < NJ - 1; j++) for (let i = 0; i < NI - 1; i++) drawBlock(i, j)

/* ---------- 하천 + 다리 ---------- */
const riverBank = riverD

/* ---------- 정적 SVG 문자열 ---------- */
function buildSvg() {
  let s = ''
  s += `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="${C.ground}"/>`
  // 하천 둑 + 물
  s += `<path d="${riverBank}" fill="none" stroke="${C.bank}" stroke-width="62" stroke-linecap="butt" stroke-linejoin="round"/>`
  s += `<path d="${riverD}" fill="none" stroke="${C.waterEdge}" stroke-width="37" stroke-linejoin="round"/>`
  s += `<path d="${riverD}" fill="none" stroke="${C.water}" stroke-width="32" stroke-linejoin="round"/>`
  // 블록 바닥
  Object.entries(layers.pads).forEach(([fill, d]) => {
    if (fill === '__parkstroke') return
    if (fill === C.park) s += `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="10" stroke-linejoin="round"/>`
    else s += `<path d="${d}" fill="${fill}"/>`
  })
  s += `<path d="${layers.fields}" fill="#d3e6c0"/>`
  s += `<path d="${layers.tracks}" fill="none" stroke="#e8cfae" stroke-width="3"/>`
  // 산책로 / 연못
  s += `<path d="${layers.paths}" fill="none" stroke="#e5decb" stroke-width="5.6" stroke-linecap="round"/>`
  s += `<path d="${layers.paths}" fill="none" stroke="${C.path}" stroke-width="3.6" stroke-linecap="round"/>`
  s += `<path d="${layers.water}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="1.4"/>`
  s += `<path d="${layers.trees}" fill="${C.tree}"/>`
  s += `<path d="${layers.lines}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`
  // 건물
  s += '<g stroke="#bfb6a0" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round">'
  Object.entries(layers.bld).forEach(([fill, d]) => { s += `<path d="${d}" fill="${fill}"/>` })
  s += '</g>'
  s += `<path d="${layers.inner['x'] || ''}" fill="#ecebe6" stroke="#c5c3bb" stroke-opacity=".6" stroke-width=".5"/>`
  // 건물 사이 통로
  s += `<path d="${layers.alleys}" fill="none" stroke="#faf7ee" stroke-width="2.6" stroke-linecap="round"/>`
  // 도로: 외곽선 → 채움
  const cas = (cls, w, col) => `<path d="${roadPaths[cls]}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  s += cas('a', WID.a + 2, C.alleyEdge) + cas('n', WID.n + 3, C.normEdge) + cas('M', WID.M + 3.5, C.mainEdge)
  s += cas('a', WID.a, C.alley) + cas('n', WID.n, C.norm) + cas('M', WID.M, C.main)
  s += `<path d="${centerDash.M}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.4" stroke-dasharray="9 7"/>`
  // 횡단보도 / 일방통행
  s += `<path d="${crossPaths.M}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="butt"/>`
  s += `<path d="${crossPaths.n}" fill="none" stroke="#d7d2c3" stroke-width="2" stroke-linecap="butt"/>`
  s += `<path d="${arrows.join('')}" fill="none" stroke="#a8a396" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
  return s
}
export const MAP_SVG = buildSvg()
export const ONEWAY_COUNT = arrows.length

/* ---------- 라벨 ---------- */
export const ROAD_LABELS = []
HNAMES.forEach((n, j) => {
  if (HCLS[j] === 'R') return
  const i = j % 2 ? 6 : 2
  const A = vt(i, j), B = vt(i + 1, j)
  const m = lerp(A, B, 0.5)
  let ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI
  ROAD_LABELS.push({ t: n, x: m[0], y: m[1], a: ang, cls: HCLS[j] })
})
VNAMES.forEach((n, i) => {
  const j = i % 2 ? 5 : 2
  const A = vt(i, j), B = vt(i, j + 1)
  const m = lerp(A, B, 0.5)
  let ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI
  if (ang > 90) ang -= 180
  if (ang < -90) ang += 180
  ROAD_LABELS.push({ t: n, x: m[0], y: m[1], a: ang, cls: VCLS[i] })
})
{
  const m = lerp(vt(3, 7), vt(4, 7), 0.5)
  ROAD_LABELS.push({ t: '은하천', x: m[0], y: m[1], a: (Math.atan2(vt(4, 7)[1] - vt(3, 7)[1], vt(4, 7)[0] - vt(3, 7)[0]) * 180) / Math.PI, cls: 'R' })
}
export const AREA_LABELS = Object.entries(BLOCK_NAMES).map(([k, t]) => {
  const [i, j] = k.split(',').map(Number)
  const c = bil(i, j, 0.5, 0.5)
  const kind = BT[k]
  return { t, x: c[0], y: c[1], kind: kind === 'park' ? 'park' : kind === 'house' || kind === 'apt' ? 'res' : 'area' }
})

// 도로 검색용
export const ROADS = []
HNAMES.forEach((n, j) => { if (HCLS[j] !== 'R') ROADS.push({ name: n, cls: HCLS[j], at: lerp(vt(3, j), vt(5, j), 0.5) }) })
VNAMES.forEach((n, i) => ROADS.push({ name: n, cls: VCLS[i], at: lerp(vt(i, 2), vt(i, 5), 0.5) }))

/* ---------- 카테고리 ---------- */
export const CATS = [
  { k: 'food', l: '음식점', i: 'utensils', c: '#ee6a3c' },
  { k: 'cafe', l: '카페', i: 'coffee', c: '#c08340' },
  { k: 'conv', l: '편의점', i: 'store', c: '#2fa57a' },
  { k: 'shop', l: '쇼핑', i: 'bag', c: '#5b7cfa' },
  { k: 'hospital', l: '병원', i: 'cross', c: '#e5484d' },
  { k: 'pharmacy', l: '약국', i: 'pill', c: '#e0609a' },
  { k: 'park', l: '공원', i: 'tree', c: '#46a257' },
  { k: 'sight', l: '관광명소', i: 'landmark', c: '#a15fd6' },
  { k: 'lodging', l: '숙소', i: 'bed', c: '#7468e8' },
  { k: 'transit', l: '교통', i: 'bus', c: '#2f80ed' },
]
export const catMeta = (k) => CATS.find((c) => c.k === k) || CATS[0]

/* ---------- 장소(전부 창작) ---------- */
// [이름, 카테고리, 블록i, 블록j, u, v, 소개]
const RAW = [
  ['서림손칼국수', 'food', 4, 3, 0.3, 0.4, '손으로 밀어 만든 면과 멸치 육수가 특징인 가상의 칼국수집입니다.'],
  ['별빛시장 순대국', 'food', 3, 3, 0.5, 0.5, '시장 골목 안쪽에 자리한 가상의 국밥집입니다.'],
  ['달무리 돈가스', 'food', 4, 4, 0.7, 0.3, '두툼한 수제 돈가스를 내는 상상 속 경양식집입니다.'],
  ['은하수 냉면집', 'food', 5, 3, 0.6, 0.7, '살얼음 육수의 물냉면으로 이름난 가상의 노포입니다.'],
  ['골목식당 오늘', 'food', 2, 4, 0.4, 0.5, '주택가 골목에서 매일 메뉴가 바뀌는 가상의 백반집입니다.'],
  ['화덕피자 모노', 'food', 6, 4, 0.3, 0.6, '장작 화덕에서 굽는 얇은 도우의 피자를 선보이는 가상의 가게입니다.'],
  ['느티나무 한상', 'food', 1, 5, 0.5, 0.4, '제철 나물과 찌개로 차린 한 상 차림, 가상의 한식당입니다.'],
  ['마당집 보쌈', 'food', 7, 5, 0.5, 0.5, '넓은 마당이 있는 상상 속 보쌈 전문점입니다.'],
  ['카페 온기', 'cafe', 4, 3, 0.7, 0.7, '창가 좌석이 넓은 가상의 동네 카페입니다.'],
  ['소소한 로스터리', 'cafe', 5, 3, 0.2, 0.3, '작은 로스팅 기계가 놓인 가상의 스페셜티 카페입니다.'],
  ['창가 책다방', 'cafe', 3, 4, 0.4, 0.4, '책을 읽으며 오래 머물 수 있는 상상 속 북카페입니다.'],
  ['나무그늘 커피', 'cafe', 6, 5, 0.3, 0.3, '공원 옆 테라스가 있는 가상의 카페입니다.'],
  ['소담 베이커리', 'cafe', 4, 4, 0.2, 0.8, '아침마다 빵 굽는 냄새가 나는 가상의 제과점입니다.'],
  ['은하 라운지', 'cafe', 7, 3, 0.4, 0.6, '저녁에도 열려 있는 상상 속 디저트 라운지입니다.'],
  ['바로편의점 신림중앙점', 'conv', 4, 4, 0.9, 0.6, '24시간 운영하는 것으로 설정된 가상의 편의점입니다.'],
  ['서림 편의점', 'conv', 2, 3, 0.5, 0.5, '주택가 입구에 있는 가상의 작은 편의점입니다.'],
  ['별빛 마트24', 'conv', 3, 3, 0.2, 0.8, '시장 입구 쪽의 가상 편의점입니다.'],
  ['은하 편의점', 'conv', 7, 4, 0.3, 0.2, '주차장 옆 상상 속 편의점입니다.'],
  ['샛길 편의점', 'conv', 1, 4, 0.6, 0.6, '골목 모퉁이에 자리한 가상의 편의점입니다.'],
  ['신림 가상몰', 'shop', 6, 3, 0.5, 0.5, '여러 매장이 모인 창작 속 복합 쇼핑 공간입니다.'],
  ['별빛시장 포목점', 'shop', 3, 3, 0.7, 0.3, '고운 천과 소품을 파는 가상의 시장 점포입니다.'],
  ['서림 생활잡화', 'shop', 5, 3, 0.8, 0.8, '생활용품을 모아 둔 상상 속 잡화점입니다.'],
  ['한결 서점', 'shop', 4, 3, 0.5, 0.9, '작은 독립서점으로 설정된 가상의 책방입니다.'],
  ['동네 옷가게 결', 'shop', 2, 4, 0.8, 0.3, '직접 고른 옷을 걸어 둔 가상의 의류 매장입니다.'],
  ['꽃집 하루', 'shop', 6, 4, 0.7, 0.3, '계절 꽃을 파는 상상 속 꽃집입니다.'],
  ['서림 내과의원', 'hospital', 5, 2, 0.5, 0.5, '가상의 내과 의원입니다. 실제 의료기관이 아닙니다.'],
  ['은하 치과', 'hospital', 4, 2, 0.3, 0.4, '가상의 치과입니다. 실제 의료기관이 아닙니다.'],
  ['새봄 소아과', 'hospital', 3, 2, 0.6, 0.6, '가상의 소아과입니다. 실제 의료기관이 아닙니다.'],
  ['신림 정형외과', 'hospital', 6, 2, 0.4, 0.5, '가상의 정형외과입니다. 실제 의료기관이 아닙니다.'],
  ['온누리 약국', 'pharmacy', 5, 2, 0.8, 0.3, '가상의 약국입니다. 실제 약국이 아닙니다.'],
  ['서림 약국', 'pharmacy', 3, 2, 0.2, 0.7, '가상의 약국입니다. 실제 약국이 아닙니다.'],
  ['은하 건강약국', 'pharmacy', 6, 5, 0.7, 0.7, '가상의 약국입니다. 실제 약국이 아닙니다.'],
  ['은하공원', 'park', 1, 1, 0.5, 0.55, '연못과 산책로가 이어지는 가상의 근린공원입니다.'],
  ['달무리 소공원', 'park', 7, 1, 0.5, 0.5, '벤치와 작은 정자가 있는 상상 속 소공원입니다.'],
  ['느티나무 산책공원', 'park', 2, 6, 0.5, 0.5, '오래된 느티나무 길이 이어지는 가상의 산책 공원입니다.'],
  ['은하천변 쉼터', 'park', 6, 6, 0.5, 0.5, '하천을 따라 걷기 좋은 상상 속 쉼터입니다.'],
  ['신림문화광장', 'sight', 5, 4, 0.5, 0.5, '분수와 야외 무대가 있는 가상의 광장입니다.'],
  ['서림 문화창작소', 'sight', 4, 5, 0.5, 0.5, '전시와 공방이 모인 상상 속 문화 공간입니다.'],
  ['별빛시장', 'sight', 3, 4, 0.5, 0.5, '좁은 통로를 따라 점포가 이어진 가상의 전통시장입니다.'],
  ['은하천 전망대', 'sight', 4, 6, 0.5, 0.92, '하천과 도심이 한눈에 보이는 가상의 전망 공간입니다.'],
  ['서림 작은미술관', 'sight', 5, 5, 0.4, 0.5, '소규모 기획전을 여는 상상 속 미술관입니다.'],
  ['호텔 서림', 'lodging', 6, 3, 0.8, 0.8, '역 가까이에 있는 것으로 설정된 가상의 호텔입니다.'],
  ['은하 게스트하우스', 'lodging', 2, 5, 0.5, 0.5, '주택가 속 아늑한 가상의 게스트하우스입니다.'],
  ['달빛 스테이', 'lodging', 4, 5, 0.2, 0.2, '한옥 분위기로 꾸민 상상 속 숙소입니다.'],
  ['신림 레지던스', 'lodging', 6, 4, 0.6, 0.8, '장기 투숙용으로 설정된 가상의 레지던스입니다.'],
  ['서림 정류장', 'transit', 4, 4, 1.0, 0.1, '가상의 버스 정류장입니다.'],
  ['은하공원 정류장', 'transit', 1, 1, 0.5, 1.0, '가상의 버스 정류장입니다.'],
  ['서림초교 정류장', 'transit', 2, 2, 1.0, 0.5, '가상의 버스 정류장입니다.'],
  ['별빛시장 정류장', 'transit', 3, 3, 0.0, 0.5, '가상의 버스 정류장입니다.'],
  ['은하천 정류장', 'transit', 5, 6, 0.5, 1.0, '가상의 버스 정류장입니다.'],
  ['솔빛마을 정류장', 'transit', 7, 5, 0.0, 0.5, '가상의 버스 정류장입니다.'],
  ['아파트단지 앞 정류장', 'transit', 7, 3, 0.5, 0.0, '가상의 버스 정류장입니다.'],
]

function roadFor(i, j, u, v) {
  // 블록 경계 중 가장 가까운 도로 이름
  const cand = [
    [u, VNAMES[i]], [1 - u, VNAMES[i + 1]], [v, HNAMES[j]], [1 - v, HNAMES[j + 1]],
  ].filter((c) => !(c[1] === '은하천'))
  cand.sort((a, b) => a[0] - b[0])
  return cand[0][1]
}

export const PLACES = RAW.map(([name, cat, i, j, u, v, desc], n) => {
  const [x, y] = bil(i, j, u, v)
  const road = roadFor(i, j, u, v)
  const num = 3 + Math.floor(rng(40 + n * 7)() * 70)
  return { id: 'p' + (n + 1), name, cat, x, y, road, addr: `가상 신림동 ${road} ${num}`, desc, hours: cat === 'park' || cat === 'transit' || cat === 'sight' ? '상시 개방 (가상 설정)' : '09:00 – 21:00 (가상 설정)' }
})
// 성화의 저장 장소 (모두 가상 지도 내 창작 장소)
{
  const base = PLACES.find((p) => p.id === 'p37') || PLACES[0]
  PLACES.push(
    { id: 'p101', name: '초콜릿모텔', cat: 'stay', x: base.x + 42, y: base.y + 28, road: base.road, addr: '가상 신림동 달무리순환로 38', desc: '탑알바 근처에서 가끔 머무는 숙소. 즐겨찾기에 저장된 장소입니다.', hours: '24시간 (가상 설정)' },
    { id: 'p102', name: '케이큐엔터테인먼트', cat: 'shop', x: base.x - 56, y: base.y + 72, road: base.road, addr: '가상 신림동 별빛대로 112', desc: '김홍중이 소속된 가상의 엔터테인먼트 사옥입니다.', hours: '평일 10:00 – 18:00 (가상 설정)' },
    { id: 'p103', name: 'SY오피스텔', cat: 'lodging', x: base.x + 88, y: base.y - 64, road: base.road, addr: '가상 신림동 소담길 21', desc: '자주 오가는 주거 건물. 즐겨찾기에 저장된 장소입니다.', hours: '상시 (가상 설정)' },
  )
}
// 지하철역은 교차로에 배치
{
  const [x, y] = vt(5, 4)
  PLACES.push({ id: 'p100', name: '신림역', cat: 'transit', x: x - 26, y: y - 24, road: '신림중앙로', addr: '가상 신림동 신림중앙로 1', desc: '서림대로와 신림중앙로가 만나는 곳에 설정한 가상의 지하철역입니다.', hours: '상시 개방 (가상 설정)' })
}
export const placeById = (id) => PLACES.find((p) => p.id === id)

export const ME = (() => { const a = vt(4, 4), b = vt(5, 4); const m = lerp(a, b, 0.55); return { x: m[0], y: m[1] } })()
export const HOME_VIEW = { x: ME.x, y: ME.y, k: 1.15 }

export const RECOMMEND = ['p37', 'p33', 'p39', 'p9', 'p42', 'p13', 'p41'].map((id) => id)

/* ---------- 가상 길찾기 ---------- */
const keyOf = (p) => p[0] + ',' + p[1]
const proj = (p, A, B) => {
  const dx = B[0] - A[0], dy = B[1] - A[1]
  const l2 = dx * dx + dy * dy || 1
  let t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const q = [A[0] + dx * t, A[1] + dy * t]
  return { t, q, d: dist2(p, q) }
}
const allowed = (e, mode) => {
  if (mode === 'driving') return e.cls !== 'a'
  if (mode === 'transit') return e.cls !== 'a'
  return true
}
const factor = (e, mode) => {
  if (mode === 'driving') return e.cls === 'M' ? 0.7 : 1
  if (mode === 'transit') return e.cls === 'M' ? 0.6 : 1.1
  if (mode === 'cycling') return e.cls === 'M' ? 1.35 : e.cls === 'a' ? 1.05 : 1
  return e.cls === 'a' ? 0.95 : e.cls === 'M' ? 1.15 : 1
}

function splitEdge(edges, idx, pt, name) {
  const e = edges[idx]
  const A = e.pa, B = e.pb
  const s = { ...e, a: e.a, b: name, pa: A, pb: pt }
  const t = { ...e, a: name, b: e.b, pa: pt, pb: B }
  edges.splice(idx, 1, s, t)
}
function nearestEdge(edges, p, mode) {
  let best = -1, bd = 1e9, bq = null
  edges.forEach((e, idx) => {
    if (!allowed(e, mode)) return
    const r = proj(p, e.pa, e.pb)
    if (r.d < bd) { bd = r.d; best = idx; bq = r.q }
  })
  return { idx: best, q: bq, d: bd }
}
function dijkstra(edges, from, to, mode, ignoreOW) {
  const adj = new Map()
  const push = (a, b, e) => {
    if (!adj.has(a)) adj.set(a, [])
    adj.get(a).push({ to: b, e, p: e.pa, q: e.pb })
  }
  edges.forEach((e) => {
    if (!allowed(e, mode)) return
    const ow = mode === 'driving' && !ignoreOW ? e.ow : 0
    if (ow === 0 || ow === 1) push(keyOf2(e.a), keyOf2(e.b), e)
    if (ow === 0 || ow === -1) push(keyOf2(e.b), keyOf2(e.a), { ...e, pa: e.pb, pb: e.pa })
  })
  const distM = new Map([[from, 0]]), prev = new Map(), done = new Set()
  const pq = [[0, from]]
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0])
    const [d, u] = pq.shift()
    if (done.has(u)) continue
    done.add(u)
    if (u === to) break
    ;(adj.get(u) || []).forEach((n) => {
      const w = dist2(n.p, n.q) * factor(n.e, mode)
      const nd = d + w
      if (nd < (distM.get(n.to) ?? 1e12)) { distM.set(n.to, nd); prev.set(n.to, { from: u, seg: [n.p, n.q] }); pq.push([nd, n.to]) }
    })
  }
  if (!done.has(to)) return null
  const pts = []
  let cur = to
  while (cur !== from) {
    const pr = prev.get(cur)
    pts.push(pr.seg[1], pr.seg[0])
    cur = pr.from
  }
  pts.reverse()
  const out = []
  pts.forEach((p) => { const l = out[out.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) out.push(p) })
  return out
}
const keyOf2 = (k) => (Array.isArray(k) ? keyOf(k) : k)

const SPEED = { walking: 1.25, cycling: 4.2, driving: 8.2, transit: 6.2 }
export function findRoute(p1, p2, mode) {
  const base = EDGES.map((e) => ({ ...e, a: keyOf(e.a), b: keyOf(e.b), pa: vt(e.a[0], e.a[1]), pb: vt(e.b[0], e.b[1]) }))
  const build = (m, ignoreOW) => {
    const edges = base.map((e) => ({ ...e }))
    const s = nearestEdge(edges, [p1.x, p1.y], m)
    const sq = s.q
    splitEdge(edges, s.idx, sq, 'S')
    const t = nearestEdge(edges, [p2.x, p2.y], m)
    const tq = t.q
    splitEdge(edges, t.idx, tq, 'T')
    const line = dijkstra(edges, 'S', 'T', m, ignoreOW)
    return line && { line, sq, tq, sd: s.d, td: t.d }
  }
  let res = build(mode, false) || build(mode, true) || build('walking', true)
  if (!res) return null
  const pts = [[p1.x, p1.y], res.sq, ...res.line.slice(1, -1), res.tq, [p2.x, p2.y]]
  let len = 0
  for (let n = 1; n < pts.length; n++) len += dist2(pts[n - 1], pts[n])
  const meters = Math.max(30, Math.round((len * SCALE) / 10) * 10)
  let sec = meters / SPEED[mode]
  if (mode === 'transit') sec += 300
  if (mode === 'driving') sec += 45
  return { pts, meters, sec }
}
