import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META, CHARACTERS, CONTACTS, ME } from '../data/characters'
import { Avatar } from '../components/Overlays'
import './Messages.css'

// iMessage 스타일 메시지 앱 (단일 파일). 섹션: 시드 대화 → 저장/모델 → 아이콘 → 연락처 → 대화방 → 새 메시지 → 메시지 앱

// ───────────── seed.js ─────────────
// 기존 대화 "앞에" 붙는 과거 대화 기록. 기존 메시지는 건드리지 않습니다.
// 형식: [누가('m'=나, 'o'=상대), 텍스트, 며칠 전, 'HH:MM', 추가속성]
// 날짜는 기존 대화의 첫 메시지(없으면 현재 시각)를 기준으로 계산되므로 시간 흐름이 어긋나지 않습니다.

const img = (ph, g) => ({ type: 'image', ph, g })
const st = (s) => ({ type: 'sticker', st: s })
const link = (t, s) => ({ type: 'link', link: { t, s } })

const SEEDS = {
  // 김홍중: 아이돌. 바쁘고 지쳐 있지만 다정. 짧게 끊어 보내고 답이 늦다. ㅋㅋ/ㅠㅠ 많이 씀.
  'msg:bro': [
    ['m', '이번 주에 집 와?', 16, '19:10'],
    ['o', '아직 몰라', 16, '21:42'],
  ],
  'msg:mom': [
    ['o', '밥은 먹었어?', 3, '18:20'],
    ['m', '응 먹었어', 3, '18:46'],
    ['o', '그래 늦지 않게 들어와', 3, '18:47'],
  ],
  'msg:dad': [
    ['o', '차 키 어디 뒀니', 12, '08:10'],
    ['m', '현관 서랍에 있어', 12, '08:32'],
  ],
  'msg:ads': [
    ['o', '[광고] 이번 주 멤버십 쿠폰 안내', 1, '10:02'],
    ['o', '수신 설정은 고객센터에서 변경할 수 있습니다.', 1, '10:02'],
  ],
  'msg:regular': [
    ['o', '오늘도 늦게까지 계세요?', 8, '22:14'],
    ['m', '네 마감까지 있어요', 8, '22:20'],
  ],
  'msg:hj': [
    ['o', '야 나 오늘 컴백 준비 끝났다', 9, '21:12'],
    ['o', '살려줘', 9, '21:12'],
    ['m', 'ㅋㅋㅋ 고생했네', 9, '21:40'],
    ['m', '밥은 먹었어?', 9, '21:41'],
    ['o', 'ㅇㅇ 편의점 삼각김밥', 9, '23:58'],
    ['o', 'ㅠㅠ', 9, '23:58'],
    ['m', '자라 이 시간에 안 자면 어떡해', 8, '09:05'],
    ['o', '방금 일어남', 8, '14:30'],
    ['o', '', 8, '14:30', st('😴')],
    ['m', 'ㅋㅋㅋㅋ 아이돌 라이프', 8, '14:31'],
    ['o', '이거 봤냐 우리 티저', 7, '18:20', link('티저 영상 | 공식 채널', 'video.example.com')],
    ['o', '미쳤음', 7, '18:21'],
    ['m', '봤어 ㅋㅋㅋ 멋있더라 진짜', 7, '18:35'],
    ['o', '진짜?? 어디가', 7, '18:36'],
    ['m', '표정이 좋았어', 7, '18:36'],
    ['o', 'ㅎㅎ 고맙다', 7, '18:50'],
    ['o', '자냐', 6, '02:14'],
    ['m', '이제 일어났다 왜', 6, '08:40'],
    ['m', '무슨 일 있었어?', 6, '08:41'],
    ['o', '아냐 걍 불안해서', 6, '11:03'],
    ['o', '쇼케이스 앞두고 있으니까 좀 그렇다', 6, '11:03'],
    ['m', '너 잘할 거야', 6, '11:10'],
    ['m', '리허설 때도 잘했다며', 6, '11:10'],
    ['o', 'ㅇㅇ 그러긴 했음', 6, '11:25'],
    ['o', '', 5, '15:00', img('🎤', ['#ff9a8b', '#ff6a88'])],
    ['o', '연습실 거울샷', 5, '15:00'],
    ['m', '얼굴 좋은데 ㅋㅋ', 5, '15:12'],
    ['m', '야 알바 끝났다 너 바빠?', 3, '20:45'],
    ['o', '미안 이제 봄 ㅠㅠ 스케줄 있었음', 3, '23:10'],
    ['o', '나중에 밥 먹자', 3, '23:11'],
    ['m', 'ㅇㅋ 시간 되면 말해', 3, '23:30'],
    ['o', '', 2, '12:00', st('🫶')],
    ['o', '쇼케이스 끝!!!', 1, '19:05'],
    ['o', '아 진짜 떨려 죽는 줄', 1, '19:05'],
    ['m', '수고했어 진짜', 1, '19:20'],
    ['m', '오늘은 푹 자라', 1, '19:21'],
    ['o', 'ㅇㅇ 고맙다 성화야', 1, '19:40'],
  ],

  // 정윤호: 극도로 짧고 건조. 마침표로 끝내고 이모티콘 거의 없음. 은근히 챙김.
  'msg:yh': [
    ['m', '윤호야 내일 시간 돼?', 10, '13:02'],
    ['o', '왜.', 10, '15:47'],
    ['m', '밥이나 먹자고', 10, '15:48'],
    ['o', '몇 시', 10, '16:20'],
    ['m', '7시?', 10, '16:20'],
    ['o', 'ㅇㅇ', 10, '16:31'],
    ['o', '도착', 9, '18:55'],
    ['o', '어디냐', 9, '18:55'],
    ['m', '2분 뒤', 9, '18:56'],
    ['o', '늦어.', 9, '18:56'],
    ['o', '잘 들어가', 9, '23:20'],
    ['m', '너도', 9, '23:21'],
    ['m', '내 충전기 너한테 있지', 7, '09:10'],
    ['o', '있음', 7, '12:44'],
    ['o', '가져감', 7, '12:44'],
    ['m', 'ㅇㅋ', 7, '12:45'],
    ['o', '이 노래 들어봐', 6, '22:30', link('새벽에 듣는 플레이리스트', 'music.example.com')],
    ['o', '그냥.', 6, '22:31'],
    ['m', '좋은데?', 6, '22:50'],
    ['o', '알아.', 6, '22:51'],
    ['o', '', 4, '08:01', img('☕', ['#c9a27e', '#7b5a3c'])],
    ['o', '여기 커피 괜찮음', 4, '08:01'],
    ['m', '어딘데 ㅋㅋ', 4, '08:30'],
    ['o', '나중에 데려감', 4, '11:15'],
    ['m', '야 나 오늘 알바 진짜 죽을 뻔', 3, '17:00'],
    ['o', '왜', 3, '17:02'],
    ['m', '진상 손님 만나서 멘탈 나갔어', 3, '17:03'],
    ['o', '고생.', 3, '17:20'],
    ['o', '끝나고 연락해', 3, '17:20'],
    ['m', '이제 끝', 3, '23:45'],
    ['o', '치킨 사줄까', 3, '23:46'],
    ['m', 'ㅋㅋㅋㅋ 미쳤냐 이 시간에', 3, '23:46'],
    ['o', '농담 아님', 3, '23:50'],
    ['o', '주말에 뭐 함', 1, '14:00'],
    ['m', '아직 몰라', 1, '14:15'],
    ['o', '비워둬.', 1, '14:16'],
  ],

  // 서나은: 알바 동료. 이모지·느낌표 많은 밝은 존댓말, 부탁이 많고 호들갑.
  'msg:nae': [
    ['o', '성화씨 안녕하세요~! 이번 주 시프트표 나왔어요 ✨', 12, '10:02'],
    ['o', '', 12, '10:02', img('📅', ['#a8e6cf', '#56c596'])],
    ['m', '확인했어요 감사해요!', 12, '10:30'],
    ['o', '넵넵 ㅎㅎ', 12, '10:31'],
    ['o', '혹시 토요일 마감 대신 서주실 수 있어요? ㅠㅠ', 11, '22:10'],
    ['o', '제가 갑자기 집에 일이 생겨서...', 11, '22:10'],
    ['o', '부탁드려요 진짜 😭😭', 11, '22:11'],
    ['m', '토요일이면 괜찮을 것 같아요', 11, '22:40'],
    ['o', '헐 진짜요??', 11, '22:41'],
    ['o', '감사해요 감사해요 감사해요!!!', 11, '22:41'],
    ['o', '', 11, '22:41', st('🙏')],
    ['o', '다음 주에 제가 커피 쏠게요 ☕️', 10, '09:15'],
    ['m', '안 그러셔도 되는데요', 10, '09:30'],
    ['o', '아니에요~ 받으세요 ㅎㅎ', 10, '09:31'],
    ['o', '오늘 손님 많았죠.. 저 발 아파 죽겠어요 ㅠㅠ', 8, '19:00'],
    ['m', '오늘 진짜 정신없었어요', 8, '19:02'],
    ['o', '맞아요 ㅋㅋㅋ', 8, '19:02'],
    ['o', '성화씨 아니었으면 큰일 날 뻔했어요!!', 8, '19:03'],
    ['o', '여기 점심 어때요? 리뷰 좋대요', 6, '13:20', link('수제 돈가스 맛집 | 지도', '지도 링크')],
    ['o', '같이 가실래요?', 6, '13:21'],
    ['m', '오 좋아요 이따 끝나고요?', 6, '13:50'],
    ['o', '넵!! 7시쯤요 ㅎㅎ', 6, '13:51'],
    ['o', '', 6, '21:30', img('🍱', ['#ffd89b', '#f6a04d'])],
    ['o', '돈가스 대성공 🥹', 6, '21:30'],
    ['m', '맛있어 보여요 ㅋㅋ', 6, '21:45'],
    ['o', '성화씨 늦는다고 사장님께 말씀드렸어요', 4, '08:50'],
    ['o', '천천히 오세요~', 4, '08:51'],
    ['m', '감사해요 5분이면 가요', 4, '08:52'],
    ['o', '내일 사장님 기분 안 좋으실 수도 있어요..ㅎㅎ 조심!', 2, '20:10'],
    ['m', '헉 무슨 일 있었어요?', 2, '20:12'],
    ['o', '재고 때문에 ㅠㅠ 내일 얘기해 줄게요', 2, '20:30'],
    ['o', '오늘도 파이팅이에요 💪', 1, '11:00'],
    ['m', '나은씨도 파이팅!', 1, '11:20'],
    ['o', '', 1, '11:21', st('😆')],
  ],

  // 사장님: 점잖은 존댓말. 마침표 정확, 가끔 띄어쓰기 틀림, 용건 위주.
  'msg:boss': [
    ['o', '성화 군, 이번 주 근무 시간표 확인하세요.', 14, '08:30'],
    ['m', '네 사장님 확인했습니다.', 14, '08:45'],
    ['o', '그래요. 수고하세요.', 14, '08:46'],
    ['o', '내일 오전에 물건 들어오니까 30분 일찍 나올 수 있어요?', 12, '18:02'],
    ['m', '네 가능합니다.', 12, '18:30'],
    ['o', '고마워요.', 12, '18:31'],
    ['o', '어제 마감 정리 잘 돼 있더군요. 수고했어요^^', 11, '09:10'],
    ['m', '감사합니다 사장님.', 11, '09:15'],
    ['o', '성화 군 혹시 자나요', 9, '22:40'],
    ['o', '내일 아침에 말해도 되는데 급한건 아니고', 9, '22:41'],
    ['o', '금고 열쇠 어디 뒀는지 기억나요?', 9, '22:41'],
    ['m', '카운터 서랍 두 번째 칸에 넣어뒀습니다.', 9, '22:50'],
    ['o', '아 맞다 거기 있네요. 미안해요 늦은 시간에.', 9, '22:55'],
    ['o', '이번 달 매출 정리한 거 공유해요.', 7, '13:00', link('월간 매출 현황', '문서 공유')],
    ['o', '참고만 하세요.', 7, '13:01'],
    ['m', '확인했습니다.', 7, '13:20'],
    ['o', '', 6, '17:45', img('📦', ['#d7c4a3', '#a88b5e'])],
    ['o', '이 물건 어디다 둬야 하나요', 6, '17:45'],
    ['m', '창고 왼쪽 선반에 두시면 됩니다.', 6, '17:50'],
    ['o', '알겠어요.', 6, '17:51'],
    ['o', '오늘 눈 많이 온다니까 조심해서 오세요.', 4, '07:55'],
    ['m', '네 감사합니다. 일찍 출발하겠습니다.', 4, '08:00'],
    ['o', '성화 군 이번 달 월급일은 25일이에요. 알고 있죠?', 3, '21:00'],
    ['m', '네 알고 있습니다.', 3, '21:15'],
    ['o', '', 3, '21:16', st('👍')],
    ['o', '오늘 점심은 먹었어요? 안 먹었으면 김밥이라도 먹고 일해요.', 2, '12:00'],
    ['m', '방금 먹었습니다. 챙겨주셔서 감사합니다.', 2, '12:10'],
    ['o', '그래요.', 2, '12:11'],
    ['o', '창고 정리는 천천히 해도 됩니다.', 2, '15:30'],
    ['m', '네 알겠습니다.', 2, '15:40'],
    ['o', '내일 쉬어도 돼요. 요즘 고생 많았으니까.', 1, '18:30'],
    ['m', '정말요? 감사합니다 사장님!', 1, '18:31'],
    ['o', '그래요. 푹 쉬어요.', 1, '18:32'],
  ],
}

// 반환: 메시지 배열 (ts는 ms)
function seedFor(tid, anchorMs) {
  const rows = SEEDS[tid]
  if (!rows) return []
  const base = new Date(anchorMs)
  base.setHours(0, 0, 0, 0)
  return rows.map(([who, text, d, hm, x], i) => {
    const [h, mi] = hm.split(':').map(Number)
    const t = new Date(base.getTime() - d * 864e5)
    t.setHours(h, mi, 0, 0)
    return { from: who === 'm' ? ME : tid.slice(4), text, ts: t.getTime(), key: `s:${tid}:${i}`, type: 'text', unread: false, ...x }
  })
}

// ───────────── model.js ─────────────

// ───────── 저장 ─────────
// 기존 게임 상태(state.threads)는 읽기만 하고, 메시지 앱이 새로 만드는 값
// (보낸 메시지, 고정, 반응, 삭제, 읽음, 알림 설정)은 이 키 하나에 모아 저장합니다.
const KEY = 'imessage-ui-v2'
const DKEY = 'imessage-drafts-v1'
const empty = () => ({ sent: {}, deleted: {}, reactions: {}, pinned: {}, readUpTo: {}, forcedUnread: {}, muted: {}, cutoff: {}, meta: {}, readSent: {} })

const load = () => {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return empty()
  }
}

function useOverlay() {
  const [ov, setOv] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ov))
    } catch {
      /* 용량 초과 시 메모리에서만 유지 */
    }
  }, [ov])
  return [ov, setOv]
}

// 입력 중인 내용 유지
let drafts = (() => {
  try {
    return JSON.parse(localStorage.getItem(DKEY) || '{}')
  } catch {
    return {}
  }
})()
const getDraft = (id) => drafts[id] || ''
const setDraft = (id, v) => {
  if (v) drafts[id] = v
  else delete drafts[id]
  try {
    localStorage.setItem(DKEY, JSON.stringify(drafts))
  } catch {
    /* noop */
  }
}

function useApi(setOv) {
  const up = useCallback((fn) => setOv((o) => fn(o)), [setOv])
  return {
    send: (tid, msg, meta) =>
      up((o) => ({ ...o, meta: meta ? { ...o.meta, [tid]: meta } : o.meta, sent: { ...o.sent, [tid]: [...(o.sent[tid] || []), msg] } })),
    react: (key, name) => up((o) => ({ ...o, reactions: { ...o.reactions, [key]: o.reactions[key] === name ? '' : name } })),
    del: (key) => up((o) => ({ ...o, deleted: { ...o.deleted, [key]: 1 } })),
    pin: (tid) => up((o) => { const p = { ...o.pinned }; p[tid] ? delete p[tid] : (p[tid] = 1); return { ...o, pinned: p } }),
    mute: (tid) => up((o) => { const p = { ...o.muted }; p[tid] ? delete p[tid] : (p[tid] = 1); return { ...o, muted: p } }),
    markRead: (tid, ts) =>
      up((o) => {
        if ((o.readUpTo[tid] || 0) >= ts && !o.forcedUnread[tid]) return o
        const f = { ...o.forcedUnread }
        delete f[tid]
        return { ...o, readUpTo: { ...o.readUpTo, [tid]: Math.max(o.readUpTo[tid] || 0, ts) }, forcedUnread: f }
      }),
    markUnread: (tid) => up((o) => ({ ...o, forcedUnread: { ...o.forcedUnread, [tid]: 1 } })),
    removeThread: (tid, ts) => up((o) => {
      const p = { ...o.pinned }
      delete p[tid]
      return { ...o, cutoff: { ...o.cutoff, [tid]: ts }, pinned: p }
    }),
    sentRead: (key) => up((o) => (o.readSent[key] ? o : { ...o, readSent: { ...o.readSent, [key]: Date.now() } })),
  }
}

// ───────── 메시지 병합 ─────────
const ms = (t) => (t < 1e11 ? t * 1000 : t)

function buildThread(tid, base, ov) {
  const b = (base || []).map((m, i) => ({ ...m, ts: ms(m.ts), key: `b:${tid}:${m.id ?? i}`, type: m.type || 'text' }))
  const first = b.length ? Math.min(...b.map((m) => m.ts)) : Date.now()
  const cut = ov.cutoff[tid] || 0
  return [...seedFor(tid, first), ...b, ...(ov.sent[tid] || [])].filter((m) => !ov.deleted[m.key] && m.ts > cut).sort((x, y) => x.ts - y.ts)
}

function threadIds(ov) {
  const ids = Object.keys(THREAD_META).filter((id) => THREAD_META[id].app === 'messages')
  Object.keys(ov.meta).forEach((id) => !ids.includes(id) && ids.push(id))
  return ids
}

const metaOf = (tid, ov) => THREAD_META[tid] || ov.meta[tid] || { title: '?', members: [tid.slice(4)] }

function unreadCount(tid, msgs, ov) {
  const upTo = ov.readUpTo[tid] || 0
  return msgs.filter((m) => m.from !== ME && m.unread && m.ts > upTo).length
}

function mkMsg(msgs, extra) {
  const last = msgs.length ? msgs[msgs.length - 1].ts : 0
  const ts = Math.max(Date.now(), last + 1000)
  return { from: ME, ts, key: `o:${ts}:${Math.random().toString(36).slice(2, 6)}`, type: 'text', unread: false, text: '', ...extra }
}

const previewOf = (m) => (!m ? '' : m.type === 'image' ? '사진' : m.type === 'sticker' ? `스티커 ${m.st}` : m.text)

// ───────── 시간 표시 ─────────
const WD = ['일', '월', '화', '수', '목', '금', '토']
const hm = (ts) => {
  const d = new Date(ts)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}
const dayKey = (ts) => {
  const d = new Date(ts)
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}
const dayDiff = (ts) => {
  const a = new Date(ts); a.setHours(0, 0, 0, 0)
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 864e5)
}
function fmtList(ts) {
  const n = dayDiff(ts)
  const d = new Date(ts)
  if (n <= 0) return hm(ts)
  if (n === 1) return '어제'
  if (n < 7) return `${WD[d.getDay()]}요일`
  return `${String(d.getFullYear()).slice(2)}. ${d.getMonth() + 1}. ${d.getDate()}.`
}
function fmtDivider(ts) {
  const n = dayDiff(ts)
  const d = new Date(ts)
  const day = n <= 0 ? '오늘' : n === 1 ? '어제' : n < 7 ? `${WD[d.getDay()]}요일` : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  return [day, hm(ts)]
}

// ───────── 콘텐츠 ─────────
const TAPBACKS = [
  ['heart', '❤️'],
  ['like', '👍'],
  ['dislike', '👎'],
  ['haha', '😂'],
  ['excl', '‼️'],
  ['ques', '❓'],
]
const tapEmoji = (n) => (TAPBACKS.find((t) => t[0] === n) || [])[1]
const STICKERS = ['😂', '🥹', '😍', '🫶', '👍', '🙏', '😴', '🔥', '😭', '🤔', '🎉', '💪', '😆', '😎', '🥲', '❤️']
const SAMPLE_PHOTOS = [
  { ph: '🌅', g: ['#ff9a8b', '#ff6a88'] },
  { ph: '🌊', g: ['#74ebd5', '#4a8fe7'] },
  { ph: '🌿', g: ['#a8e6cf', '#56c596'] },
  { ph: '🍜', g: ['#ffd89b', '#f6a04d'] },
  { ph: '🐶', g: ['#e6dcc8', '#b59a73'] },
  { ph: '🌃', g: ['#667eea', '#764ba2'] },
]

const nameOf = (id) => CHARACTERS[id]?.name || '?'

const hasUrl = (t) => /https?:\/\/\S+/i.exec(t)
function linkOf(t) {
  const m = hasUrl(t)
  if (!m) return null
  let host = m[0]
  try {
    host = new URL(m[0]).hostname.replace(/^www\./, '')
  } catch {
    /* noop */
  }
  return { t: host, s: m[0] }
}

function shrinkImage(file, max = 640) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onerror = rej
    r.onload = () => {
      const im = new Image()
      im.onerror = rej
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height))
        const c = document.createElement('canvas')
        c.width = Math.round(im.width * k)
        c.height = Math.round(im.height * k)
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
        res(c.toDataURL('image/jpeg', 0.7))
      }
      im.src = r.result
    }
    r.readAsDataURL(file)
  })
}

async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t)
  } catch {
    const a = document.createElement('textarea')
    a.value = t
    document.body.appendChild(a)
    a.select()
    try { document.execCommand('copy') } catch { /* noop */ }
    a.remove()
  }
}

// ───────────── ui.jsx ─────────────
const S = ({ children, size = 22, sw = 2, fill = 'none', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

const Ic = {
  back: (p) => <S sw={2.6} {...p}><path d="M15 5l-7 7 7 7" /></S>,
  compose: (p) => <S {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></S>,
  search: (p) => <S size={18} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>,
  plus: (p) => <S sw={2.4} {...p}><path d="M12 5v14M5 12h14" /></S>,
  up: (p) => <S size={18} sw={3} {...p}><path d="M12 19V5M5 12l7-7 7 7" /></S>,
  pin: (p) => <S size={20} {...p}><path d="M12 17v5M8 3h8l-1 7 3 3v2H6v-2l3-3z" /></S>,
  pinFill: (p) => <S size={13} fill="currentColor" sw={1} {...p}><path d="M12 17v5M8 3h8l-1 7 3 3v2H6v-2l3-3z" /></S>,
  bellOff: (p) => <S size={14} {...p}><path d="M18 8a6 6 0 0 0-9.3-5M6 6.5C6 12 3 14 3 17h14M10 21h4M3 3l18 18" /></S>,
  trash: (p) => <S size={22} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></S>,
  reply: (p) => <S size={20} {...p}><path d="M9 14L4 9l5-5M4 9h9a7 7 0 0 1 7 7v2" /></S>,
  copy: (p) => <S size={20} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></S>,
  clock: (p) => <S size={20} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>,
  photo: (p) => <S size={26} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></S>,
  smile: (p) => <S size={26} {...p}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2.5 4 2.5S16 14 16 14M9 9.5h.01M15 9.5h.01" /></S>,
  close: (p) => <S size={16} sw={2.6} {...p}><path d="M6 6l12 12M18 6L6 18" /></S>,
  chevUp: (p) => <S size={18} sw={2.6} {...p}><path d="M6 15l6-6 6 6" /></S>,
  chevDown: (p) => <S size={18} sw={2.6} {...p}><path d="M6 9l6 6 6-6" /></S>,
  link: (p) => <S size={22} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></S>,
  check: (p) => <S size={16} sw={3.2} {...p}><path d="M5 12l5 5 9-10" /></S>,
}

// 사진 말풍선 (src가 있으면 실제 이미지, 없으면 그라데이션 플레이스홀더)
function Photo({ m, onClick, className = '' }) {
  const g = m.g || ['#cfd9df', '#a1c4fd']
  return (
    <div className={`imessage-photo ${className}`} onClick={onClick} style={m.src ? undefined : { background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
      {m.src ? <img src={m.src} alt="" draggable={false} /> : <span>{m.ph}</span>}
    </div>
  )
}

// ───────────── ContactInfo.jsx ─────────────

function ContactInfo({ tid, cid, name, msgs, ov, api, onBack, onSearch, onImage }) {
  const [share, setShare] = useState(false)
  const phone = CONTACTS.find((c) => c.id === cid)?.phone || '번호 없음'
  const photos = msgs.filter((m) => m.type === 'image')
  const links = msgs.filter((m) => m.type === 'link')
  const muted = !!ov.muted[tid]

  return (
    <div className="imessage-layer imessage-info">
      <div className="imessage-navbar">
        <button className="imessage-link" onClick={onBack}>완료</button>
      </div>
      <div className="imessage-info-scroll">
        <div className="imessage-info-head">
          <Avatar id={cid} size={96} />
          <h2>{name}</h2>
          <p>{phone}</p>
        </div>

        <div className="imessage-group">
          <button className="imessage-cell" onClick={onSearch}>
            <span>대화 내용 검색</span>
            <Ic.search />
          </button>
          <button className="imessage-cell" onClick={() => setShare(true)}>
            <span>연락처 공유</span>
          </button>
        </div>

        <div className="imessage-group">
          <div className="imessage-cell">
            <span>알림 끄기</span>
            <button className={`imessage-switch ${muted ? 'on' : ''}`} onClick={() => api.mute(tid)} aria-pressed={muted}>
              <i />
            </button>
          </div>
        </div>

        <div className="imessage-sec">사진 {photos.length}</div>
        {photos.length ? (
          <div className="imessage-grid">
            {photos.map((m) => (
              <Photo key={m.key} m={m} onClick={() => onImage(m)} />
            ))}
          </div>
        ) : (
          <div className="imessage-empty">주고받은 사진이 없습니다.</div>
        )}

        <div className="imessage-sec">링크 {links.length}</div>
        {links.length ? (
          <div className="imessage-group">
            {links.map((m) => (
              <div key={m.key} className="imessage-cell imessage-linkcell">
                <Ic.link />
                <div>
                  <b>{m.link.t}</b>
                  <small>{m.link.s}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="imessage-empty">주고받은 링크가 없습니다.</div>
        )}
      </div>

      {share && (
        <div className="imessage-modal" onClick={() => setShare(false)}>
          <div className="imessage-sharecard" onClick={(e) => e.stopPropagation()}>
            <Avatar id={cid} size={56} />
            <b>{name}</b>
            <span>{phone}</span>
            <button className="imessage-pill" onClick={() => { copyText(`${name} ${phone}`); setShare(false) }}>
              연락처 복사
            </button>
            <button className="imessage-link" onClick={() => setShare(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────── ThreadView.jsx ─────────────

// 길게 누르기
function useLongPress(onLong, onTap) {
  const t = useRef(null)
  const start = useRef([0, 0])
  const fired = useRef(false)
  const clear = () => { clearTimeout(t.current); t.current = null }
  return {
    onPointerDown: (e) => {
      fired.current = false
      start.current = [e.clientX, e.clientY]
      t.current = setTimeout(() => { fired.current = true; onLong() }, 420)
    },
    onPointerMove: (e) => {
      if (t.current && Math.hypot(e.clientX - start.current[0], e.clientY - start.current[1]) > 8) clear()
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e) => { e.preventDefault() },
    onClick: () => { if (!fired.current) onTap?.() },
  }
}

function Hl({ text, q }) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      <Hl text={text.slice(i + q.length)} q={q} />
    </>
  )
}

function Bubble({ m, tail, react, quote, q, active, showTime, onLong, onTap, onImage }) {
  const mine = m.from === ME
  const lp = useLongPress(onLong, onTap)
  const body =
    m.type === 'sticker' ? (
      <div className="imessage-sticker">{m.st}</div>
    ) : m.type === 'image' ? (
      <Photo m={m} onClick={(e) => { e.stopPropagation(); onImage(m) }} />
    ) : (
      <div className={`imessage-bubble ${mine ? 'me' : 'them'} ${tail ? 'tail' : ''} ${active ? 'hit' : ''}`}>
        {quote && <div className="imessage-quote">{quote}</div>}
        {m.type === 'link' && m.link && (
          <div className="imessage-linkcard">
            <div className="imessage-linkthumb"><Ic.link size={26} /></div>
            <b>{m.link.t}</b>
            <small>{m.link.s}</small>
          </div>
        )}
        {(m.type !== 'link' || (m.text && m.text !== m.link?.s)) && <span><Hl text={m.text} q={q} /></span>}
      </div>
    )
  return (
    <div className={`imessage-row ${mine ? 'me' : 'them'} ${tail ? 'tail' : ''}`} data-key={m.key}>
      <div className="imessage-wrap" {...lp}>
        {body}
        {react && <span className={`imessage-tap ${mine ? 'l' : 'r'}`}>{tapEmoji(react)}</span>}
      </div>
      {showTime && <div className="imessage-time">{hm(m.ts)}</div>}
    </div>
  )
}

function ThreadView({ tid, cid, name, msgs, ov, api, onBack, startSearch }) {
  const [view, setView] = useState('chat')
  const [text, setText] = useState(() => getDraft(tid))
  const [reply, setReply] = useState(null)
  const [menu, setMenu] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [times, setTimes] = useState({})
  const [search, setSearch] = useState(!!startSearch)
  const [q, setQ] = useState('')
  const [hit, setHit] = useState(0)
  const [light, setLight] = useState(null)
  const [kb, setKb] = useState(0)
  const scroller = useRef(null)
  const ta = useRef(null)
  const file = useRef(null)
  const first = useRef(true)

  const byKey = useMemo(() => Object.fromEntries(msgs.map((m) => [m.key, m])), [msgs])
  const lastTs = msgs.length ? msgs[msgs.length - 1].ts : 0
  const lastMineIdx = (() => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].from === ME) return i; return -1 })()
  const lastMine = msgs[lastMineIdx]
  const matches = useMemo(() => (q.trim() ? msgs.filter((m) => m.text && m.text.toLowerCase().includes(q.trim().toLowerCase())) : []), [msgs, q])

  // 읽음 처리
  useEffect(() => { api.markRead(tid, lastTs) }, [tid, lastTs]) // eslint-disable-line

  // 보낸 메시지의 "읽음" 표시 (시뮬레이션)
  useEffect(() => {
    if (!lastMine || !lastMine.key.startsWith('o:') || ov.readSent[lastMine.key]) return
    const id = setTimeout(() => api.sentRead(lastMine.key), 1600)
    return () => clearTimeout(id)
  }, [lastMine?.key]) // eslint-disable-line

  // 최신 메시지로 이동
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    if (first.current) { el.scrollTop = el.scrollHeight; first.current = false } else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, view])

  // 키보드가 열려도 입력창이 가려지지 않게
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const f = () => setKb(Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop)))
    v.addEventListener('resize', f)
    v.addEventListener('scroll', f)
    f()
    return () => { v.removeEventListener('resize', f); v.removeEventListener('scroll', f) }
  }, [])

  // 검색 결과로 이동
  useEffect(() => {
    if (!matches.length) return
    const k = matches[Math.min(hit, matches.length - 1)].key
    scroller.current?.querySelector(`[data-key="${k}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [hit, matches])
  useEffect(() => setHit(matches.length ? matches.length - 1 : 0), [q]) // eslint-disable-line

  const fit = () => {
    const t = ta.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
  }
  useEffect(fit, [])

  const send = (extra) => {
    const m = mkMsg(msgs, { ...extra, replyTo: reply?.key })
    api.send(tid, m)
    setReply(null)
    setSheet(null)
  }
  const submit = () => {
    const t = text.trim()
    if (!t) return
    const link = linkOf(t)
    send({ text: t, ...(link ? { type: 'link', link } : {}) })
    setText('')
    setDraft(tid, '')
    requestAnimationFrame(fit)
    ta.current?.focus()
  }
  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try { send({ type: 'image', src: await shrinkImage(f) }) } catch { /* 이미지 아님 */ }
  }

  // 말풍선 묶기
  const brk = (a, b) => !a || !b || a.from !== b.from || b.ts - a.ts > 180e3 || dayKey(a.ts) !== dayKey(b.ts)
  const items = []
  msgs.forEach((m, i) => {
    const p = msgs[i - 1]
    if (!p || dayKey(p.ts) !== dayKey(m.ts) || m.ts - p.ts > 3600e3) items.push({ div: m.ts, key: 'd' + m.key })
    items.push({ m, i, tail: brk(m, msgs[i + 1]) || msgs[i + 1].ts - m.ts > 3600e3, gap: brk(p, m) })
  })

  const reactOf = (m) => (m.key in ov.reactions ? ov.reactions[m.key] : m.react)

  if (view === 'info')
    return (
      <>
        <ContactInfo
          tid={tid} cid={cid} name={name} msgs={msgs} ov={ov} api={api}
          onBack={() => setView('chat')}
          onSearch={() => { setView('chat'); setSearch(true) }}
          onImage={setLight}
        />
        {light && <Lightbox m={light} onClose={() => setLight(null)} />}
      </>
    )

  return (
    <div className="imessage-layer imessage-thread" style={kb ? { paddingBottom: kb + 6 } : undefined}>
      <div className="imessage-navbar imessage-thread-nav">
        <button className="imessage-back" onClick={onBack} aria-label="뒤로"><Ic.back /></button>
        <button className="imessage-who" onClick={() => setView('info')}>
          <Avatar id={cid} size={44} />
          <span>{name} <em>›</em></span>
        </button>
        <button className="imessage-iconbtn" onClick={() => { setSearch((s) => !s); setQ('') }} aria-label="검색"><Ic.search size={22} /></button>
      </div>

      {search && (
        <div className="imessage-searchbar">
          <div className="imessage-searchfield">
            <Ic.search size={16} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="대화 내용 검색" />
            {q && <button onClick={() => setQ('')}><Ic.close size={14} /></button>}
          </div>
          <span className="imessage-count">{q.trim() ? (matches.length ? `${Math.min(hit, matches.length - 1) + 1}/${matches.length}` : '결과 없음') : ''}</span>
          <button className="imessage-iconbtn s" disabled={!matches.length} onClick={() => setHit((h) => (h - 1 + matches.length) % matches.length)}><Ic.chevUp /></button>
          <button className="imessage-iconbtn s" disabled={!matches.length} onClick={() => setHit((h) => (h + 1) % matches.length)}><Ic.chevDown /></button>
          <button className="imessage-link" onClick={() => { setSearch(false); setQ('') }}>취소</button>
        </div>
      )}

      <div className="imessage-msgs" ref={scroller} onClick={() => setSheet(null)}>
        {!msgs.length && <div className="imessage-empty big">메시지를 입력해 대화를 시작하세요.</div>}
        {items.map((it) => {
          if (it.div) {
            const [d, t] = fmtDivider(it.div)
            return <div key={it.key} className="imessage-divider"><b>{d}</b> {t}</div>
          }
          const { m, i, tail, gap } = it
          const rq = m.replyTo ? byKey[m.replyTo] : null
          const hitKey = matches.length ? matches[Math.min(hit, matches.length - 1)].key : null
          return (
            <div key={m.key} className={gap ? 'imessage-gap' : ''}>
              <Bubble
                m={m} tail={tail} react={reactOf(m)} q={q.trim()} active={hitKey === m.key}
                quote={m.replyTo ? (rq ? `${rq.from === ME ? '나' : name}: ${previewOf(rq)}` : '삭제된 메시지') : null}
                showTime={!!times[m.key]}
                onTap={() => setTimes((t) => ({ ...t, [m.key]: !t[m.key] }))}
                onLong={() => { navigator.vibrate?.(8); setMenu(m) }}
                onImage={setLight}
              />
              {i === lastMineIdx && (
                <div className="imessage-receipt">
                  {m.key.startsWith('o:') && !ov.readSent[m.key] ? '전송됨' : `읽음 ${hm(ov.readSent[m.key] || m.ts + 60e3)}`}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sheet && (
        <div className="imessage-sheet">
          {sheet === 'attach' && (
            <div className="imessage-attach">
              <button onClick={() => setSheet('photo')}><Ic.photo /><span>사진</span></button>
              <button onClick={() => setSheet('sticker')}><Ic.smile /><span>스티커</span></button>
            </div>
          )}
          {sheet === 'photo' && (
            <>
              <div className="imessage-sheet-head"><b>사진</b><button className="imessage-link" onClick={() => file.current?.click()}>내 기기에서 선택</button></div>
              <div className="imessage-photogrid">
                {SAMPLE_PHOTOS.map((p) => (
                  <Photo key={p.ph} m={p} onClick={() => send({ type: 'image', ph: p.ph, g: p.g })} />
                ))}
              </div>
            </>
          )}
          {sheet === 'sticker' && (
            <>
              <div className="imessage-sheet-head"><b>스티커</b></div>
              <div className="imessage-stickergrid">
                {STICKERS.map((s) => (
                  <button key={s} onClick={() => send({ type: 'sticker', st: s })}>{s}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <input ref={file} type="file" accept="image/*" hidden onChange={onFile} />

      <div className="imessage-composer">
        {reply && (
          <div className="imessage-replybar">
            <div><b>{reply.from === ME ? '나' : name}에게 답장</b><span>{previewOf(reply)}</span></div>
            <button onClick={() => setReply(null)}><Ic.close /></button>
          </div>
        )}
        <div className="imessage-composerow">
          <button className="imessage-plus" onClick={() => setSheet((s) => (s ? null : 'attach'))} aria-label="첨부"><Ic.plus /></button>
          <div className="imessage-field">
            <textarea
              ref={ta} rows={1} value={text} placeholder="iMessage"
              onChange={(e) => { setText(e.target.value); setDraft(tid, e.target.value); fit() }}
              onFocus={() => { setSheet(null); setTimeout(() => scroller.current?.scrollTo({ top: 1e9 }), 250) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
            />
            {text.trim() && <button className="imessage-send" onClick={submit} aria-label="전송"><Ic.up /></button>}
          </div>
        </div>
      </div>

      {menu && (
        <div className="imessage-modal imessage-menu" onClick={() => setMenu(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="imessage-tapbar">
              {TAPBACKS.map(([k, e]) => (
                <button key={k} className={reactOf(menu) === k ? 'on' : ''} onClick={() => { api.react(menu.key, k); setMenu(null) }}>{e}</button>
              ))}
            </div>
            <div className="imessage-menupreview">
              <Bubble m={menu} tail onLong={() => {}} onImage={() => {}} />
            </div>
            <div className="imessage-actions">
              <button onClick={() => { setReply(menu); setMenu(null); ta.current?.focus() }}>답장 <Ic.reply /></button>
              {menu.text && <button onClick={() => { copyText(menu.text); setMenu(null) }}>복사 <Ic.copy /></button>}
              <button onClick={() => { setTimes((t) => ({ ...t, [menu.key]: !t[menu.key] })); setMenu(null) }}>시간 보기 <Ic.clock /></button>
              <button className="danger" onClick={() => { api.del(menu.key); setMenu(null) }}>삭제 <Ic.trash /></button>
            </div>
          </div>
        </div>
      )}
      {light && <Lightbox m={light} onClose={() => setLight(null)} />}
    </div>
  )
}

function Lightbox({ m, onClose }) {
  return (
    <div className="imessage-modal imessage-lightbox" onClick={onClose}>
      <Photo m={m} className="big" />
      <button className="imessage-link" onClick={onClose}>닫기</button>
    </div>
  )
}

// ───────────── Compose.jsx ─────────────

function Compose({ ov, api, onClose, onOpen }) {
  const [q, setQ] = useState('')
  const [to, setTo] = useState(null)
  const [text, setText] = useState('')
  const ta = useRef(null)

  const list = CONTACTS.filter((c) => {
    const n = CHARACTERS[c.id]?.name || ''
    return !q.trim() || n.includes(q.trim()) || c.phone.replace(/-/g, '').includes(q.replace(/-/g, '').trim())
  })

  // 이미 대화방이 있으면 그 방으로 연결
  const pick = (c) => {
    const tid = `msg:${c.id}`
    if (threadIds(ov).includes(tid)) return onOpen(tid)
    setTo(c)
    setQ('')
    setTimeout(() => ta.current?.focus(), 50)
  }

  const submit = () => {
    const t = text.trim()
    if (!t || !to) return
    const tid = `msg:${to.id}`
    const link = linkOf(t)
    api.send(tid, mkMsg([], { text: t, ...(link ? { type: 'link', link } : {}) }), { title: CHARACTERS[to.id].name, members: [to.id] })
    onOpen(tid)
  }

  return (
    <div className="imessage-layer imessage-compose">
      <div className="imessage-navbar imessage-compose-nav">
        <button className="imessage-link" onClick={onClose}>취소</button>
        <b>새로운 iMessage</b>
        <span style={{ width: 40 }} />
      </div>

      <div className="imessage-to">
        <span>받는 사람:</span>
        {to && (
          <button className="imessage-chip" onClick={() => setTo(null)}>
            {CHARACTERS[to.id].name} <Ic.close size={12} />
          </button>
        )}
        {!to && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 번호" />}
      </div>

      {!to ? (
        <div className="imessage-suggest">
          {list.map((c) => (
            <button key={c.id} className="imessage-contact" onClick={() => pick(c)}>
              <Avatar id={c.id} size={40} />
              <div>
                <b>{CHARACTERS[c.id]?.name}</b>
                <small>{c.phone}{threadIds(ov).includes(`msg:${c.id}`) ? ' · 대화 중' : ''}</small>
              </div>
            </button>
          ))}
          {!list.length && <div className="imessage-empty">검색 결과가 없습니다.</div>}
        </div>
      ) : (
        <div className="imessage-suggest" />
      )}

      <div className="imessage-composer">
        <div className="imessage-composerow">
          <div className="imessage-field">
            <textarea
              ref={ta} rows={1} value={text} placeholder="iMessage" disabled={!to}
              onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
            />
            {text.trim() && to && <button className="imessage-send" onClick={submit}><Ic.up /></button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────── Messages (메인) ─────────────

const W = 72 // 스와이프 버튼 하나의 너비

function SwipeRow({ open, onOpenChange, actions, onTap, children, disabled }) {
  const [x, setX] = useState(0)
  const [drag, setDrag] = useState(false)
  const st = useRef({ x0: 0, y0: 0, base: 0, on: false, moved: false })
  const max = W * actions.length

  useEffect(() => setX(open ? -max : 0), [open, max])

  return (
    <div className="imessage-swipe">
      <div className="imessage-swipe-actions" style={{ width: max }}>
        {actions.map((a) => (
          <button key={a.label} className={a.cls} onClick={() => { a.run(); onOpenChange(false) }}>
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <div
        className="imessage-swipe-front"
        style={{ transform: `translateX(${x}px)`, transition: drag ? 'none' : 'transform .25s cubic-bezier(.2,.8,.2,1)' }}
        onPointerDown={(e) => { if (disabled) return; st.current = { x0: e.clientX, y0: e.clientY, base: x, on: false, moved: false } }}
        onPointerMove={(e) => {
          if (disabled || !e.buttons && e.pointerType === 'mouse') return
          const s = st.current
          const dx = e.clientX - s.x0
          const dy = e.clientY - s.y0
          if (!s.on) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { s.on = true; setDrag(true); e.currentTarget.setPointerCapture(e.pointerId) } else return
          }
          s.moved = true
          setX(Math.max(-max - 24, Math.min(0, s.base + dx)))
        }}
        onPointerUp={() => {
          const s = st.current
          if (!s.on) return
          s.on = false
          setDrag(false)
          const o = x < -max / 2
          setX(o ? -max : 0)
          onOpenChange(o)
        }}
        onPointerCancel={() => { st.current.on = false; setDrag(false); setX(open ? -max : 0) }}
        onClick={() => {
          if (st.current.moved) { st.current.moved = false; return }
          if (open) onOpenChange(false)
          else onTap()
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function Messages({ params }) {
  const { state } = useGame()
  const [ov, setOv] = useOverlay()
  const api = useApi(setOv)

  const initial = params?.thread && params.thread.startsWith('msg:') ? params.thread : null
  const [scr, setScr] = useState(initial ? { n: 'thread', tid: initial } : { n: 'list' })
  const [leaving, setLeaving] = useState(false)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(false)
  const [sel, setSel] = useState({})
  const [openId, setOpenId] = useState(null)
  const [ask, setAsk] = useState(null)

  const threads = useMemo(() => {
    const out = {}
    threadIds(ov).forEach((id) => (out[id] = buildThread(id, state.threads?.[id], ov)))
    return out
  }, [state.threads, ov])

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return Object.keys(threads)
      .map((id) => {
        const list = threads[id]
        const meta = metaOf(id, ov)
        const last = list[list.length - 1]
        const hitMsg = kw ? [...list].reverse().find((m) => m.text && m.text.toLowerCase().includes(kw)) : null
        const nameHit = kw && meta.title.toLowerCase().includes(kw)
        return { id, list, meta, last, hitMsg, show: !kw || nameHit || hitMsg, unread: unreadCount(id, list, ov) || (ov.forcedUnread[id] ? 1 : 0), pinned: !!ov.pinned[id] }
      })
      .filter((r) => r.last && r.show)
      .sort((a, b) => (b.pinned - a.pinned) || b.last.ts - a.last.ts)
  }, [threads, ov, q])

  const go = (s) => { setOpenId(null); setScr(s) }
  const back = () => {
    setLeaving(true)
    setTimeout(() => { setScr({ n: 'list' }); setLeaving(false) }, 260)
  }

  const askDelete = (ids) =>
    setAsk({
      title: ids.length > 1 ? `대화 ${ids.length}개를 삭제하시겠습니까?` : '이 대화를 삭제하시겠습니까?',
      run: () => { ids.forEach((id) => api.removeThread(id, Date.now() + 864e5 * 3650)); setSel({}); setEdit(false) },
    })
  const selIds = Object.keys(sel).filter((k) => sel[k])

  return (
    <div className="imessage-root">
      {/* ───── 목록 ───── */}
      <div className="imessage-layer imessage-list">
        <div className="imessage-navbar">
          {edit ? (
            <button className="imessage-link" onClick={() => rows.forEach((r) => api.markRead(r.id, r.last.ts))}>모두 읽음</button>
          ) : (
            <button className="imessage-link" onClick={() => setEdit(true)}>편집</button>
          )}
          {edit ? (
            <button className="imessage-link bold" onClick={() => { setEdit(false); setSel({}) }}>완료</button>
          ) : (
            <button className="imessage-iconbtn blue" onClick={() => go({ n: 'compose' })} aria-label="새 메시지"><Ic.compose /></button>
          )}
        </div>
        <div className="imessage-scroll" onScroll={() => openId && setOpenId(null)}>
          <h1 className="imessage-title">메시지</h1>
          <label className="imessage-search">
            <Ic.search />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" />
            {q && <button onClick={() => setQ('')}><Ic.close size={14} /></button>}
          </label>

          {rows.map((r) => {
            const isGroup = r.meta.group
            const preview = r.hitMsg ? r.hitMsg.text : (r.last.from !== ME && isGroup ? `${CHARACTERS[r.last.from]?.name}: ` : '') + previewOf(r.last)
            return (
              <SwipeRow
                key={r.id}
                disabled={edit}
                open={openId === r.id}
                onOpenChange={(o) => setOpenId(o ? r.id : null)}
                onTap={() => (edit ? setSel((s) => ({ ...s, [r.id]: !s[r.id] })) : go({ n: 'thread', tid: r.id }))}
                actions={[
                  { label: r.pinned ? '고정 해제' : '고정', cls: 'pin', icon: <Ic.pin />, run: () => api.pin(r.id) },
                  { label: r.unread ? '읽음' : '읽지 않음', cls: 'read', icon: <Ic.check />, run: () => (r.unread ? api.markRead(r.id, r.last.ts) : api.markUnread(r.id)) },
                  { label: '삭제', cls: 'del', icon: <Ic.trash />, run: () => askDelete([r.id]) },
                ]}
              >
                <div className={`imessage-item ${edit ? 'edit' : ''}`}>
                  {edit && <i className={`imessage-radio ${sel[r.id] ? 'on' : ''}`}>{sel[r.id] && <Ic.check size={12} />}</i>}
                  <div className="imessage-dot">{r.unread > 0 && <i />}</div>
                  <Avatar id={r.meta.members[0]} size={48} />
                  <div className="imessage-main">
                    <div className="imessage-top">
                      <b>{r.meta.title}</b>
                      <span>{fmtList(r.last.ts)}</span>
                    </div>
                    <div className="imessage-prev">
                      <span>{preview}</span>
                      {r.pinned && <Ic.pinFill />}
                      {ov.muted[r.id] && <Ic.bellOff />}
                    </div>
                  </div>
                </div>
              </SwipeRow>
            )
          })}
          {!rows.length && <div className="imessage-empty big">{q ? '검색 결과가 없습니다.' : '메시지가 없습니다.'}</div>}
        </div>

        {edit && (
          <div className="imessage-editbar">
            <button disabled={!selIds.length} onClick={() => selIds.forEach((id) => api.markRead(id, threads[id].at(-1).ts))}>읽음</button>
            <button className="danger" disabled={!selIds.length} onClick={() => askDelete(selIds)}>삭제</button>
          </div>
        )}
      </div>

      {/* ───── 대화방 / 새 메시지 (슬라이드 전환) ───── */}
      {scr.n === 'thread' && (
        <div className={`imessage-page ${leaving ? 'out' : 'in'}`}>
          <ThreadView
            key={scr.tid}
            tid={scr.tid}
            cid={metaOf(scr.tid, ov).members[0]}
            name={metaOf(scr.tid, ov).title}
            msgs={threads[scr.tid] || []}
            ov={ov}
            api={api}
            onBack={back}
          />
        </div>
      )}
      {scr.n === 'compose' && (
        <div className={`imessage-page ${leaving ? 'out' : 'up'}`}>
          <Compose ov={ov} api={api} onClose={back} onOpen={(tid) => setScr({ n: 'thread', tid })} />
        </div>
      )}

      {ask && (
        <div className="imessage-modal imessage-alert" onClick={() => setAsk(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <p>{ask.title}</p>
            <button className="danger" onClick={() => { ask.run(); setAsk(null) }}>삭제</button>
            <button onClick={() => setAsk(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}
