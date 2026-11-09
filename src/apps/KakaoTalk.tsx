import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Settings as Gear } from 'lucide-react'
import './KakaoTalk.css'

type Msg = { id: number; who: string; text?: string; img?: string; t: number; reply?: string }
type Room = { id: string; name: string; group: boolean; members: number; pinned: boolean; muted: boolean; unread: number; msgs: Msg[]; open?: boolean; img?: string; desc?: string; tags?: string[] }
type Me = { name: string; status: string; music: string; photo?: string; bg?: string }
type Store = { me: Me; rooms: Room[]; openRooms: Room[]; collapsed: boolean }

const KEY = 'kakaotalk-v3' // 데이터 구조/대본 변경 시 버전을 올려 이전 저장 데이터를 버리고 새 데이터로 시작

const FRIENDS: [string, string][] = [
  ['엄마', ''], ['아빠', ''], ['형', ''],
  ['김홍중', ''], ['정윤호', ''], ['정우영', ''],
  ['도윤', ''],
  ['민석', ''], ['지훈', ''],
  ['고등학교 동창', ''], ['동창 단톡', ''],
]
const MUSIC: Record<string, string> = {
  이서연: 'Love Dive - IVE', 박지호: 'Perfect Night - LE SSERAFIM', 정다은: 'Spicy - aespa', 조수빈: 'Super Shy - NewJeans',
  한소희: 'Ditto - NewJeans', 신예린: 'Drama - aespa', 문가은: 'Magnetic - ILLIT', 강현우: 'Run - BTS',
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
/* 로컬 프로필 사진 (public/images/kakaotalk/profile_pic/<이름>/). 파일이 없는 사람은 아래 기본 사진 사용 */
const LOCAL_PHOTO: Record<string, string> = {
  '박성화': '박성화/IMG_0253.jpeg',
  '김홍중': '김홍중/IMG_0252.jpeg',
  '정우영': '정우영/IMG_0254.jpeg',
  '정윤호': '정윤호/profile.jpg',
  '형': '김홍중/IMG_0252.jpeg', // 형 프사는 홍중 프사와 동일
  '엄마': '엄마/FB20C89C-691B-47BE-BB5A-83CBC87D0435.png',
  '아빠': '아빠/E965B11F-636D-432B-8315-D243D4EA1B24.png',
}
const localPhotoOf = (name: string) => {
  // 폴더가 없는 사람은 모두 김홍중 프로필 사진으로 통일
  const f = LOCAL_PHOTO[name] ?? LOCAL_PHOTO['김홍중']
  return f ? `${import.meta.env.BASE_URL}images/kakaotalk/profile_pic/${f.split('/').map(encodeURIComponent).join('/')}` : undefined
}

const OPEN: readonly [string, string, number, string, string[]][] = [
  ['말랑한 어피치', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['졸린 라이언', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['수줍은 튜브', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['반짝이는 무지', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['느긋한 네오', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['김민수', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['박준영', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['이도현', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['인천사는사람', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['부평', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['수원 영통', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['최현우', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
  ['행복한 콘', '문의', 2, '어플을 통해 연락한 1:1 오픈채팅', ['#문의']],
]

/* 오픈채팅은 모두 상대방과 나, 두 사람만 있는 1:1 문의 대화 */
const OPEN_MSGS: [string, string][][] = [
  [['말랑한 어피치', '안녕하세요 어플 보고 연락드렸어요'], ['me', '네 안녕하세요. 날짜랑 시간, 장소 말씀해주세요'], ['말랑한 어피치', '11월 11일 수요일 오후 7시 신림역 근처 괜찮으실까요?'], ['me', '네 알겠습니다']],
  [['졸린 라이언', '안녕하세요 어플 보고 연락드립니다 아직 가능하신가요?'], ['me', '가능합니다. 날짜 시간 장소 알려주세요'], ['졸린 라이언', '이번 주 목요일 6시 반이고 서울대입구역 2번 출구 생각하고 있어요'], ['me', '네 알겠습니다']],
  [['수줍은 튜브', '어플에서 보고 문의드려요'], ['me', '네 날짜, 시간, 장소 보내주세요'], ['수줍은 튜브', '11월 13일 금요일 오후 8시 봉천역 쪽으로 가능할까요'], ['me', '네 확인했습니다']],
  [['반짝이는 무지', '안녕하세요 어플 보고 연락드렸습니다'], ['me', '네 말씀하세요. 날짜 시간 장소 부탁드려요'], ['반짝이는 무지', '토요일 7시쯤 신림역 3번 출구 어떠세요?'], ['me', '네 알겠습니다']],
  [['느긋한 네오', '안녕하세요 어플 보고 연락드렸는데요'], ['me', '네 가능해요 날짜랑 시간 장소 알려주세요'], ['느긋한 네오', '11월 15일 일요일 오후 5시, 구로디지털단지역 근처요'], ['me', '네 알겠습니다']],
  [['김민수', '안녕하세요 어플 보고 연락드렸어요 혹시 이번 주 가능한가요?'], ['me', '네 날짜 시간 장소 말씀해주세요'], ['김민수', '11월 16일 월요일 저녁 7시 신림역 4번 출구 괜찮으세요?'], ['me', '네 알겠습니다']],
  [['박준영', '어플 보고 연락드립니다'], ['me', '네 날짜, 시간, 장소 보내주세요'], ['박준영', '화요일 오후 6시쯤 서울대입구역 근처에서 뵐 수 있을까요'], ['me', '네 확인했습니다']],
  [['이도현', '안녕하세요 어플 보고 연락드렸습니다'], ['me', '네 말씀해주세요 날짜 시간 장소요'], ['이도현', '11월 18일 수요일 오후 8시 신림역 근처로 부탁드립니다'], ['me', '네 알겠습니다']],
  [['인천사는사람', '안녕하세요 어플 보고 연락드려요'], ['me', '네 날짜 시간 장소 알려주세요'], ['인천사는사람', '이번 주 금요일 저녁 7시 부평역 5번 출구 괜찮을까요?'], ['me', '네 알겠습니다']],
  [['부평', '어플 보고 문의드려요 아직 예약 가능하신가요?'], ['me', '네 날짜랑 시간, 장소 말씀해주세요'], ['부평', '11월 20일 금요일 오후 6시 부평시장역 근처요'], ['me', '네 확인했습니다']],
  [['수원 영통', '안녕하세요 어플에서 보고 연락드렸어요'], ['me', '네 날짜 시간 장소 보내주시면 확인할게요'], ['수원 영통', '토요일 오후 4시 수원역 로데오거리 쪽 괜찮으실까요?'], ['me', '네 알겠습니다']],
  [['최현우', '어플 보고 연락드립니다. 이번 주 중에 가능하실까요?'], ['me', '가능한 날짜랑 시간, 장소 말씀해주세요'], ['최현우', '11월 22일 일요일 오후 6시 신림역 6번 출구로 생각하고 있습니다'], ['me', '네 알겠습니다']],
  [['행복한 콘', '안녕하세요 어플 보고 연락드렸습니다 아직 가능하실까요?'], ['me', '네 날짜, 시간, 장소 알려주세요'], ['행복한 콘', '다음 주 월요일 오후 7시 서울대입구역 근처 괜찮으실까요?'], ['me', '네 알겠습니다']],
]

function seedOpen(): Room[] {
  const now = Date.now()
  return OPEN.map((o, i) => {
    let t = now - (i + 1) * 5 * 60 * 60e3
    const msgs = OPEN_MSGS[i].map(([who, text], k) => {
      t += (2 + ((i * 3 + k * 5) % 7)) * 60e3
      return { id: 60000 + i * 100 + k, who, text, t }
    })
    return {
      id: 'o' + i,
      name: o[0],
      group: false,
      members: 2,
      pinned: false,
      muted: false,
      unread: i % 4 === 0 ? 1 : 0,
      msgs,
      open: true,
      img: `https://picsum.photos/seed/openchat${hash(o[0])}/160/160`,
      desc: o[3],
      tags: o[4],
    }
  })
}

/* 가족 단톡: 모임 날짜, 명절 내려오는지, 김치 필요한지 등 집안 얘기 위주. 알바 얘기는 없음. 마지막 대화 11월 2일 */
const FAMILY_MSGS = (): Msg[] => ([
  ['2026-10-20 09:10', '엄마', '다들 이 방에서 얘기하자~ 📢'],
  ['2026-10-20 09:12', '형', 'ㅇㅇ'],
  ['2026-10-23 19:30', '엄마', '이번 명절에 다들 내려오는 거지?'],
  ['2026-10-23 19:44', '형', '일단 가볼게요'],
  ['2026-10-23 19:45', '엄마', '그래 ㅎㅎ 성화는?'],
  ['2026-10-23 21:02', 'me', '잘 모르겠어요'],
  ['2026-10-25 08:40', '아빠', '명절 때 차 막힌다 일찍 출발해라'],
  ['2026-10-25 08:55', '엄마', '그건 그렇고 김치 떨어졌는데 필요한 사람 있어?'],
  ['2026-10-25 09:01', '형', '저는 조금만 주세요'],
  ['2026-10-25 09:20', '엄마', '성화는 필요해?'],
  ['2026-10-28 20:15', '엄마', '11월 중에 다 같이 모일까? 날짜 정해보자'],
  ['2026-10-28 20:31', '형', '주말이 좋을 것 같아요'],
  ['2026-10-29 07:50', '아빠', 'ㅇㅇ'],
  ['2026-11-02 22:10', '엄마', '성화는 소식 없어~?'],
  ['2026-11-02 22:10', '엄마', 'ㅎㅎ'],
  ['2026-11-02 22:14', 'me', '멀요'],
  ['2026-11-02 22:14', '엄마', '알잖아~'],
  ['2026-11-02 22:15', '엄마', '니 형도 갔고~'],
  ['2026-11-02 22:21', 'me', '멀라요'],
  ['2026-11-02 22:21', 'me', '있으면 얘기할게요'],
  ['2026-11-02 22:30', '엄마', '그래 기대할게~'],
] as [string, string, string][]).map(([at, who, text], k) => ({ id: 9100 + k, who, text, t: new Date(at.replace(' ', 'T') + ':00+09:00').getTime() }))

/* 1:1 대화방 메시지 (시간은 고정 날짜, 한국 시간 기준) */
const DM = (rows: [string, string, string][], base: number): Msg[] =>
  rows.map(([at, who, text], k) => ({ id: base + k, who, text, t: new Date(at.replace(' ', 'T') + ':00+09:00').getTime() }))

function seed(): Store {
  const now = Date.now()
  const rooms: Room[] = ROOMS.map((r, i) => {
    let t = now - (i * 3 + 1) * 3600e3 * 5 - r.m.length * 25 * 60e3
    const msgs = r.m.map(([who, text], k) => { t += (8 + ((i * 7 + k * 13) % 40)) * 60e3; return { id: i * 100 + k, who, text, t } })
    return { id: 'r' + i, name: r.n, group: r.g > 0, members: r.g || 2, pinned: i < 2, muted: false, unread: i % 4 === 1 ? (i % 3) + 1 : 0, msgs }
  })
  return { me: { name: '박성화', status: '', music: '' }, rooms: [
    { id: 'r-family-mom', name: '엄마', group: false, members: 2, pinned: true, muted: false, unread: 0, msgs: DM([['2026-10-12 21:30','엄마','성화 밥은 챙겨 먹고 다니지?'],['2026-10-12 22:05','me','네'],['2026-10-30 20:18','엄마','춥다 따뜻하게 입고 다녀~']], 9201) },
    { id: 'r-family-dad', name: '아빠', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: DM([['2026-10-17 23:40','아빠','엄마한테 말 좀 잘 해봐라'],['2026-10-17 23:52','me','저 그런 거 몰라요'],['2026-10-18 00:05','아빠','그래']], 9211) },
    { id: 'r-bro', name: '형', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: DM([['2026-10-21 14:03','me','형 그 택배 뭐였어요'],['2026-10-21 14:20','형','엄마 주문한 거'],['2026-10-21 14:21','me','ㅇㅇ 알았어요']], 9221) },
    { id: 'r-hj', name: '김홍중', group: false, members: 2, pinned: true, muted: false, unread: 1, msgs: HJ_MSGS },
    { id: 'r-yh', name: '정윤호', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: YH_MSGS },
    { id: 'r-wy', name: '정우영', group: false, members: 2, pinned: false, muted: false, unread: 2, msgs: WY_MSGS },
    { id: 'r-family-group', name: '가족 단톡', group: true, members: 4, pinned: false, muted: false, unread: 0, msgs: FAMILY_MSGS() },
  ], openRooms: seedOpen(), collapsed: false }
}
function load(): Store {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && typeof saved === 'object' && Array.isArray(saved.rooms) && saved.me && typeof saved.me === 'object' && saved.rooms.every((r: any) => r && Array.isArray(r.msgs))) {
      const seeded = seed()
      // 대본으로 관리하는 채팅방은 저장된 과거 메시지를 병합하지 않고 seed 대본으로 완전히 교체
      // 이전 대본이 남아 중복되거나 삭제한 문장이 다시 나타나는 문제 방지
      const scriptedRoomIds = new Set(['r-hj', 'r-wy', 'r-yh', 'r-family-group', 'r-family-mom', 'r-family-dad', 'r-bro'])
      // 삭제한 방(탑알바 연락처)은 저장본에서도 제거
      const removedRoomIds = new Set(['r-casual'])
      const rooms = saved.rooms.filter((room: Room) => !removedRoomIds.has(room.id)).map((room: Room) => {
        if (!scriptedRoomIds.has(room.id)) return room
        const currentScript = seeded.rooms.find(r => r.id === room.id)
        return currentScript ? { ...room, msgs: [...currentScript.msgs] } : room
      })
      // 저장본에 아직 없는 대본 방(가족 단톡 등)은 seed에서 추가
      const savedIds = new Set(rooms.map((r: Room) => r.id))
      seeded.rooms.forEach(r => { if (scriptedRoomIds.has(r.id) && !savedIds.has(r.id)) rooms.push(r) })
      return { ...saved, rooms, openRooms: seeded.openRooms } // 오픈채팅 시드 대본/방 구조 업데이트를 기존 저장 데이터에도 적용
    }
  } catch { /* 손상된 데이터는 새로 시작 */ }
  return seed()
}

/* ───────── 벡터 아이콘 ───────── */
const P: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  addFriend: <><circle cx="9.5" cy="8.5" r="3.5" /><path d="M3 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M19 7v6M16 10h6" /></>,
  newChat: <><path d="M12 4c-4.4 0-8 3-8 6.8 0 2.3 1.4 4.4 3.5 5.6L6.7 20l4-2.5c.4.1.9.1 1.3.1 4.4 0 8-3 8-6.8S16.4 4 12 4z" /><path d="M12 8v6M9 11h6" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  send: <path d="M12 19V5M6 11l6-6 6 6" />,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2" /><circle cx="9" cy="10" r=".7" fill="currentColor" /><circle cx="15" cy="10" r=".7" fill="currentColor" /></>,
  bellOff: <><path d="M6 17v-6a6 6 0 0 1 9-5.2M18 11v6M4.5 17H18M10 20a2 2 0 0 0 4 0" /><path d="M4 4l16 16" /></>,
  bell: <><path d="M6 17v-6a6 6 0 0 1 12 0v6M4.5 17h15M10 20a2 2 0 0 0 4 0" /></>,
  pin: <><path d="M9 4h6l-1 6 3 3v1.5H7V13l3-3z" /><path d="M12 14.5V21" /></>,
  note: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  gift: <><rect x="4" y="9.5" width="16" height="10.5" rx="1.5" /><path d="M3 9.5h18M12 9.5V20M12 9.5C11 6.5 7 6 7 8.2s4 1.3 5 1.3zm0 0c1-3 5-3.5 5-1.3s-4 1.3-5 1.3z" /></>,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z" />,
  chevD: <path d="M6 9l6 6 6-6" />,
  chevU: <path d="M6 15l6-6 6 6" />,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" /></>,
  reply: <><path d="M9 7L4 12l5 5" /><path d="M4 12h9a7 7 0 0 1 7 7" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  trash: <path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10 11v6M14 11v6" />,
  leave: <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />,
  edit: <path d="M4 20l1-4L16 5l3 3L8 19z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  chat: <path d="M12 4c-4.4 0-8 3-8 6.8 0 2.3 1.4 4.4 3.5 5.6L6.7 20l4-2.5c.4.1.9.1 1.3.1 4.4 0 8-3 8-6.8S16.4 4 12 4z" />,
  phone: <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z" />,
  video: <><rect x="3" y="7" width="12" height="10" rx="2" /><path d="M15 11l5-3v8l-5-3" /></>,
  won: <><circle cx="12" cy="12" r="9" /><path d="M6.8 9.5l2.2 5.5 3-5.5 3 5.5 2.2-5.5M7 12.2h10" /></>,
  dots: <><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" /></>,
}
const Ic = ({ n, s = 24, w = 1.8 }: { n: string; s?: number; w?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>
)
const TabIc = ({ k, on }: { k: string; on: boolean }) => {
  const f = on ? 'currentColor' : 'none'
  const ink = on ? '#fff' : 'currentColor'
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill={f} aria-hidden="true">
      {k === 'friends' && <><circle cx="14" cy="9.5" r="4.6" /><path d="M5 23.5c0-5 4-8 9-8s9 3 9 8z" /></>}
      {k === 'chats' && <><path d="M14 4.5c-5.6 0-10 3.6-10 8.2 0 2.9 1.8 5.4 4.4 6.9L7.3 24l5-3.1c.6.1 1.1.1 1.7.1 5.6 0 10-3.6 10-8.2S19.6 4.5 14 4.500z" /></>}
      {k === 'open' && <><path d="M14 4.5c-5.6 0-10 3.6-10 8.2 0 2.9 1.8 5.4 4.4 6.9L7.3 24l5-3.1c.6.1 1.1.1 1.7.1 5.6 0 10-3.6 10-8.2S19.6 4.5 14 4.5z" /><circle cx="14" cy="11" r="2" stroke={ink} /><path d="M10.2 16c.8-1.7 2.2-2.5 3.8-2.500s3 .8 3.8 2.5" stroke={ink} fill="none" /></>}
      {k === 'shop' && <><path d="M5.5 9.500h17l-1.3 14H6.800z" /><path d="M10 12V8.500a4 4 0 0 1 8 0V12" stroke={ink} /></>}
      {k === 'more' && <><circle cx="6" cy="14" r="2" fill="currentColor" stroke="none" /><circle cx="14" cy="14" r="2" fill="currentColor" stroke="none" /><circle cx="22" cy="14" r="2" fill="currentColor" stroke="none" /></>}
    </svg>
  )
}

const PinSolid = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8 3h8l-1 7 3.5 3.5V15h-5.7v6h-1.6v-6H5.5v-1.5L9 10z" /></svg>

/* ───────── 벡터 이모티콘(스티커) ───────── */
const INK = '#3a2a14'
const eye = (x: number, y = 42) => `<circle cx="${x}" cy="${y}" r="5" fill="${INK}"/>`
const arc = (d: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
const heartEye = (x: number) => `<g transform="translate(${x} 42) scale(.62)"><path d="M0 12C-14 2-16-10-8-14c5-3 8 0 8 4 0-4 3-7 8-4 8 4 6 16-8 26z" fill="#ff3b5c"/></g>`
const SMILE = arc('M30 60q20 22 40 0')
const face = (bg: string, inner: string) => `<circle cx="50" cy="50" r="46" fill="${bg}"/>${inner}`
const STICKERS: string[] = [
  face('#ffd43b', eye(35) + eye(65) + SMILE),
  face('#ffd43b', arc('M28 44q7-9 14 0') + arc('M58 44q7-9 14 0') + `<path d="M28 58h44q-4 24-22 24t-22-24z" fill="${INK}"/><path d="M38 74q12-8 24 0q-4 8-12 8t-12-8z" fill="#ff7a7a"/>`),
  face('#ffd43b', arc('M28 44h14') + eye(65) + SMILE),
  face('#ffd43b', heartEye(34) + heartEye(66) + SMILE),
  face('#ffd43b', `<rect x="19" y="35" width="28" height="17" rx="7" fill="#222"/><rect x="53" y="35" width="28" height="17" rx="7" fill="#222"/><path d="M47 42h6" stroke="#222" stroke-width="4"/>` + SMILE),
  face('#ffd43b', arc('M28 42q7-7 14 0') + arc('M58 42q7-7 14 0') + `<path d="M35 50q-6 12 0 16q6-4 0-16z" fill="#6ec5ff"/><path d="M65 50q-6 12 0 16q6-4 0-16z" fill="#6ec5ff"/>` + arc('M34 76q16-14 32 0')),
  face('#ffd43b', arc('M28 44h14') + arc('M58 44h14') + `<ellipse cx="50" cy="66" rx="6" ry="5" fill="${INK}"/><path d="M68 14h12l-12 12h12" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  face('#ff8a65', arc('M26 34l16 6') + arc('M74 34l-16 6') + eye(35, 48) + eye(65, 48) + arc('M35 76q15-14 30 0')),
  face('#ffd43b', `<circle cx="35" cy="42" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="65" cy="42" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="35" cy="42" r="3" fill="${INK}"/><circle cx="65" cy="42" r="3" fill="${INK}"/><ellipse cx="50" cy="70" rx="8" ry="11" fill="${INK}"/>`),
  face('#ffd43b', arc('M28 44q7-8 14 0') + arc('M58 44q7-8 14 0') + `<ellipse cx="26" cy="57" rx="7" ry="4" fill="#ff8fa3"/><ellipse cx="74" cy="57" rx="7" ry="4" fill="#ff8fa3"/>` + arc('M38 62q12 10 24 0')),
  `<path d="M50 88C10 60 6 30 26 18c12-7 22 0 24 10 2-10 12-17 24-10 20 12 16 42-24 70z" fill="#ff4d6d"/>`,
  `<path d="M50 8l12 27 29 3-22 20 7 29-26-15-26 15 7-29L9 38l29-3z" fill="#ffc41f"/>`,
]
const stickerUri = (i: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${STICKERS[i]}</svg>`)}`
const isSticker = (s?: string) => !!s && s.startsWith('data:image/svg+xml')
const preview = (m: Msg) => m.text ?? (isSticker(m.img) ? '이모티콘' : '사진')

/* ───────── 공용 컴포넌트 ───────── */
const Silhouette = () => (
  <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true"><rect width="40" height="40" fill="#d8dce2" /><circle cx="20" cy="16" r="7" fill="#fff" /><path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="#fff" /></svg>
)
function Avatar({ name, src, size = 44, me = false }: { name: string; src?: string; size?: number; me?: boolean }) {
  const url = src ?? localPhotoOf(name)
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [url])
  return (
    <div className="kakaotalk-avatar" style={{ width: size, height: size }}>
      {url && !bad ? <img src={url} alt="" draggable={false} onError={() => setBad(true)} /> : <Silhouette />}
    </div>
  )
}
function Pic({ src, className }: { src: string; className: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  return bad ? <div className={`${className} kakaotalk-picfb`} /> : <img className={className} src={src} alt="" loading="lazy" draggable={false} onError={() => setBad(true)} />
}
const roomMembers = (r: Room) => {
  if (r.id === 'r-family-group') return ['엄마', '형', '아빠', '박성화']
  const set = [...new Set(r.msgs.map(m => m.who).filter(w => w !== 'me'))]
  const off = hash(r.name) % FRIENDS.length
  for (let i = 0; i < FRIENDS.length && set.length < 4; i++) { const n = FRIENDS[(off + i) % FRIENDS.length][0]; if (!set.includes(n)) set.push(n) }
  return set.slice(0, 4)
}
function RoomAvatar({ room, size = 50 }: { room: Room; size?: number }) {
  if (room.open && room.img) return <div className="kakaotalk-open-img" style={{ width: size, height: size, borderRadius: '36%' }}><Pic src={room.img} className="kakaotalk-fill" /></div>
  if (!room.group) return <Avatar name={room.name} size={size} />
  const mem = roomMembers(room)
  const n = Math.min(mem.length, room.members >= 4 ? 4 : Math.max(2, room.members))
  const s = Math.round(size * (n === 2 ? 0.64 : 0.54))
  const e = size - s
  const pos: [number, number][] = n === 2 ? [[0, 0], [e, e]] : n === 3 ? [[e / 2, 0], [0, e], [e, e]] : [[0, 0], [e, 0], [0, e], [e, e]]
  return (
    <div className="kakaotalk-gav" style={{ width: size, height: size }}>
      {pos.map(([x, y], i) => <div key={i} style={{ left: x, top: y }}><Avatar name={mem[i]} size={s} /></div>)}
    </div>
  )
}
const MusicChip = ({ text }: { text: string }) => <span className="kakaotalk-music"><Ic n="note" s={11} w={2} /><em>{text}</em></span>
const readFile = (f: File, cb: (s: string) => void) => { const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(f) }
const hl = (s: string, q: string | null): ReactNode => (q ? s.split(q).flatMap((p, i, a) => (i < a.length - 1 ? [p, <mark key={i}>{q}</mark>] : [p])) : s)

function useKeyboard() {
  const [kb, setKb] = useState(0)
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const f = () => { const k = Math.round(window.innerHeight - v.height - v.offsetTop); setKb(k > 80 ? k : 0) }
    v.addEventListener('resize', f); v.addEventListener('scroll', f); f()
    return () => { v.removeEventListener('resize', f); v.removeEventListener('scroll', f) }
  }, [])
  return kb
}

/* ───────── 메인 ───────── */
export default function KakaoTalk({ close }: { params?: unknown; close?: () => void }) {
  const [st, setSt] = useState<Store>(load)
  const [tab, setTab] = useState<'friends' | 'chats' | 'open'>('friends')
  const [view, setView] = useState<{ t: 'room' | 'profile' | 'edit'; id?: string } | null>(null)
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [gear, setGear] = useState(false)
  const [picker, setPicker] = useState(false)
  const [toast, setToast] = useState('')
  const tt = useRef(0)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* quota */ } }, [st])
  const say = (m: string) => { setToast(m); clearTimeout(tt.current); tt.current = window.setTimeout(() => setToast(''), 1600) }

  const patchRoom = (id: string, f: (r: Room) => Room) => setSt(s => ({ ...s, rooms: s.rooms.map(r => (r.id === id ? f(r) : r)), openRooms: s.openRooms.map(r => (r.id === id ? f(r) : r)) }))
  const openDM = (name: string) => {
    let r = st.rooms.find(x => !x.group && x.name === name)
    if (!r) {
      r = { id: 'r' + Date.now(), name, group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: [] }
      const nr = r
      setSt(s => ({ ...s, rooms: [nr, ...s.rooms] }))
    }
    setView({ t: 'room', id: r.id })
  }
  const switchTab = (k: 'friends' | 'chats' | 'open') => { setTab(k); setQ(''); setSearching(false) }

  const byRecent = (a: Room, b: Room) => Number(b.pinned) - Number(a.pinned) || (b.msgs.at(-1)?.t ?? 0) - (a.msgs.at(-1)?.t ?? 0)
  const rooms = useMemo(() => st.rooms.filter(r => r.name.includes(q)).sort(byRecent), [st.rooms, q])
  const openRooms = useMemo(() => st.openRooms.filter(r => !q || r.name.includes(q) || r.desc?.includes(q) || r.tags?.some(t => t.includes(q))).sort(byRecent), [st.openRooms, q])
  const friends = FRIENDS.filter(([n, s]) => n.includes(q) || s.includes(q))
  const fav = friends.slice(0, 3)
  const bday = friends.find(f => f[0] === FRIENDS[4][0])
  const room = view?.t === 'room' ? [...st.rooms, ...st.openRooms].find(r => r.id === view.id) : undefined
  const totalUnread = st.rooms.reduce((a, r) => a + (r.muted ? 0 : r.unread), 0)

  const title = tab === 'friends' ? '친구' : tab === 'chats' ? '채팅' : '오픈채팅'
  const FriendRow = ({ n, s, flag }: { n: string; s: string; flag?: boolean }) => (
    <div className="kakaotalk-row" onClick={() => setView({ t: 'profile', id: n })}>
      <Avatar name={n} size={44} />
      <div className="kakaotalk-grow"><b>{n}</b><p>{s}</p></div>
      {flag && <span className="kakaotalk-gift"><Ic n="gift" s={18} /></span>}
      {MUSIC[n] && <MusicChip text={MUSIC[n]} />}
    </div>
  )
  const renderRoom = (r: Room) => {
    const l = r.msgs.at(-1)
    return (
      <div key={r.id} className="kakaotalk-row kakaotalk-chatrow" onClick={() => { patchRoom(r.id, x => ({ ...x, unread: 0 })); setView({ t: 'room', id: r.id }) }}>
        <RoomAvatar room={r} />
        <div className="kakaotalk-grow">
          <div className="kakaotalk-nameline">
            <b>{r.name}</b>
            {r.group && <i>{r.members.toLocaleString()}</i>}
            {r.muted && <span className="kakaotalk-ico"><Ic n="bellOff" s={13} w={2} /></span>}
          </div>
          <p>{l ? preview(l) : '대화를 시작해 보세요'}</p>
        </div>
        <div className="kakaotalk-meta">
          <span>{l ? listT(l.t) : ''}</span>
          <div className="kakaotalk-badges">
            {r.pinned && <span className="kakaotalk-ico"><Ic n="pin" s={14} w={2} /></span>}
            {r.unread > 0 && <em>{r.unread > 99 ? '99+' : r.unread}</em>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kakaotalk">
      <div className="kakaotalk-main">
        <div className="kakaotalk-head">
          <h1>{title}</h1>
          <button aria-label="검색" onClick={() => { setSearching(!searching); setQ('') }}><Ic n="search" /></button>
          {tab === 'friends' && <button aria-label="친구 추가" onClick={() => say('친구 추가는 아직 지원하지 않아요')}><Ic n="addFriend" /></button>}
          {tab === 'chats' && <button aria-label="새 채팅" onClick={() => setPicker(true)}><Ic n="newChat" /></button>}
          <button aria-label="설정" onClick={() => setGear(true)}><Gear size={23} strokeWidth={1.8} /></button>
        </div>
        {searching && (
          <div className="kakaotalk-search">
            <Ic n="search" s={16} />
            <input autoFocus placeholder={tab === 'friends' ? '이름, 상태 메시지 검색' : tab === 'chats' ? '채팅방 이름 검색' : '오픈채팅 검색'} value={q} onChange={e => setQ(e.target.value)} />
            {q && <button aria-label="지우기" onClick={() => setQ('')}><Ic n="close" s={14} w={2.2} /></button>}
          </div>
        )}
        <div className="kakaotalk-scroll">
          {tab === 'friends' && (
            <>
              {!q && (
                <div className="kakaotalk-row kakaotalk-me" onClick={() => setView({ t: 'edit' })}>
                  <Avatar name={st.me.name} src={st.me.photo} size={58} me />
                  <div className="kakaotalk-grow"><b>{st.me.name}</b><p>{st.me.status}</p></div>
                  {st.me.music && <MusicChip text={st.me.music} />}
                </div>
              )}
              {bday && (<><div className="kakaotalk-sec"><span>생일인 친구</span></div><FriendRow n={bday[0]} s="오늘 생일이에요" flag /></>)}
              {fav.length > 0 && (<><div className="kakaotalk-sec"><span>즐겨찾기 {fav.length}</span></div>{fav.map(([n, s]) => <FriendRow key={'f' + n} n={n} s={s} />)}</>)}
              <div className="kakaotalk-sec kakaotalk-fold" onClick={() => setSt({ ...st, collapsed: !st.collapsed })}>
                <span>친구 {friends.length}</span><Ic n={st.collapsed ? 'chevD' : 'chevU'} s={16} w={2} />
              </div>
              {!st.collapsed && friends.map(([n, s]) => <FriendRow key={n} n={n} s={s} />)}
              {friends.length === 0 && <div className="kakaotalk-empty">검색 결과가 없어요</div>}
            </>
          )}
          {tab === 'chats' && (
            <>
              {rooms.map(renderRoom)}
              {rooms.length === 0 && <div className="kakaotalk-empty">검색 결과가 없어요</div>}
            </>
          )}
          {tab === 'open' && (
            <>
              {openRooms.map(renderRoom)}
              {openRooms.length === 0 && <div className="kakaotalk-empty">검색 결과가 없어요</div>}
            </>
          )}
        </div>
        <div className="kakaotalk-tabs">
          {([['friends', '친구'], ['chats', '채팅'], ['open', '오픈채팅']] as const).map(([k, l]) => (
            <button key={k} aria-label={l} className={tab === k ? 'on' : ''} onClick={() => switchTab(k)}>
              <TabIc k={k} on={tab === k} />
              {k === 'chats' && totalUnread > 0 && <em>{totalUnread > 99 ? '99+' : totalUnread}</em>}
            </button>
          ))}
          <button aria-label="쇼핑" className="kakaotalk-disabled" aria-disabled="true"><TabIc k="shop" on={false} /></button>
          <button aria-label="더보기" className="kakaotalk-disabled" aria-disabled="true"><TabIc k="more" on={false} /></button>
        </div>
      </div>

      {view?.t === 'profile' && (() => {
        const f = FRIENDS.find(x => x[0] === view.id)
        if (!f) return null
        const soon = () => say('아직 지원하지 않아요')
        return (
          <div className="kakaotalk-page kakaotalk-profile">
            <div className="kakaotalk-ptop">
              <button className="kakaotalk-pround" aria-label="닫기" onClick={() => setView(null)}><Ic n="close" s={24} w={2} /></button>
              <div className="kakaotalk-ppill">
                <button aria-label="선물하기" onClick={soon}><Ic n="gift" s={24} /></button>
                <button aria-label="카카오페이" onClick={soon}><Ic n="won" s={26} /></button>
                <button aria-label="더보기" onClick={soon}><Ic n="dots" s={24} /></button>
              </div>
            </div>
            <div className="kakaotalk-scroll kakaotalk-pscroll">
              <div className="kakaotalk-phero">
                <Avatar name={f[0]} size={72} />
                <h2>{f[0]}</h2>
                {MUSIC[f[0]] && <MusicChip text={MUSIC[f[0]]} />}
                <div className="kakaotalk-pbar">
                  <button onClick={soon}><Ic n="phone" s={22} />통화</button>
                  <button onClick={soon}><Ic n="video" s={24} />페이스톡</button>
                </div>
              </div>
              <div className="kakaotalk-pgrid">
                <div className="kakaotalk-pin">
                  <div className="kakaotalk-pinhead"><PinSolid /></div>
                  <div className="kakaotalk-pinbody">
                    <div className="kakaotalk-pinrow">
                      <Avatar name={f[0]} size={16} />
                      <div><b>{f[0]}<i>3일</i></b><span className="kakaotalk-pinline" /><span className="kakaotalk-pinline s" /></div>
                    </div>
                  </div>
                </div>
                {Array.from({ length: 8 }, (_, k) => <Pic key={k} src={`https://picsum.photos/seed/kp${hash(f[0])}${k}/400/533`} className="kakaotalk-pcell" />)}
              </div>
            </div>
          </div>
        )
      })()}
      {view?.t === 'edit' && <EditProfile me={st.me} onSave={me => { setSt({ ...st, me }); setView(null) }} onBack={() => setView(null)} />}
      {room && <ChatRoom key={room.id} room={room} onBack={() => setView(null)} patch={f => patchRoom(room.id, f)} onLeave={() => { setSt(s => ({ ...s, rooms: s.rooms.filter(r => r.id !== room.id), openRooms: s.openRooms.filter(r => r.id !== room.id) })); setView(null) }} />}

      {gear && (
        <div className="kakaotalk-scrim" onClick={() => setGear(false)}>
          <div className="kakaotalk-pop top" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setGear(false); setView({ t: 'edit' }) }}><Ic n="edit" s={18} />프로필 편집</button>
            <button onClick={() => { setGear(false); close?.() }}><Ic n="leave" s={18} />카카오톡 닫기</button>
          </div>
        </div>
      )}
      {picker && (
        <div className="kakaotalk-dim sheet" onClick={() => setPicker(false)}>
          <div className="kakaotalk-sheet" onClick={e => e.stopPropagation()}>
            <div className="kakaotalk-sheethead"><b>대화 상대 선택</b><button aria-label="닫기" onClick={() => setPicker(false)}><Ic n="close" s={22} /></button></div>
            <div className="kakaotalk-scroll">
              {FRIENDS.map(([n, s]) => (
                <div key={n} className="kakaotalk-row" onClick={() => { setPicker(false); setTab('chats'); openDM(n) }}>
                  <Avatar name={n} size={40} /><div className="kakaotalk-grow"><b>{n}</b><p>{s}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {toast && <div className="kakaotalk-toast">{toast}</div>}
    </div>
  )
}

/* ───────── 프로필 편집 ───────── */
function EditProfile({ me, onSave, onBack }: { me: Me; onSave: (m: Me) => void; onBack: () => void }) {
  const [m, setM] = useState(me)
  const pick = (k: 'photo' | 'bg') => (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readFile(f, s => setM(x => ({ ...x, [k]: s }))); e.target.value = '' }
  return (
    <div className="kakaotalk-page kakaotalk-edit">
      <div className="kakaotalk-nav">
        <button aria-label="취소" onClick={onBack}><Ic n="close" /></button>
        <h1>프로필 편집</h1>
        <button className="kakaotalk-done" onClick={() => onSave(m)}>완료</button>
      </div>
      <div className="kakaotalk-scroll">
        <div className="kakaotalk-ecover" style={m.bg ? { backgroundImage: `url(${m.bg})` } : undefined}>
          <label className="kakaotalk-chip"><Ic n="image" s={16} />배경 변경<input type="file" accept="image/*" hidden onChange={pick('bg')} /></label>
        </div>
        <div className="kakaotalk-eavatar">
          <Avatar name={m.name} src={m.photo} size={92} me />
          <label className="kakaotalk-cam" aria-label="사진 변경"><Ic n="camera" s={16} w={2} /><input type="file" accept="image/*" hidden onChange={pick('photo')} /></label>
        </div>
        <div className="kakaotalk-fields">
          <label><span>이름</span><input value={m.name} maxLength={20} onChange={e => setM({ ...m, name: e.target.value })} /><em>{m.name.length}/20</em></label>
          <label><span>상태 메시지</span><input value={m.status} maxLength={60} onChange={e => setM({ ...m, status: e.target.value })} /><em>{m.status.length}/60</em></label>
          <label><span>프로필 뮤직</span><input value={m.music} placeholder="곡명 - 가수" onChange={e => setM({ ...m, music: e.target.value })} /></label>
        </div>
      </div>
    </div>
  )
}

/* ───────── 채팅방 ───────── */
function ChatRoom({ room, onBack, patch, onLeave }: { room: Room; onBack: () => void; patch: (f: (r: Room) => Room) => void; onLeave: () => void }) {
  const [text, setText] = useState('')
  const [menu, setMenu] = useState<Msg | null>(null)
  const [reply, setReply] = useState<Msg | null>(null)
  const [emo, setEmo] = useState(false)
  const [more, setMore] = useState(false)
  const [sq, setSq] = useState<string | null>(null)
  const [big, setBig] = useState<string | null>(null)
  const sc = useRef<HTMLDivElement>(null)
  const ta = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<number>(0)
  const kb = useKeyboard()
  useEffect(() => { const e = sc.current; if (e) e.scrollTop = e.scrollHeight }, [room.msgs.length, kb, emo, reply])
  useEffect(() => { const e = ta.current; if (e) { e.style.height = 'auto'; e.style.height = Math.min(e.scrollHeight, 100) + 'px' } }, [text])

  const send = (m: Partial<Msg>) => patch(r => ({ ...r, msgs: [...r.msgs, { id: Date.now(), who: 'me', t: Date.now(), reply: reply ? preview(reply) : undefined, ...m }] }))
  const submit = () => { const v = text.trim(); if (!v) return; send({ text: v }); setText(''); setReply(null) }
  const press = (m: Msg) => { clearTimeout(timer.current); timer.current = window.setTimeout(() => setMenu(m), 450) }
  const msgs = sq ? room.msgs.filter(m => m.text?.includes(sq)) : room.msgs

  return (
    <div className="kakaotalk-page kakaotalk-room" style={kb ? { bottom: kb, paddingBottom: 0 } : undefined}>
      <div className="kakaotalk-nav">
        <button aria-label="뒤로" onClick={onBack}><Ic n="back" s={26} w={2} /></button>
        <h1><span>{room.name}</span>{room.group && <i>{room.members.toLocaleString()}</i>}{room.muted && <span className="kakaotalk-ico"><Ic n="bellOff" s={14} w={2} /></span>}</h1>
        <button aria-label="검색" onClick={() => setSq(sq === null ? '' : null)}><Ic n="search" /></button>
        <button aria-label="메뉴" onClick={() => setMore(!more)}><Ic n="menu" /></button>
      </div>
      {sq !== null && (
        <div className="kakaotalk-search inroom">
          <Ic n="search" s={16} />
          <input autoFocus placeholder="대화 내용 검색" value={sq} onChange={e => setSq(e.target.value)} />
          <button aria-label="닫기" onClick={() => setSq(null)}><Ic n="close" s={14} w={2.2} /></button>
        </div>
      )}
      {more && (
        <div className="kakaotalk-scrim" onClick={() => setMore(false)}>
          <div className="kakaotalk-pop" onClick={e => e.stopPropagation()}>
            <button onClick={() => { patch(r => ({ ...r, muted: !r.muted })); setMore(false) }}><Ic n={room.muted ? 'bell' : 'bellOff'} s={18} />{room.muted ? '알림 켜기' : '알림 끄기'}</button>
            <button onClick={() => { patch(r => ({ ...r, pinned: !r.pinned })); setMore(false) }}><Ic n="pin" s={18} />{room.pinned ? '고정 해제' : '상단 고정'}</button>
            <button onClick={() => { const n = window.prompt('채팅방 이름', room.name); if (n?.trim()) patch(r => ({ ...r, name: n.trim() })); setMore(false) }}><Ic n="edit" s={18} />이름 변경</button>
            <button className="danger" onClick={() => { if (window.confirm('채팅방을 나가시겠어요?')) onLeave() }}><Ic n="leave" s={18} />채팅방 나가기</button>
          </div>
        </div>
      )}
      <div ref={sc} className="kakaotalk-scroll kakaotalk-chat" onClick={() => setEmo(false)}>
        {msgs.map((m, i) => {
          const prev = msgs[i - 1], next = msgs[i + 1]
          const mine = m.who === 'me'
          if (m.who === 'date') return <div key={m.id} className="kakaotalk-day">{dayLabel(m.t)}</div>
          if (m.who === 'gap') return <div key={m.id} className="kakaotalk-gap">{m.text}</div>
          const newDay = !prev || dayKey(prev.t) !== dayKey(m.t)
          const head = newDay || prev.who !== m.who || fmtT(prev.t) !== fmtT(m.t)
          const last = !next || dayKey(next.t) !== dayKey(m.t) || next.who !== m.who || fmtT(next.t) !== fmtT(m.t)
          const kind = m.img ? (isSticker(m.img) ? 'sticker' : 'photo') : ''
          const time = last && <span className="kakaotalk-time">{mine && i === msgs.length - 1 && !sq && <b>1</b>}{fmtT(m.t)}</span>
          return (
            <div key={m.id}>
              {newDay && <div className="kakaotalk-day">{dayLabel(m.t)}</div>}
              <div className={`kakaotalk-msg ${mine ? 'me' : ''} ${head ? 'head' : ''}`}>
                {!mine && <div className="kakaotalk-side">{head && <Avatar name={m.who} size={40} />}</div>}
                <div className="kakaotalk-body">
                  {!mine && head && <small className="kakaotalk-who">{m.who}</small>}
                  <div className="kakaotalk-line">
                    {mine && time}
                    <div className={`kakaotalk-bubble ${kind} ${head && !kind ? 'tail' : ''}`} onTouchStart={() => press(m)} onTouchEnd={() => clearTimeout(timer.current)} onTouchMove={() => clearTimeout(timer.current)} onContextMenu={e => { e.preventDefault(); setMenu(m) }}>
                      {m.reply && <div className="kakaotalk-quote"><Ic n="reply" s={12} w={2} /><span>{m.reply}</span></div>}
                      {m.img ? <img src={m.img} alt="" draggable={false} onClick={() => !isSticker(m.img) && setBig(m.img!)} /> : hl(m.text ?? '', sq)}
                    </div>
                    {!mine && time}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {msgs.length === 0 && sq && <div className="kakaotalk-empty light">검색 결과가 없어요</div>}
      </div>
      {reply && (
        <div className="kakaotalk-replybar">
          <Ic n="reply" s={16} w={2} />
          <div><b>{reply.who === 'me' ? '나' : reply.who}에게 답장</b><p>{preview(reply)}</p></div>
          <button aria-label="답장 취소" onClick={() => setReply(null)}><Ic n="close" s={18} /></button>
        </div>
      )}
      <div className="kakaotalk-input" style={kb ? { paddingBottom: 8 } : undefined}>
        <label className="kakaotalk-plus" aria-label="사진 첨부"><Ic n="plus" s={22} w={1.8} /><input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, img => send({ img })); e.target.value = '' }} /></label>
        <div className="kakaotalk-field">
          <textarea ref={ta} rows={1} value={text} placeholder="메시지 입력" onFocus={() => setEmo(false)} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }} />
          <button aria-label="이모티콘" className={emo ? 'on' : ''} onClick={() => setEmo(!emo)}><Ic n="smile" s={24} w={1.6} /></button>
        </div>
        <button aria-label="전송" className={`kakaotalk-send ${text.trim() ? 'on' : ''}`} onClick={submit}><Ic n="send" s={20} w={2.4} /></button>
      </div>
      {emo && (
        <div className="kakaotalk-emo">
          {STICKERS.map((_, i) => <button key={i} aria-label={`이모티콘 ${i + 1}`} onClick={() => send({ img: stickerUri(i) })}><img src={stickerUri(i)} alt="" draggable={false} /></button>)}
        </div>
      )}
      {menu && (
        <div className="kakaotalk-dim" onClick={() => setMenu(null)}>
          <div className="kakaotalk-menu" onClick={e => e.stopPropagation()}>
            <div className="kakaotalk-mprev">{preview(menu)}</div>
            {menu.text && <button onClick={() => { navigator.clipboard?.writeText(menu.text || '').catch(() => {}); setMenu(null) }}><Ic n="copy" s={19} />복사</button>}
            <button onClick={() => { setReply(menu); setMenu(null) }}><Ic n="reply" s={19} />답장</button>
            <button className="danger" onClick={() => { patch(r => ({ ...r, msgs: r.msgs.filter(x => x.id !== menu.id) })); setMenu(null) }}><Ic n="trash" s={19} />삭제</button>
          </div>
        </div>
      )}
      {big && (
        <div className="kakaotalk-viewer" onClick={() => setBig(null)}>
          <button aria-label="닫기" onClick={() => setBig(null)}><Ic n="close" s={26} w={2} /></button>
          <img src={big} alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
