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
const HJ_MSGS: Msg[] = [
  { id: 8001, who: '김홍중', text: '안녕하세요', t: new Date('2023-07-15T19:00:00+09:00').getTime() },
  { id: 8002, who: '김홍중', text: '어플에서 보고 연락드립니다', t: new Date('2023-07-15T19:00:00+09:00').getTime() },
  { id: 8003, who: 'me', text: '넵 지금 당장요?', t: new Date('2023-07-15T19:03:00+09:00').getTime() },
  { id: 8004, who: '김홍중', text: '가능하면요', t: new Date('2023-07-15T19:04:00+09:00').getTime() },
  { id: 8005, who: 'me', text: '주소 찍으세요', t: new Date('2023-07-15T19:05:00+09:00').getTime() },

  { id: 8010, who: '김홍중', text: '자주 볼 것 같은데', t: new Date('2023-07-22T20:10:00+09:00').getTime() },
  { id: 8011, who: '김홍중', text: '말 편하게 해도 돼요', t: new Date('2023-07-22T20:10:00+09:00').getTime() },
  { id: 8012, who: 'me', text: '넵ㅋㅋ', t: new Date('2023-07-22T20:13:00+09:00').getTime() },

  { id: 8020, who: '김홍중', text: '뭐해', t: new Date('2023-07-29T18:20:00+09:00').getTime() },
  { id: 8021, who: 'me', text: '일하지', t: new Date('2023-07-29T18:21:00+09:00').getTime() },
  { id: 8022, who: '김홍중', text: '무슨 일?', t: new Date('2023-07-29T18:22:00+09:00').getTime() },
  { id: 8023, who: 'me', text: '쿠팡 지금 퇴근중', t: new Date('2023-07-29T18:24:00+09:00').getTime() },
  { id: 8024, who: '김홍중', text: '멀쩡한 일도 하는구나', t: new Date('2023-07-29T18:25:00+09:00').getTime() },
  { id: 8025, who: 'me', text: '나를 뭘로보는거야;;', t: new Date('2023-07-29T18:26:00+09:00').getTime() },

  { id: 8030, who: 'date', t: new Date('2023-07-30T00:00:00+09:00').getTime() },
  { id: 8031, who: 'gap', text: ['•', '•', '•', '•'].join('\n'), t: new Date('2023-07-30T12:00:00+09:00').getTime() },

  { id: 8100, who: 'me', text: '너 아이돌이었냐?', t: new Date('2025-03-12T18:21:00+09:00').getTime() },
  { id: 8101, who: '김홍중', text: '몰랐어?', t: new Date('2025-03-12T18:23:00+09:00').getTime() },
  { id: 8102, who: 'me', text: '어', t: new Date('2025-03-12T18:24:00+09:00').getTime() },
  { id: 8103, who: 'me', text: '지하철 광고판에 너 있던데?', t: new Date('2025-03-12T18:24:00+09:00').getTime() },
  { id: 8104, who: '김홍중', text: '오랜만에 연락와서 한다는 말이 그거냐', t: new Date('2025-03-12T18:27:00+09:00').getTime() },
  { id: 8105, who: 'me', text: '그럼 무슨 말해', t: new Date('2025-03-12T18:29:00+09:00').getTime() },
  { id: 8106, who: '김홍중', text: '밥이나 한 번 먹자', t: new Date('2025-03-12T18:31:00+09:00').getTime() },

  { id: 8110, who: '김홍중', text: '바빠?', t: new Date('2025-03-12T18:31:00+09:00').getTime() },
  { id: 8111, who: 'me', text: 'ㄴㄴ', t: new Date('2025-03-22T20:16:00+09:00').getTime() },
  { id: 8112, who: 'me', text: '넌', t: new Date('2025-03-22T20:16:00+09:00').getTime() },
  { id: 8113, who: '김홍중', text: '조금 바쁘네', t: new Date('2025-03-22T20:19:00+09:00').getTime() },
  { id: 8114, who: '김홍중', text: '곧 컴백이라 그런가', t: new Date('2025-03-22T20:19:00+09:00').getTime() },
  { id: 8115, who: 'me', text: '힘내라', t: new Date('2025-03-22T20:22:00+09:00').getTime() },

  { id: 8120, who: 'date', t: new Date('2025-03-23T00:00:00+09:00').getTime() },
  { id: 8121, who: 'gap', text: ['•', '•', '•', '•'].join('\n'), t: new Date('2025-03-23T12:00:00+09:00').getTime() },

  { id: 8200, who: '김홍중', text: '잘 지내냐', t: new Date('2026-10-18T19:32:00+09:00').getTime() },
  { id: 8201, who: 'me', text: 'ㅇㅇ', t: new Date('2026-10-18T19:40:00+09:00').getTime() },
  { id: 8202, who: '김홍중', text: '요즘 뭐하고 살아', t: new Date('2026-10-18T19:42:00+09:00').getTime() },
  { id: 8203, who: 'me', text: '똑같지 뭐', t: new Date('2026-10-18T19:45:00+09:00').getTime() },
  { id: 8204, who: '김홍중', text: '밥이나 먹자', t: new Date('2026-10-18T19:47:00+09:00').getTime() },
  { id: 8205, who: 'me', text: '엉', t: new Date('2026-10-18T19:49:00+09:00').getTime() },

  { id: 9005, who: '김홍중', text: '잠깐 볼래', t: new Date('2026-11-08T20:10:00+09:00').getTime() },
  { id: 9006, who: '김홍중', text: '스케줄 지금 끝났어', t: new Date('2026-11-08T20:10:00+09:00').getTime() },
  { id: 9007, who: 'me', text: '어디로?', t: new Date('2026-11-08T20:13:00+09:00').getTime() },
  { id: 9008, who: '김홍중', text: 'XX모텔로 올래?', t: new Date('2026-11-08T20:14:00+09:00').getTime() },
  { id: 9009, who: 'me', text: '헐~', t: new Date('2026-11-08T20:15:00+09:00').getTime() },
  { id: 9010, who: 'me', text: '대스타가 이래도 되나 ㅋㅋ', t: new Date('2026-11-08T20:15:00+09:00').getTime() },
  { id: 9011, who: '김홍중', text: '오기싫음 말고', t: new Date('2026-11-08T20:17:00+09:00').getTime() },
  { id: 9012, who: 'me', text: '지금 출발', t: new Date('2026-11-08T20:18:00+09:00').getTime() },
]

const YH_MSGS = [
  { id: 9100, who: '정윤호', text: 'SY 오피스텔 302호예요', t: new Date('2026-07-08T19:02:00+09:00').getTime() },
  { id: 9101, who: '정윤호', text: '한시간에 20 맞죠', t: new Date('2026-07-08T19:02:00+09:00').getTime() },
  { id: 9102, who: 'me', text: 'ㅇㅇ 곧 가요', t: new Date('2026-07-08T19:05:00+09:00').getTime() },
  { id: 9103, who: '정윤호', text: '잘들어가셨어요?', t: new Date('2026-07-08T23:05:00+09:00').getTime() },
  { id: 9104, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-08T23:40:00+09:00').getTime() },
  { id: 9105, who: 'me', text: '다음에 또 필요하면 연락 ㄱ', t: new Date('2026-07-08T23:40:00+09:00').getTime() },

  { id: 9110, who: '정윤호', text: '오늘 돼요?', t: new Date('2026-07-12T21:10:00+09:00').getTime() },
  { id: 9111, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-12T21:40:00+09:00').getTime() },

  { id: 9120, who: '정윤호', text: '오늘?', t: new Date('2026-07-16T20:50:00+09:00').getTime() },
  { id: 9121, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-16T21:20:00+09:00').getTime() },

  { id: 9130, who: '정윤호', text: '오늘은?', t: new Date('2026-07-20T22:30:00+09:00').getTime() },
  { id: 9131, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-20T23:00:00+09:00').getTime() },

  { id: 9140, who: '정윤호', text: 'ㅇㄴ ㄷㅇ?', t: new Date('2026-07-25T19:15:00+09:00').getTime() },
  { id: 9141, who: 'me', text: 'ㅇㅇ', t: new Date('2026-07-25T19:50:00+09:00').getTime() },

  { id: 9150, who: '정윤호', text: '우리 사귀는 거 맞죠?', t: new Date('2026-07-29T20:50:00+09:00').getTime() },
  { id: 9151, who: 'me', text: '?', t: new Date('2026-07-29T20:51:00+09:00').getTime() },
  { id: 9152, who: 'me', text: 'ㄴㄴ', t: new Date('2026-07-29T20:51:00+09:00').getTime() },
  { id: 9153, who: '정윤호', text: '왜요?', t: new Date('2026-07-29T20:53:00+09:00').getTime() },
  { id: 9154, who: 'me', text: '고객이랑은 안사귐', t: new Date('2026-07-29T20:54:00+09:00').getTime() },
  { id: 9155, who: '정윤호', text: '고객 안하면 되잖아요', t: new Date('2026-07-29T20:55:00+09:00').getTime() },
  { id: 9156, who: '정윤호', text: '책임지세요', t: new Date('2026-07-29T20:55:00+09:00').getTime() },
  { id: 9157, who: '정윤호', text: '형이 저 이렇게 만들었잖아요', t: new Date('2026-07-29T20:55:00+09:00').getTime() },
  { id: 9158, who: 'me', text: '???', t: new Date('2026-07-29T20:58:00+09:00').getTime() },
  { id: 9159, who: '정윤호', text: '😡😡', t: new Date('2026-07-29T20:59:00+09:00').getTime() },

  { id: 9199, who: 'date', t: new Date('2026-08-01T00:00:00+09:00').getTime() },
  { id: 9200, who: 'gap', text: ['•', '•', '•', '•'].join('\n'), t: new Date('2026-08-02T23:00:00+09:00').getTime() },

  { id: 9300, who: '정윤호', text: '일어났어용?', t: new Date('2026-11-08T07:42:00+09:00').getTime() },
  { id: 9301, who: 'me', text: 'ㅇㅇ', t: new Date('2026-11-08T07:50:00+09:00').getTime() },
  { id: 9302, who: '정윤호', text: '오늘 추워용 따듯하게 입어야 돼용', t: new Date('2026-11-08T07:51:00+09:00').getTime() },
  { id: 9303, who: '정윤호', text: '아침 먹었어용?', t: new Date('2026-11-08T07:51:00+09:00').getTime() },
  { id: 9304, who: '정윤호', text: '저는 편의점 김밥 먹었어요 ㅠ 노맛', t: new Date('2026-11-08T07:51:00+09:00').getTime() },
  { id: 9305, who: 'me', text: '안 먹음', t: new Date('2026-11-08T08:40:00+09:00').getTime() },
  { id: 9306, who: 'me', text: '일 가야함', t: new Date('2026-11-08T08:40:00+09:00').getTime() },
  { id: 9307, who: '정윤호', text: '힘내여', t: new Date('2026-11-08T08:42:00+09:00').getTime() },

  { id: 9308, who: '정윤호', text: '점심 뭐 먹었어용? 사진 보내줘요', t: new Date('2026-11-08T08:42:00+09:00').getTime() },
  { id: 9309, who: 'me', text: '사진 안 찍음', t: new Date('2026-11-08T12:30:00+09:00').getTime() },
  { id: 9310, who: '정윤호', text: '그럼 말이라두 ㅠ', t: new Date('2026-11-08T12:31:00+09:00').getTime() },
  { id: 9311, who: 'me', text: '국밥', t: new Date('2026-11-08T12:32:00+09:00').getTime() },
  { id: 9312, who: '정윤호', text: '국밥 좋아하는구나!', t: new Date('2026-11-08T12:33:00+09:00').getTime() },
  { id: 9313, who: '정윤호', text: '다음에 같이 가용', t: new Date('2026-11-08T12:33:00+09:00').getTime() },

  { id: 9314, who: '정윤호', text: '오늘 몇 시에 끝나여?', t: new Date('2026-11-08T12:33:00+09:00').getTime() },
  { id: 9315, who: 'me', text: '9시', t: new Date('2026-11-08T18:20:00+09:00').getTime() },
  { id: 9316, who: '정윤호', text: '그럼 근처 편의점에서 기다릴게여', t: new Date('2026-11-08T18:21:00+09:00').getTime() },
  { id: 9317, who: 'me', text: 'ㄴㄴ 오지마', t: new Date('2026-11-08T18:23:00+09:00').getTime() },
  { id: 9318, who: '정윤호', text: '그래도 갈래요 ㅎ', t: new Date('2026-11-08T18:24:00+09:00').getTime() },
]

const WY_MSGS: Msg[] = [
  { id: 9401, who: '정우영', text: '님', t: new Date('2025-05-10T18:00:00+09:00').getTime() },
  { id: 9402, who: '정우영', text: '저랑 친구하실래요?', t: new Date('2025-05-10T18:00:00+09:00').getTime() },
  { id: 9403, who: 'me', text: '왜요?', t: new Date('2025-05-10T18:03:00+09:00').getTime() },
  { id: 9404, who: '정우영', text: '사실 제가 이쪽 친구가 없거든여', t: new Date('2025-05-10T18:05:00+09:00').getTime() },
  { id: 9405, who: '정우영', text: '어디서 만나야 될 지도 잘 모르겠고', t: new Date('2025-05-10T18:05:00+09:00').getTime() },
  { id: 9406, who: 'me', text: '고민좀', t: new Date('2025-05-10T18:09:00+09:00').getTime() },

  { id: 9410, who: '정우영', text: '저 신림동 사는데', t: new Date('2025-05-13T17:20:00+09:00').getTime() },
  { id: 9411, who: '정우영', text: '어디 사세요?', t: new Date('2025-05-13T17:20:00+09:00').getTime() },
  { id: 9412, who: 'me', text: '왜요?', t: new Date('2025-05-13T17:23:00+09:00').getTime() },
  { id: 9413, who: '정우영', text: '동네친구 ㅋㅋ', t: new Date('2025-05-13T17:24:00+09:00').getTime() },
  { id: 9414, who: 'me', text: '신림이요', t: new Date('2025-05-13T17:26:00+09:00').getTime() },
  { id: 9415, who: '정우영', text: '헐 완전 운명', t: new Date('2025-05-13T17:27:00+09:00').getTime() },
  { id: 9416, who: '정우영', text: '나오세요 ㄱㄱ 밥 사드림', t: new Date('2025-05-13T17:27:00+09:00').getTime() },

  { id: 9420, who: '정우영', text: '뭐함요', t: new Date('2025-05-24T22:10:00+09:00').getTime() },
  { id: 9421, who: 'me', text: '알바끝', t: new Date('2025-05-24T22:12:00+09:00').getTime() },
  { id: 9422, who: '정우영', text: '진짜 일? 아님 정신노동', t: new Date('2025-05-24T22:13:00+09:00').getTime() },
  { id: 9423, who: 'me', text: '정신노동', t: new Date('2025-05-24T22:15:00+09:00').getTime() },

  { id: 9430, who: '정우영', text: '우리 좀 잘맞는 거 같아요', t: new Date('2025-06-01T16:08:00+09:00').getTime() },
  { id: 9431, who: '정우영', text: 'ㅇㅈ?', t: new Date('2025-06-01T16:08:00+09:00').getTime() },
  { id: 9432, who: 'me', text: '?', t: new Date('2025-06-01T16:11:00+09:00').getTime() },
  { id: 9433, who: '정우영', text: '말편하게할게', t: new Date('2025-06-01T16:12:00+09:00').getTime() },
  { id: 9434, who: '정우영', text: '형 맞지?', t: new Date('2025-06-01T16:12:00+09:00').getTime() },
  { id: 9435, who: 'me', text: '어떻게 알아', t: new Date('2025-06-01T16:15:00+09:00').getTime() },
  { id: 9436, who: '정우영', text: '잘 때 지갑봄', t: new Date('2025-06-01T16:16:00+09:00').getTime() },
  { id: 9437, who: 'me', text: '연락하지마라', t: new Date('2025-06-01T16:18:00+09:00').getTime() },
  { id: 9438, who: '정우영', text: '이이잉ㅠㅠㅠ', t: new Date('2025-06-01T16:19:00+09:00').getTime() },

  { id: 9440, who: 'me', text: '저녁에 뭐함', t: new Date('2025-06-14T18:20:00+09:00').getTime() },
  { id: 9441, who: '정우영', text: '피방 갈건데', t: new Date('2025-06-14T18:22:00+09:00').getTime() },
  { id: 9442, who: '정우영', text: '올 거?', t: new Date('2025-06-14T18:22:00+09:00').getTime() },
  { id: 9443, who: 'me', text: 'ㅇㅇ 한시간 뒤에 감', t: new Date('2025-06-14T18:25:00+09:00').getTime() },

  { id: 9450, who: '정우영', text: '노래방 갈 사람 없는데 오늘 ㄱ?', t: new Date('2025-07-05T19:10:00+09:00').getTime() },
  { id: 9451, who: 'me', text: '일 끝나고', t: new Date('2025-07-05T19:12:00+09:00').getTime() },
  { id: 9452, who: '정우영', text: '넹', t: new Date('2025-07-05T19:13:00+09:00').getTime() },

  { id: 9460, who: 'date', t: new Date('2025-07-06T00:00:00+09:00').getTime() },
  { id: 9461, who: 'gap', text: ['•', '•', '•', '•'].join('\n'), t: new Date('2025-07-06T12:00:00+09:00').getTime() },

  { id: 9470, who: '정우영', text: '오늘 뭐함', t: new Date('2026-03-21T17:48:00+09:00').getTime() },
  { id: 9471, who: '정우영', text: '저녁에 한잔?', t: new Date('2026-03-21T17:48:00+09:00').getTime() },
  { id: 9472, who: 'me', text: '내일 일찍 일어나야 됨', t: new Date('2026-03-21T17:52:00+09:00').getTime() },
  { id: 9473, who: '정우영', text: '한 잔은 괜찬자너', t: new Date('2026-03-21T17:54:00+09:00').getTime() },
  { id: 9474, who: 'me', text: 'ㅇㅋ', t: new Date('2026-03-21T17:56:00+09:00').getTime() },

  { id: 9480, who: '정우영', text: '피방 갈 사람 구함', t: new Date('2026-08-08T15:21:00+09:00').getTime() },
  { id: 9481, who: 'me', text: '나 지금 집인데', t: new Date('2026-08-08T15:26:00+09:00').getTime() },
  { id: 9482, who: 'me', text: '좀 이따 갈게', t: new Date('2026-08-08T15:26:00+09:00').getTime() },
  { id: 9483, who: '정우영', text: '오케이 자리 맡아놓음', t: new Date('2026-08-08T15:28:00+09:00').getTime() },

  { id: 9490, who: '정우영', text: 'ㅁㅎㅁㅎ', t: new Date('2026-11-08T19:15:00+09:00').getTime() },
]

const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` }
const dayLabel = (t: number) => `${dayKey(t)} ${'일월화수목금토'[new Date(t).getDay()]}요일`
const listT = (t: number) => { const d = new Date(), x = new Date(t); return d.toDateString() === x.toDateString() ? fmtT(t) : `${x.getMonth() + 1}월 ${x.getDate()}일` }

/* 오픈채팅방별 시드 대화 (닉네임 기반) */
const OPEN_MSGS: [string, string][][] = [
  [['덕질러', '어제 새 무대 직캠 보셨어요?'], ['me', '아직요 어떤 영상이에요?'], ['직캠장인', '센터 파트 진짜 대박이에요'], ['덕질러', '링크 올려드릴게요 ㅋㅋ']],
  [['라떼러버', '성수 새로 생긴 카페 가보신 분?'], ['me', '저 지난주에 갔는데 크로플 맛있어요'], ['디저트헌터', '웨이팅 길던데 평일 추천해요'], ['라떼러버', '오 평일 오전에 가봐야겠다']],
  [['한강러너', '이번 주 일요일 7시 반포 집결입니다'], ['페이스메이커', '저는 5km 천천히 뛸게요'], ['me', '저도 참석할게요!'], ['한강러너', '좋아요 끝나고 같이 아침 먹어요']],
  [['정글러', '실버 듀오 구합니다 서폿 가능하신 분'], ['me', '저 서폿 가능해요 오늘 저녁 어때요?'], ['정글러', '좋아요 9시에 접속할게요'], ['탑솔러', '저도 끼면 안 될까요 ㅋㅋ']],
  [['새내기A', '교양 추천 좀 해주세요 ㅠㅠ'], ['복학생B', '출석 안 부르는 강의가 꿀이에요'], ['me', '심리학개론 과제 적고 시험 쉬워요'], ['새내기A', '감사합니다 바로 담을게요']],
  [['배낭여행자', '다음 달 후쿠오카 혼자 가요'], ['me', '숙소는 하카타역 근처가 편해요'], ['뚜벅이', '라멘집 줄 서는 곳 꼭 가보세요'], ['배낭여행자', '정보 감사합니다!']],
  [['맛잘알', '전주 가면 현지인 콩나물국밥집 추천해요'], ['me', '혹시 위치 알려주실 수 있어요?'], ['맛잘알', '객사 근처인데 지도에 올려둘게요'], ['먹방요정', '저도 지난달에 갔는데 진짜 맛있었어요']],
  [['3대500가자', '오늘 데드 140 성공했습니다'], ['me', '대박이네요 저는 아직 120이에요'], ['근육맨', '자세 먼저 잡고 중량 올리세요'], ['3대500가자', '맞아요 부상 조심하세요']],
  [['분당맘', '소아과 주말에 하는 곳 아시는 분 계세요?'], ['정자동맘', '정자역 쪽에 일요일도 하는 곳 있어요'], ['me', '저도 궁금했는데 감사합니다'], ['분당맘', '쪽지 드릴게요']],
  [['퇴근요정', '오늘도 야근 ㅠㅠ 다들 퇴근하셨나요'], ['me', '저는 방금 퇴근했어요'], ['야근러', '부럽네요 저는 아직 사무실이에요'], ['퇴근요정', '힘내요 우리!']],
  [['영화광', '이번에 개봉한 영화 보신 분 계세요?'], ['me', '어제 봤는데 결말이 좀 아쉬웠어요'], ['시네필', '저는 연출이 좋았어요'], ['영화광', '스포 없이 얘기해봐요 ㅋㅋ']],
  [['부산갈매기', '이번 주말 광안리 번개 하실 분'], ['me', '저 참석 가능해요! 몇 시예요?'], ['해운대사는사람', '저도요 저녁 6시 어떠세요'], ['부산갈매기', '좋아요 6시에 모여요']],
]
function seedOpen(): Room[] {
  const now = Date.now()
  return OPEN.map((o, i) => {
    let t = now - (i + 1) * 40 * 60e3 - OPEN_MSGS[i].length * 6 * 60e3
    const msgs = OPEN_MSGS[i].map(([who, text], k) => { t += (3 + ((i * 5 + k * 7) % 9)) * 60e3; return { id: 50000 + i * 100 + k, who, text, t } })
    return { id: 'o' + i, name: o[0], group: true, members: o[2], pinned: false, muted: false, unread: i % 3 === 0 ? i + 2 : 0, msgs, open: true, img: `https://picsum.photos/seed/ko${hash(o[0])}/160/160`, desc: o[3], tags: o[4] }
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
      return { ...saved, rooms, openRooms: Array.isArray(saved.openRooms) && saved.openRooms.every((r: any) => r && Array.isArray(r.msgs)) ? saved.openRooms : seeded.openRooms }
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
