import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Settings as Gear } from 'lucide-react'
import './KakaoTalk.css'

type Msg = { id: number; who: string; text?: string; img?: string; t: number; reply?: string }
type Room = { id: string; name: string; group: boolean; members: number; pinned: boolean; muted: boolean; unread: number; msgs: Msg[] }
type Me = { name: string; status: string; music: string; photo?: string; bg?: string }
type Store = { me: Me; rooms: Room[]; collapsed: boolean }

const KEY = 'kakaotalk-v2'

const FRIENDS: [string, string][] = [
  ['엄마', '밥은 먹었니?'], ['아빠', '필요한 거 있으면 연락해'], ['형', '집 들어올 때 연락해'],
  ['김홍중', '오늘 일정 끝났어'], ['정윤호', '형 오늘 시간 괜찮으세요?'], ['정우영', '야 뭐함 ㅋㅋ'],
  ['서나은', '이번 주 근무표 확인 부탁해요'], ['도윤', '오늘 탑 근무 들어가?'],
  ['민석', '주소 보내줘'], ['지훈', '오늘 방 비어 있어?'],
  ['고등학교 동창', '오랜만이다 잘 지내?'], ['동창 단톡', '다들 잘 지내지?'],
]
const MUSIC: Record<string, string> = {
  이서연: 'Love Dive - IVE', 박지호: 'Perfect Night - LE SSERAFIM', 정다은: 'Spicy - aespa', 조수빈: 'Super Shy - NewJeans',
  한소희: 'Ditto - NewJeans', 신예린: 'Drama - aespa', 문가은: 'Magnetic - ILLIT', 강현우: 'Run - BTS',
}

/* 사람마다 서로 다른 실사 프로필 사진 (randomuser.me). 로드 실패 시 벡터 실루엣으로 대체 */
const PHOTO: Record<string, string> = {
  김민준: 'men/32', 박지호: 'men/12', 강현우: 'men/45', 윤재민: 'men/22', 오승준: 'men/67', 권태양: 'men/54', 안도윤: 'men/8',
  류시우: 'men/75', 배준서: 'men/36', 남지후: 'men/61', 아빠: 'men/71', 동생: 'men/18',
  이서연: 'women/44', 최유진: 'women/26', 정다은: 'women/65', 조수빈: 'women/33', 임하늘: 'women/12', 한소희: 'women/90',
  서지안: 'women/5', 신예린: 'women/68', 황나연: 'women/21', 송채원: 'women/79', 문가은: 'women/52', 노은서: 'women/14',
  홍유나: 'women/38', 전민재: 'women/85', 고서윤: 'women/57', 엄마: 'women/82',
}
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const photoOf = (name: string) => {
  const p = PHOTO[name] ?? `${hash(name) % 2 ? 'men' : 'women'}/${(hash(name + 'x') % 40) + 50}`
  return `https://randomuser.me/api/portraits/${p}.jpg`
}
const bgOf = (name: string) => `https://picsum.photos/seed/kt${hash(name)}/800/1200`

const OPEN: readonly [string, string, number, string, string[]][] = [
  ['아이돌 직캠 수다방', '아이돌 / 팬덤', 8421, '무대 직캠 같이 보고 이야기해요', ['#직캠', '#팬덤']],
  ['카페 탐방러 모임', '맛집 / 카페', 3210, '서울 감성 카페 정보 공유', ['#카페', '#서울']],
  ['한강 러닝 크루', '운동', 1894, '매주 일요일 아침 한강 러닝', ['#러닝', '#한강']],
  ['롤 듀오 구해요', '취미 / 게임', 5602, '티어 상관없이 즐겜 유저 환영', ['#게임', '#듀오']],
  ['대학생 시간표 공유방', '대학생', 12033, '수강신청 팁과 강의 후기', ['#대학생', '#수강신청']],
  ['혼행 여행자 모임', '여행', 2740, '혼자 여행 다니는 사람들의 정보방', ['#혼행', '#여행']],
  ['맛집 지도 공유방', '맛집 / 카페', 6112, '전국 숨은 맛집을 모아요', ['#맛집', '#전국']],
  ['헬스 3대 500 도전', '운동', 4388, '운동 기록 인증하고 서로 응원', ['#헬스', '#인증']],
  ['분당 맘카페 수다', '지역 모임', 2209, '분당 지역 육아 정보 공유', ['#분당', '#육아']],
  ['퇴근 후 일상 수다', '일상 / 수다', 9150, '퇴근하고 편하게 수다 떨어요', ['#일상', '#수다']],
  ['영화 감상 토론방', '취미 / 게임', 1670, '개봉작 후기와 추천 이야기', ['#영화', '#후기']],
  ['부산 지역 친구 만들기', '지역 모임', 3507, '부산 사는 사람들의 번개 모임', ['#부산', '#번개']],
]

const ROOMS: { n: string; g: number; m: [string, string][] }[] = [
  { n: '김민준', g: 0, m: [['김민준', '야 이번 주말에 시간 돼?'], ['me', '토요일은 괜찮은데 왜?'], ['김민준', '새로 생긴 고깃집 가보려고. 예약 가능한지 전화해볼게'], ['me', '좋지 몇 시쯤 생각해?'], ['김민준', '6시쯤? 웨이팅 길다더라'], ['me', '그럼 5시 반에 가서 줄 서자'], ['김민준', '오케이 내가 먼저 도착하면 연락할게'], ['me', '고마워 ㅋㅋ 그럼 토요일에 보자']] },
  { n: '이서연', g: 0, m: [['me', '자기야 오늘 퇴근 몇 시에 해?'], ['이서연', '7시쯤 끝날 것 같아. 저녁 뭐 먹을까'], ['me', '오늘은 파스타 어때? 회사 앞에 새로 생겼대'], ['이서연', '좋아! 근데 나 오늘 좀 피곤해서 일찍 들어가고 싶어'], ['me', '그럼 밥만 먹고 바로 데려다줄게'], ['이서연', '고마워 사랑해'], ['me', '나도 사랑해. 이따 봐']] },
  { n: '엄마', g: 0, m: [['엄마', '아들 밥은 먹고 다니니?'], ['me', '네 먹었어요. 걱정 마세요'], ['엄마', '이번 주 일요일에 올 수 있어? 할머니 생신이야'], ['me', '아 맞다 일요일이었죠. 점심 전에 갈게요'], ['엄마', '그래 케이크는 아빠가 사오신대'], ['me', '그럼 저는 과일 좀 사 갈게요'], ['엄마', '고맙다 운전 조심해서 와']] },
  { n: '대학 동기 모임', g: 6, m: [['박지호', '다들 연말 모임 날짜 정하자'], ['최유진', '12월 셋째 주 금요일 어때?'], ['강현우', '나 그날 회식이라 힘들 듯'], ['me', '그럼 토요일로 바꾸면 어때?'], ['정다은', '토요일 좋아요! 장소는 강남 쪽?'], ['박지호', '강남은 비싸니까 건대 쪽으로 가자'], ['최유진', '건대 좋아. 내가 예약해둘게'], ['강현우', '토요일이면 나도 가능!'], ['me', '그럼 12월 20일 토요일 건대로 확정']] },
  { n: '팀 프로젝트방', g: 5, m: [['윤재민', '내일 발표 자료 최종본 올렸어요'], ['임하늘', '확인했습니다. 3페이지 수치만 수정해주세요'], ['me', '제가 바로 고칠게요'], ['윤재민', '발표는 누가 하죠?'], ['임하늘', '민철 님이 하시는 게 좋을 것 같아요'], ['me', '리허설은 오전 10시에 해요'], ['윤재민', '네 알겠습니다']] },
  { n: '한소희', g: 0, m: [['한소희', '필라테스 같이 등록할래?'], ['me', '얼마야? 체험 수업도 있어?'], ['한소희', '첫 수업은 무료래. 이번 주 목요일 저녁 가능?'], ['me', '목요일 7시 가능해'], ['한소희', '그럼 예약해둘게']] },
  { n: '가족방', g: 4, m: [['아빠', '이번 주말 날씨 좋다더라'], ['엄마', '그럼 할머니 댁에 같이 가요'], ['me', '저는 일요일 오전에 도착해요'], ['동생', '나는 알바 끝나고 저녁에 갈게'], ['아빠', '그래 운전 조심하고']] },
  { n: '조수빈', g: 0, m: [['조수빈', '제주도 항공권 알아봤어?'], ['me', '응 금요일 아침 비행기가 제일 싸더라'], ['조수빈', '숙소는 협재 쪽이 좋대'], ['me', '렌터카는 내가 예약할게'], ['조수빈', '완벽해 ㅋㅋ']] },
  { n: '러닝 크루', g: 12, m: [['강현우', '이번 일요일 한강 10km 달립니다'], ['신예린', '저는 5km만 뛸게요'], ['me', '저는 7시 집결 가능해요'], ['권태양', '끝나고 해장국 갑시다'], ['강현우', '좋아요 장소는 제가 정할게요']] },
  { n: '오승준', g: 0, m: [['오승준', '형 이번 주 스터디 오는 거 맞지?'], ['me', '응 당연하지. 자료는 준비했어'], ['오승준', '나 아직 3장 못 읽었어 ㅠㅠ'], ['me', '요약본 보내줄게']] },
  { n: '서지안', g: 0, m: [['서지안', '추천해준 책 다 읽었어'], ['me', '어땠어? 결말이 좀 의외지?'], ['서지안', '진짜 소름이었어. 다음 책도 추천해줘'], ['me', '이번엔 에세이 어때?']] },
  { n: '동네 이웃방', g: 18, m: [['황나연', '이번 주 분리수거 날 변경됐나요?'], ['안도윤', '화요일에서 수요일로 바뀌었어요'], ['송채원', '공지 올려주셔서 감사합니다'], ['me', '확인했습니다']] },
  { n: '스터디 모임', g: 7, m: [['류시우', '오늘 스터디 7시 맞나요?'], ['문가은', '네 도서관 2층에서 만나요'], ['me', '조금 늦을 수도 있어요'], ['류시우', '괜찮아요 천천히 오세요']] },
  { n: '배준서', g: 0, m: [['배준서', '퇴근하고 한잔 콜?'], ['me', '오늘은 힘들어 내일은?'], ['배준서', '내일 좋아 장소는 어디로?'], ['me', '회사 앞 포차 가자']] },
  { n: '남지후', g: 0, m: [['남지후', '어제 찍은 사진 보내줄게'], ['me', '빨리 보여줘 기대돼'], ['남지후', '노을 진짜 예쁘게 나왔어']] },
  { n: '고서윤', g: 0, m: [['고서윤', '주말 약속 시간 바뀌었어'], ['me', '몇 시로?'], ['고서윤', '3시에서 4시로!'], ['me', '알겠어 그때 보자']] },
]

const pad = (n: number) => String(n).padStart(2, '0')
const fmtT = (t: number) => { const d = new Date(t); const h = d.getHours(); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}` }
const YH_MSGS = [
  { id: 9100, who: '정윤호', text: 'SY 오피스텔 302호예요', t: new Date('2026-07-08T19:02:00+09:00').getTime() },
  { id: 9101, who: 'me', text: 'ㅇㅇ 곧 가요', t: new Date('2026-07-08T19:03:00+09:00').getTime() },
  { id: 9102, who: '정윤호', text: '잘들어가셨어요?', t: new Date('2026-07-08T23:05:00+09:00').getTime() },
  { id: 9103, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-08T23:40:00+09:00').getTime() },
  { id: 9104, who: 'me', text: '다음에 또 필요한 일 있으면 연락해요', t: new Date('2026-07-08T23:41:00+09:00').getTime() },
  { id: 9105, who: '정윤호', text: '오늘 돼요?', t: new Date('2026-07-12T21:10:00+09:00').getTime() },
  { id: 9106, who: '정윤호', text: '오늘은요?', t: new Date('2026-07-12T21:40:00+09:00').getTime() },
  { id: 9107, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-12T22:05:00+09:00').getTime() },
  { id: 9108, who: '정윤호', text: '오늘 돼요?', t: new Date('2026-07-16T20:50:00+09:00').getTime() },
  { id: 9109, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-16T21:20:00+09:00').getTime() },
  { id: 9110, who: '정윤호', text: '오늘 돼요?', t: new Date('2026-07-20T22:30:00+09:00').getTime() },
  { id: 9111, who: '정윤호', text: '오늘은요?', t: new Date('2026-07-20T22:31:00+09:00').getTime() },
  { id: 9112, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-20T23:00:00+09:00').getTime() },
  { id: 9113, who: '정윤호', text: '오늘 돼요?', t: new Date('2026-07-25T19:15:00+09:00').getTime() },
  { id: 9114, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-25T19:50:00+09:00').getTime() },
  { id: 9115, who: '정윤호', text: '오늘은요?', t: new Date('2026-07-29T21:00:00+09:00').getTime() },
  { id: 9116, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-29T21:40:00+09:00').getTime() },
  { id: 9200, who: 'gap', text: '•\n•\n•\n•', t: new Date('2026-08-02T23:00:00+09:00').getTime() },
  { id: 9300, who: '정윤호', text: '형 일어났어요?', t: new Date('2026-11-08T07:42:00+09:00').getTime() },
  { id: 9301, who: 'me', text: 'ㅇㅇ', t: new Date('2026-11-08T07:50:00+09:00').getTime() },
  { id: 9302, who: '정윤호', text: '오늘 날씨 추운데 따뜻하게 입고 다녀요', t: new Date('2026-11-08T07:51:00+09:00').getTime() },
  { id: 9303, who: '정윤호', text: '아침 먹었어요?', t: new Date('2026-11-08T08:20:00+09:00').getTime() },
  { id: 9304, who: '정윤호', text: '저는 편의점 김밥 먹었어요 ㅠ 맛없음', t: new Date('2026-11-08T08:21:00+09:00').getTime() },
  { id: 9305, who: 'me', text: '안 먹었음', t: new Date('2026-11-08T08:40:00+09:00').getTime() },
  { id: 9306, who: 'me', text: '알바 가야함', t: new Date('2026-11-08T08:41:00+09:00').getTime() },
  { id: 9307, who: '정윤호', text: '밥 챙겨 먹어요 제발', t: new Date('2026-11-08T08:42:00+09:00').getTime() },
  { id: 9308, who: '정윤호', text: '점심 뭐 드셨어요? 사진 보내줘요', t: new Date('2026-11-08T12:15:00+09:00').getTime() },
  { id: 9309, who: 'me', text: '사진 안 찍음', t: new Date('2026-11-08T12:30:00+09:00').getTime() },
  { id: 9310, who: '정윤호', text: '그럼 말로라도 해줘요', t: new Date('2026-11-08T12:31:00+09:00').getTime() },
  { id: 9311, who: 'me', text: '국밥', t: new Date('2026-11-08T12:32:00+09:00').getTime() },
  { id: 9312, who: '정윤호', text: '국밥 좋아하는구나 다음에 같이 가요', t: new Date('2026-11-08T12:33:00+09:00').getTime() },
  { id: 9313, who: '정윤호', text: '오늘 몇 시에 끝나요?', t: new Date('2026-11-08T15:05:00+09:00').getTime() },
  { id: 9314, who: 'me', text: '6시', t: new Date('2026-11-08T15:40:00+09:00').getTime() },
  { id: 9315, who: '정윤호', text: '그럼 6시 반에 근처 편의점에서 기다릴게요', t: new Date('2026-11-08T15:41:00+09:00').getTime() },
  { id: 9316, who: 'me', text: 'ㄴㄴ 안 와도 됨', t: new Date('2026-11-08T15:43:00+09:00').getTime() },
  { id: 9317, who: '정윤호', text: '알겠어요 그래도 갈게요 ㅎ', t: new Date('2026-11-08T15:44:00+09:00').getTime() },
  { id: 9318, who: '정윤호', text: '형 오늘 돼요?', t: new Date('2026-11-08T18:40:00+09:00').getTime() },
]
const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` }
const dayLabel = (t: number) => `${dayKey(t)} ${'일월화수목금토'[new Date(t).getDay()]}요일`
const listT = (t: number) => { const d = new Date(), x = new Date(t); return d.toDateString() === x.toDateString() ? fmtT(t) : `${x.getMonth() + 1}월 ${x.getDate()}일` }

function seed(): Store {
  const now = Date.now()
  const rooms: Room[] = ROOMS.map((r, i) => {
    let t = now - (i * 3 + 1) * 3600e3 * 5 - r.m.length * 25 * 60e3
    const msgs = r.m.map(([who, text], k) => { t += (8 + ((i * 7 + k * 13) % 40)) * 60e3; return { id: i * 100 + k, who, text, t } })
    return { id: 'r' + i, name: r.n, group: r.g > 0, members: r.g || 2, pinned: i < 2, muted: false, unread: i % 4 === 1 ? (i % 3) + 1 : 0, msgs }
  })
  return { me: { name: '박성화', status: '', music: '' }, rooms: [
    { id: 'r-family-mom', name: '엄마', group: false, members: 2, pinned: true, muted: false, unread: 0, msgs: [{ id: 9001, who: '엄마', text: '성화야 밥은 먹었니?', t: now - 3600000 }, { id: 9002, who: 'me', text: '응 먹었어. 걱정 마', t: now - 3500000 }] },
    { id: 'r-family-dad', name: '아빠', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: [{ id: 9003, who: '아빠', text: '차 조심하고 늦으면 연락해라', t: now - 86400000 }] },
    { id: 'r-bro', name: '형', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: [{ id: 9004, who: '형', text: '집에 택배 왔던데 네 거냐', t: now - 7200000 }] },
    { id: 'r-hj', name: '김홍중', group: false, members: 2, pinned: true, muted: false, unread: 1, msgs: [{ id: 9005, who: '김홍중', text: '오늘 촬영 끝났어. 너 알바 끝나면 연락해', t: now - 1800000 }] },
    { id: 'r-yh', name: '정윤호', group: false, members: 2, pinned: false, muted: false, unread: 0, msgs: YH_MSGS },
    { id: 'r-wy', name: '정우영', group: false, members: 2, pinned: false, muted: false, unread: 2, msgs: [{ id: 9007, who: '정우영', text: '야 오늘 뭐함 ㅋㅋ', t: now - 900000 }] },
    { id: 'r-casual', name: '탑알바 연락처', group: true, members: 5, pinned: false, muted: true, unread: 0, msgs: [{ id: 9008, who: '도윤', text: '오늘 방 주소 여기 맞죠?', t: now - 172800000 }, { id: 9009, who: 'me', text: 'ㅇㅇ 맞아요', t: now - 172700000 }] },
  ], collapsed: false }
}
function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && typeof s === 'object' && Array.isArray(s.rooms) && s.me && typeof s.me === 'object' && s.rooms.every((r: any) => r && Array.isArray(r.msgs))) return s
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
  const url = src ?? (me ? undefined : photoOf(name))
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
  const set = [...new Set(r.msgs.map(m => m.who).filter(w => w !== 'me'))]
  const off = hash(r.name) % FRIENDS.length
  for (let i = 0; i < FRIENDS.length && set.length < 4; i++) { const n = FRIENDS[(off + i) % FRIENDS.length][0]; if (!set.includes(n)) set.push(n) }
  return set.slice(0, 4)
}
function RoomAvatar({ room, size = 50 }: { room: Room; size?: number }) {
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

  const patchRoom = (id: string, f: (r: Room) => Room) => setSt(s => ({ ...s, rooms: s.rooms.map(r => (r.id === id ? f(r) : r)) }))
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

  const rooms = useMemo(() => st.rooms.filter(r => r.name.includes(q)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.msgs.at(-1)?.t ?? 0) - (a.msgs.at(-1)?.t ?? 0)), [st.rooms, q])
  const friends = FRIENDS.filter(([n, s]) => n.includes(q) || s.includes(q))
  const fav = friends.slice(0, 3)
  const bday = friends.find(f => f[0] === FRIENDS[4][0])
  const open = OPEN.filter(o => !q || o[0].includes(q) || o[3].includes(q) || o[4].some(t => t.includes(q)))
  const room = view?.t === 'room' ? st.rooms.find(r => r.id === view.id) : undefined
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
              {rooms.map(r => {
                const l = r.msgs.at(-1)
                return (
                  <div key={r.id} className="kakaotalk-row kakaotalk-chatrow" onClick={() => { patchRoom(r.id, x => ({ ...x, unread: 0 })); setView({ t: 'room', id: r.id }) }}>
                    <RoomAvatar room={r} />
                    <div className="kakaotalk-grow">
                      <div className="kakaotalk-nameline">
                        <b>{r.name}</b>
                        {r.group && <i>{r.members}</i>}
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
              })}
              {rooms.length === 0 && <div className="kakaotalk-empty">검색 결과가 없어요</div>}
            </>
          )}
          {tab === 'open' && (
            <>
              {['인기 오픈채팅', '추천 오픈채팅'].map((h, k) => {
                const list = open.slice(k * 6, k * 6 + 6)
                return list.length ? (
                  <div key={h}>
                    <div className="kakaotalk-sec"><span>{h}</span></div>
                    {list.map(o => (
                      <div key={o[0]} className="kakaotalk-row kakaotalk-static">
                        <div className="kakaotalk-open-img"><Pic src={`https://picsum.photos/seed/ko${hash(o[0])}/160/160`} className="kakaotalk-fill" /></div>
                        <div className="kakaotalk-grow"><b>{o[0]}</b><p>{o[3]}</p><small>{o[1]} · {o[2].toLocaleString()}명 · {o[4].join(' ')}</small></div>
                      </div>
                    ))}
                  </div>
                ) : null
              })}
              {open.length === 0 && <div className="kakaotalk-empty">검색 결과가 없어요</div>}
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
        return (
          <div className="kakaotalk-page kakaotalk-profile">
            <Pic src={bgOf(f[0])} className="kakaotalk-pbg" />
            <div className="kakaotalk-pshade" />
            <button className="kakaotalk-x" aria-label="닫기" onClick={() => setView(null)}><Ic n="close" s={26} w={2} /></button>
            <div className="kakaotalk-pcenter">
              <Avatar name={f[0]} size={104} />
              <h2>{f[0]}</h2><p>{f[1]}</p>
              {MUSIC[f[0]] && <MusicChip text={MUSIC[f[0]]} />}
            </div>
            <div className="kakaotalk-pactions">
              <button onClick={() => openDM(f[0])}><span><Ic n="chat" s={22} /></span>1:1 채팅</button>
            </div>
          </div>
        )
      })()}
      {view?.t === 'edit' && <EditProfile me={st.me} onSave={me => { setSt({ ...st, me }); setView(null) }} onBack={() => setView(null)} />}
      {room && <ChatRoom key={room.id} room={room} onBack={() => setView(null)} patch={f => patchRoom(room.id, f)} onLeave={() => { setSt(s => ({ ...s, rooms: s.rooms.filter(r => r.id !== room.id) })); setView(null) }} />}

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
        <h1><span>{room.name}</span>{room.group && <i>{room.members}</i>}{room.muted && <span className="kakaotalk-ico"><Ic n="bellOff" s={14} w={2} /></span>}</h1>
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
