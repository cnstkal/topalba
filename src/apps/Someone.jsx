import { useEffect, useRef, useState } from 'react'
import { DAYS, pad } from '../utils'

/* ───────── 질문 은행 [분류, 질문, 상대방(시뮬레이션) 답변] ───────── */
const QS = [
  ['연애', '우리가 처음 만난 날, 서로 어떤 첫인상이었어?', '조금 낯을 가리는데 웃는 모습이 편안해서 자꾸 눈이 갔어.'],
  ['일상', '오늘 하루 중 가장 좋았던 순간은 언제야?', '형이 잘잤냐고 물어봤을 때!'],
  ['취향', '요즘 자꾸 듣게 되는 노래가 있다면?', '형이 추천해준 곡'],
  ['추억', '우리가 함께한 여행 중 가장 기억에 남는 곳은?', '아직 못갔당 ㅠ'],
  ['가치관', '연애에서 가장 중요하다고 생각하는 건 뭐야?', '솔직함'],
  ['연애', '나한테 가장 고마웠던 순간은 언제야?', '차단안한거 👉👈'],
  ['일상', '아침에 눈 떴을 때 제일 먼저 드는 생각은?', '형 보구싶다'],
  ['취향', '가장 좋아하는 음식과 싫어하는 음식은?', '아부라소바! 싫어하는 건 없어'],
  ['추억', '어릴 때 가장 좋아했던 놀이나 장난감은?', '인형 놀이랑 동네 놀이터에서 하던 술래잡기.'],
  ['가치관', '10년 뒤 우리는 어떤 모습이면 좋겠어?', '부부'],
  ['연애', '서로에게 처음 설렜던 순간이 기억나?', '꺼지라고 쌍욕했을 때'],
  ['일상', '쉬는 날 가장 하고 싶은 일은 뭐야?', '형이랑 데이트'],
  ['취향', '비 오는 날이 좋아, 맑은 날이 좋아? 왜?', '맑은 날! 나가서 데이트 할 수 있어'],
  ['추억', '요즘 문득 떠오르는 어릴 적 기억이 있어?', '아끼는 장난감을 잃어버려서 엄청 울었어'],
  ['가치관', '돈과 시간 중에 어느 쪽이 더 소중해?', '시간 추억은 돈으로 환산할 수 없어'],
  ['연애', '우리 둘만 아는 작은 습관이나 별명이 있다면?', '떵화형'],
  ['일상', '스트레스 받을 때 나만의 해소법이 있어?', '맛있는 거 먹기!'],
  ['취향', '몇 번이고 다시 보고 싶은 영화나 드라마는?', '스파이더맨'],
  ['추억', '우리 첫 데이트는 어땠는지 지금 떠올려 볼까?', '첫눈에 반했어'],
  ['가치관', '싸웠을 때 어떻게 화해하고 싶어?', '안아줬으면 좋겠어..'],
  ['연애', '서로의 첫인상은 어땠어?', '엄청 잘생겼다!'],
  ['일상', '하루 중 가장 좋아하는 시간대는 언제야?', '해 지기 직전, 하늘이 노랗게 물들 때.'],
  ['취향', '가보고 싶은 여행지를 딱 한 곳만 꼽는다면?', '조용한 바다가 보이는 작은 마을.'],
  ['추억', '학창 시절 가장 기억에 남는 순간은?', '친구들이랑 몰래 빠져나와 먹었던 떡볶이.'],
  ['가치관', '행복은 어떤 상태라고 생각해?', '별일 없는 하루를 편안하게 보내는 것.'],
  ['연애', '지금 나에게 해 주고 싶은 말 한마디는?', '오늘도 고생 많았어. 내가 옆에 있을게.'],
  ['일상', '요즘 가장 신경 쓰이는 고민이 있다면?', '해야 할 일이 많아서 하나씩 정리하는 중이야.'],
  ['취향', '우리가 같이 해 보고 싶은 취미가 있다면?', '도자기 공방에서 서로 컵 만들어 주기.'],
  ['추억', '올해 가장 잘한 일을 하나만 꼽는다면?', '나를 좀 더 챙기기 시작한 거.'],
  ['가치관', '내가 절대 양보하고 싶지 않은 건 뭐야?', '내 사람들한테 진심인 마음.'],
  ['연애', '둘이서 데이트 코스를 짠다면 어떻게 채우고 싶어?', '맛있는 점심, 산책, 카페, 저녁은 집밥 같은 곳.'],
  ['일상', '오늘 먹은 것 중 가장 맛있었던 건 뭐야?', '저녁에 먹은 따뜻한 국수. 속이 풀렸어.'],
  ['취향', '좋아하는 계절과 그 이유는?', '가을. 공기가 선선해서 마음도 차분해져.'],
  ['추억', '내 인생의 한 장면을 고른다면 어떤 순간이야?', '졸업식 날 가족들이 다 모여서 찍은 사진.'],
  ['가치관', '어른이 된다는 건 어떤 거라고 생각해?', '내 감정을 스스로 달랠 줄 아는 것.'],
  ['연애', '우리 사이에서 제일 자랑하고 싶은 점은?', '말 안 해도 눈치채고 챙겨 주는 거.'],
  ['일상', '오늘의 나에게 칭찬 한마디를 해 준다면?', '귀찮아도 끝까지 해냈네, 잘했어.'],
  ['취향', '나만 알고 싶은 장소가 있다면 어디야?', '집 근처 골목 끝에 있는 조용한 공원.'],
  ['추억', '같이 찍은 사진 중 제일 좋아하는 한 장은?', '둘 다 웃음이 터진 순간에 찍힌 사진.'],
  ['가치관', '앞으로 함께 지키고 싶은 약속이 있다면?', '서운한 건 쌓아 두지 않고 바로 말하기.'],
  ['일상', '요즘 하루 중 가장 자주 확인하는 건 뭐야?', '습관처럼 휴대폰부터 확인하게 돼.'],
  ['취향', '편의점에 들르면 꼭 사는 간식이 있어?', '새로 나온 과자 있으면 일단 한 번은 먹어 봐.'],
  ['추억', '어릴 때 별명 중 아직도 기억나는 게 있어?', '친구들이 장난처럼 부르던 별명이 하나 있어.'],
  ['연애', '상대방에게 은근히 바라는 사소한 행동은?', '별거 아니어도 먼저 오늘 뭐 했는지 물어봐 주면 좋아.'],
  ['일상', '갑자기 하루가 통째로 비면 뭐 하고 싶어?', '늦게 일어나서 맛있는 거 먹고 아무것도 안 하고 싶어.'],
  ['취향', '전화와 메시지 중 어떤 연락이 더 편해?', '급한 얘기는 전화, 평소에는 메시지가 편해.'],
  ['가치관', '친구와 연인 사이에 가장 큰 차이는 뭐라고 생각해?', '서로에게 더 솔직해지고 책임감도 생기는 것 같아.'],
  ['추억', '최근에 괜히 웃음이 났던 순간은?', '별말 아닌데 서로 타이밍이 맞아서 한참 웃었어.'],
  ['연애', '상대방이 무심코 해 준 말 중 기억에 남는 말은?', '내가 했던 말을 기억하고 다시 물어봐 줬던 게 좋았어.'],
  ['일상', '집에 돌아오면 가장 먼저 하는 일은?', '가방 내려놓고 편한 옷으로 갈아입어.'],
  ['취향', '여행을 간다면 계획형과 즉흥형 중 어느 쪽이야?', '큰 일정만 정해 두고 나머지는 현장에서 정하는 편이야.'],
  ['가치관', '혼자만의 시간이 꼭 필요하다고 생각해?', '응, 혼자 정리하는 시간이 있어야 다른 사람과도 잘 지낼 수 있어.'],
  ['추억', '둘이 같이 먹었던 음식 중 다시 먹고 싶은 건?', '그날 별생각 없이 들어갔던 식당의 메뉴가 생각나.'],
  ['연애', '서로 기분이 안 좋을 때 어떻게 해 주면 좋겠어?', '억지로 풀려고 하기보다 옆에 있어 주고 기다려 줬으면 해.'],
  ['일상', '요즘 가장 자주 하는 소비는 뭐야?', '커피나 간식처럼 작게 자주 사는 것 같아.'],
  ['취향', '좋아하는 날씨를 하나만 고른다면?', '햇빛은 있지만 바람이 선선하게 부는 날.'],
  ['가치관', '누군가를 믿게 되는 순간은 언제야?', '말보다 행동이 꾸준히 같을 때 믿음이 생겨.'],
  ['추억', '사진으로 남겨 두고 싶은 평범한 순간은?', '특별한 날보다 같이 밥 먹고 웃는 순간을 남기고 싶어.'],
  ['연애', '우리 사이에서 조금 더 자주 했으면 하는 건?', '바쁘더라도 하루에 한 번은 서로 안부를 나누면 좋겠어.'],
  ['일상', '요즘 가장 자주 들르는 곳은 어디야?', '집 근처 편의점이랑 자주 가는 카페 정도야.'],
  ['취향', '하루 중 휴대폰을 가장 많이 보는 시간은?', '자기 전 침대에 누워 있을 때 제일 많이 보는 것 같아.'],
  ['추억', '최근에 오래 기억하고 싶은 하루가 있었어?', '별일 없이 같이 밥 먹고 돌아다녔던 날이 오히려 기억에 남아.'],
  ['연애', '내가 무심코 해도 기분 좋아지는 행동은?', '내 얘기를 기억해 뒀다가 나중에 먼저 물어봐 주는 거.'],
  ['가치관', '친해지는 데 시간이 오래 걸리는 편이야?', '처음에는 조용한데 몇 번 만나면 편해지는 편이야.'],
  ['일상', '요즘 가장 기다려지는 일정은 뭐야?', '일 끝나고 아무 약속 없이 쉬는 날이 제일 기다려져.'],
  ['취향', '카페에 가면 주로 어떤 메뉴를 골라?', '늘 마시던 메뉴를 고르거나 신메뉴가 있으면 한 번 도전해.'],
  ['추억', '어릴 때 유난히 좋아했던 장소가 있어?', '동네 문구점이랑 친구 집 앞 놀이터가 생각나.'],
  ['연애', '같이 있을 때 가장 편하다고 느끼는 순간은?', '굳이 대화를 이어 가지 않아도 어색하지 않을 때.'],
  ['일상', '최근에 새로 생긴 사소한 습관이 있어?', '집에 오면 씻기 전에 냉장고부터 열어 봐.'],
  ['취향', '좋아하는 향이나 냄새가 있다면?', '막 세탁한 옷이나 비 온 뒤 바깥 공기 냄새가 좋아.'],
  ['가치관', '약속 시간보다 일찍 도착하는 편이야?', '늦는 건 싫어서 보통 조금 일찍 도착해.'],
  ['추억', '지금도 가끔 연락하는 오래된 친구가 있어?', '자주는 아니어도 생각날 때 안부를 주고받는 친구가 있어.'],
  ['연애', '둘이 함께 있을 때 굳이 하지 않아도 되는 건?', '계속 뭘 해야 한다는 생각. 그냥 같이 있어도 충분해.'],
  ['일상', '요즘 하루를 마무리하는 방식은?', '씻고 침대에 누워 영상 조금 보다가 잠들어.'],
  ['취향', '여행에서 숙소와 먹거리 중 더 중요하게 보는 건?', '먹거리. 맛있는 걸 먹으면 여행 기억이 더 좋아져.'],
  ['가치관', '다른 사람에게 꼭 지키려고 하는 예의가 있어?', '상대가 싫다고 한 건 가볍게 넘기지 않는 거.'],
  ['추억', '사진첩에서 가장 자주 다시 보는 사진은?', '특별한 날보다 친구들이랑 장난치며 찍은 사진이야.'],
  ['연애', '서로 바쁜 날에는 어떻게 연락하는 게 좋아?', '짧게라도 지금 뭐 하는지만 알려 주면 마음이 놓여.'],
  ['일상', '오늘 하루를 색깔로 표현하면 무슨 색이야?', '조금 흐린 회색인데 저녁엔 괜찮아진 느낌이야.'],
]

/* ───────── 날짜 유틸 (로컬 날짜 키: YYYY-MM-DD) ───────── */
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5)
const addDays = (k, n) => {
  const d = parse(k)
  d.setDate(d.getDate() + n)
  return dk(d)
}
const label = (k) => {
  const d = parse(k)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}

/* ───────── 저장소 (localStorage, 다른 앱 데이터와 분리) ───────── */
const LS = 'someone-app-v1'
/* Q105~Q124에 입력된 성화 답변. 기존 사용자가 직접 저장한 답변은 유지 */
const SEED_ANS = {
  '2026-10-20': { qi: 1, text: '없어', at: 0 },
  '2026-10-22': { qi: 3, text: 'ㅁㄹ', at: 0 },
  '2026-10-24': { qi: 5, text: '없음', at: 0 },
  '2026-10-25': { qi: 6, text: '죽고싶다', at: 0 },
  '2026-10-28': { qi: 9, text: '남남', at: 0 },
  '2026-10-29': { qi: 10, text: '없음', at: 0 },
  '2026-10-30': { qi: 11, text: '죽기', at: 0 },
  '2026-11-02': { qi: 14, text: '돈', at: 0 },
  '2026-11-03': { qi: 15, text: '스토커', at: 0 },
  '2026-11-04': { qi: 16, text: '섹스', at: 0 },
  '2026-11-07': { qi: 19, text: '헤어짐', at: 0 },
  '2026-11-08': { qi: 20, text: '예쁘게 생겼다', at: 0 },
}

const load = () => {
  const base = { me: '성화', pt: '윤호', start: '2026-07-08', first: '2026-10-19', meImg: '', ptImg: '', ans: SEED_ANS }
  try {
    const r = JSON.parse(localStorage.getItem(LS))
    if (r && typeof r === 'object') {
      const saved = { ...base, ...r, first: '2026-10-19', start: '2026-07-08', ans: r.ans && typeof r.ans === 'object' ? { ...SEED_ANS, ...r.ans } : SEED_ANS }
      // 이전 기본 프로필 값만 새 설정으로 마이그레이션하고, 직접 바꾼 값은 유지
      if (!r.me || r.me === '나') saved.me = '성화'
      if (!r.pt || r.pt === '하늘') saved.pt = '윤호'
      saved.start = '2026-07-08'
      return saved
    }
  } catch (e) {
    /* 손상된 데이터는 기본값 사용 */
  }
  return base
}

/* ───────── 시뮬레이션: 상대방 답변 여부 (날짜 기반 고정값) ───────── */
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const PT_DONE_DATES = new Set(['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
const ptDone = (date, today) => PT_DONE_DATES.has(date) || (date === today ? hash(date) % 3 !== 0 : hash(date) % 5 !== 0)

/* ───────── 반려몽 성장 단계 ───────── */
const STEPS = [1, 3, 7, 14]

/* ───────── 아이콘 (손그림 느낌: 둥근 선 + 살짝 흔들린 획) ───────── */
const Ic = ({ children, size = 26, w = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const ICON = {
  home: <Ic><path d="M3.6 11.2c2.6-2.2 5.6-4.9 8.4-7.4 2.7 2.5 5.7 5.2 8.4 7.4M5.6 10.4c-.2 3.3-.1 6.6.2 9.1 4.1.3 8.3.3 12.4 0 .3-2.5.4-5.8.2-9.1M10 19.4c-.1-2.1 0-3.7.1-4.6h3.8c.1.9.2 2.5.1 4.6" /></Ic>,
  list: <Ic><path d="M5.2 4.4c4.5-.3 9.1-.3 13.6 0 .3 5.1.3 10.2 0 15.2-4.5.3-9.1.3-13.6 0-.3-5-.3-10.1 0-15.2zM8.6 9c2.2-.2 4.5-.2 6.8 0M8.6 12.4c2.2-.2 4.5-.2 6.8 0M8.6 15.8c1.4-.2 2.8-.2 4.2 0" /></Ic>,
  record: <Ic><path d="M4.4 6.2c5-.9 7 .1 7.6 1.4.6-1.3 2.6-2.3 7.6-1.4.3 4.5.3 8.6 0 12.2-5-.7-7 .2-7.6 1.2-.6-1-2.6-1.9-7.6-1.2-.3-3.6-.3-7.7 0-12.2zM12 7.6v12" /></Ic>,
  couple: <Ic><path d="M8.2 18.6C4.9 16.2 3 13.9 3 11.6 3 9.6 4.4 8.2 6.1 8.2c1 0 1.7.5 2.1 1.2.4-.7 1.1-1.2 2.1-1.2 1.7 0 3.1 1.4 3.1 3.4 0 2.3-1.9 4.6-5.2 7zM16.4 15.6c-1.9-1.3-3-2.7-3-4 0-1.1.8-2 1.8-2 .6 0 1 .3 1.2.7.2-.4.7-.7 1.2-.7 1 0 1.8.9 1.8 2 0 1.3-1.1 2.7-3 4z" /></Ic>,
  bell: <Ic size={23}><path d="M6.4 16.8c1.1-1 1.5-2.4 1.5-4.4 0-2.6 1.4-4.5 4.1-4.5s4.1 1.9 4.1 4.5c0 2 .4 3.4 1.5 4.4-3.8.4-7.4.4-11.2 0zM10.4 19.4c.9.9 2.3.9 3.2 0M12 5.6V7.9" /></Ic>,
  gear: <Ic size={23}><circle cx="12" cy="12" r="3" /><path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" /></Ic>,
  back: <Ic size={22} w={2}><path d="M14.6 5.4 8 12l6.6 6.6" /></Ic>,
  pen: <Ic size={18}><path d="M4.6 19.4l.8-4.1L15.9 4.8c.8-.8 2-.8 2.8 0l.5.5c.8.8.8 2 0 2.8L8.7 18.6l-4.1.8zM13.8 6.9l3.3 3.3" /></Ic>,
  stone: <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><path d="M5 17c0-5 4-9 9-9s9 4 9 9c0 3-3 5-9 5s-9-2-9-5z" fill="#e9e3d6" stroke="#b9ad98" strokeWidth="1.4" /><circle cx="11" cy="15" r=".9" fill="#8a7d68" /><circle cx="16" cy="15" r=".9" fill="#8a7d68" /><path d="M12 17.5q1.5 1 3 0" stroke="#8a7d68" strokeWidth="1" strokeLinecap="round" /></svg>,
  roller: <Ic size={24}><path d="M6 4.5h12c.8 0 1.2.4 1.2 1.2v3.1c0 .8-.4 1.2-1.2 1.2H6c-.8 0-1.2-.4-1.2-1.2V5.7c0-.8.4-1.2 1.2-1.2zM12 10v3.2M9 13.2h6v2H9zM10.5 15.2v5h3v-5" /></Ic>,
  cal: <Ic size={24}><path d="M5 6.5h14v13H5zM5 10.5h14M9 4.5v3M15 4.5v3" /></Ic>,
  check: <Ic size={24} w={2}><path d="M5 12.8l4.6 4.6L19 7.6" /></Ic>,
  mail: <svg width="38" height="30" viewBox="0 0 38 30" fill="none" stroke="#c9b48e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M3 5h32v20H3zM3 6l16 11L35 6" fill="#f6efe0" /></svg>,
  heart: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.6C5.6 16.2 3 12.9 3 9.7 3 7.2 4.9 5.4 7.2 5.4c1.9 0 3.7 1.1 4.8 3 1.1-1.9 2.9-3 4.8-3C19.1 5.4 21 7.2 21 9.7c0 3.2-2.6 6.5-9 10.9z" /></svg>,
}

/* ───────── 반려몽 (달걀 캐릭터) ───────── */
function Egg({ stage, happy }) {
  const L = '#a08b6e'
  return (
    <svg className="sm-egg-svg" viewBox="0 0 120 140" width="120" height="140">
      <ellipse cx="60" cy="126" rx="30" ry="6" fill="#d8d3c8" opacity=".85" />
      <path d="M60 8C84 8 98 48 98 80c0 28-18 42-38 42S22 108 22 80C22 48 36 8 60 8z" fill="#fff" stroke={L} strokeWidth="3" strokeLinejoin="round" />
      {stage >= 1 && <path d="M42 24l8 9-6 6 8 7" fill="none" stroke={L} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {stage >= 2 && <path d="M80 30l-6 8 8 5" fill="none" stroke={L} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {happy ? (
        <path d="M42 84q4-5 8 0M70 84q4-5 8 0M54 92q6 6 12 0" fill="none" stroke={L} strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <g>
          <g className="sm-blink" fill={L}><circle cx="47" cy="84" r="2.3" /><circle cx="73" cy="84" r="2.3" /></g>
          <path d="M56 92q4 2.500 8 0" fill="none" stroke={L} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

/* ───────── 아바타 ───────── */
function Avatar({ img, who, size = 52 }) {
  const bg = who === 'me' ? '#f9dcc8' : '#f4cdd0'
  return (
    <span className="sm-av" style={{ width: size, height: size, background: bg }}>
      {img ? (
        <img src={img} alt="" />
      ) : (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <circle cx="20" cy="17" r="7" fill="#fff6ea" stroke="#7a5a48" strokeWidth="1.6" />
          <path d="M6 38c1-9 7-12 14-12s13 3 14 12z" fill="#fff6ea" stroke="#7a5a48" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="17.5" cy="17" r="1" fill="#7a5a48" />
          <circle cx="22.5" cy="17" r="1" fill="#7a5a48" />
        </svg>
      )}
    </span>
  )
}

/* ───────── 메인 ───────── */
export default function Someone() {
  const [s, setS] = useState(load)
  const [today, setToday] = useState(() => dk(new Date()))
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null) // {t:'edit'|'detail', date}
  const [toast, setToast] = useState('')
  const [bell, setBell] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(s))
    } catch (e) {
      /* 저장 공간 부족 등은 무시 */
    }
  }, [s])
  useEffect(() => {
    const id = setInterval(() => setToday(dk(new Date())), 30000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [tab, view])
  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(id)
  }, [toast])

  /* 날짜 → 질문 (저장된 답변은 질문 번호를 함께 보관해 덮어써지지 않음) */
  const qOf = (date) => {
    const saved = s.ans[date]
    const n = diff(date, s.first) + 104
    if (date > today || n < 104 || n > 124) return null
    // Q124는 첫인상 질문으로 고정해 저장된 qi나 질문 배열 순서와 무관하게 유지
    if (n === 124) return { n, qi: 20 }
    if (saved) return { n, qi: saved.qi }
    return { n, qi: (n - 104) % QS.length }
  }
  const mine = (date) => (s.ans[date] && s.ans[date].text ? s.ans[date] : null)
  const days = Array.from({ length: Math.max(0, Math.min(21, diff(today, s.first) + 1)) }, (_, i) => addDays(s.first, i))
  const allDates = [...new Set([...days, ...Object.keys(s.ans)])].filter((d) => d <= today).sort()
  const count = Object.keys(s.ans).filter((d) => s.ans[d].text).length
  const stage = STEPS.filter((n) => count >= n).length
  const dday = 124

  const save = (date, text) => {
    const q = qOf(date)
    if (!q) return
    setS((p) => ({ ...p, ans: { ...p.ans, [date]: { qi: q.qi, text: text.trim(), at: Date.now() } } }))
    setToast('답변을 저장했어요')
    setView({ t: 'detail', date })
  }

  const ctx = { s, setS, today, qOf, mine, allDates, count, stage, dday, setView, setTab, setToast }
  const TABS = [['home', '홈'], ['list', '질문'], ['record', '기록'], ['couple', '커플']]

  let body
  if (view && view.t === 'edit') body = <Edit {...ctx} date={view.date} onSave={save} onBack={() => setView(null)} />
  else if (view && view.t === 'detail') body = <Detail {...ctx} date={view.date} onBack={() => setView(null)} />
  else {
    const home = tab === 'home'
    const TITLE = { list: 'List', record: 'Diary', couple: 'Couple' }
    body = (
      <>
        <div className="sm-top">
          {home ? (
            <>
              <span className="sm-coin">{ICON.stone}<b>{count}</b></span>
              <div className="sm-logo">SumOne</div>
              <div className="sm-top-r">
                <button aria-label="알림" onClick={() => setBell(!bell)}>
                  {ICON.bell}
                  {!mine(today) && <i className="sm-dot" />}
                </button>
                <button aria-label="설정" onClick={() => setTab('couple')}>{ICON.roller}</button>
              </div>
            </>
          ) : (
            <>
              <span />
              <div className="sm-logo t">{TITLE[tab]}</div>
              <div className="sm-top-r">
                <button aria-label="전환" onClick={() => setTab(tab === 'list' ? 'record' : 'list')}>{tab === 'list' ? ICON.cal : ICON.list}</button>
              </div>
            </>
          )}
        </div>
        {bell && (
          <div className="sm-pop" onClick={() => setBell(false)}>
            <b>알림</b>
            <p>{mine(today) ? '오늘의 질문에 답변을 남겼어요.' : `오늘의 질문이 도착했어요. (#${qOf(today).n})`}</p>
            <p>{ptDone(today, today) ? `${s.pt}님이 답변을 남겼어요. (시뮬레이션)` : `${s.pt}님은 아직 답변 전이에요. (시뮬레이션)`}</p>
          </div>
        )}
        <div className="sm-scroll" ref={scrollRef}>
          {tab === 'home' && <Home {...ctx} />}
          {tab === 'list' && <List {...ctx} />}
          {tab === 'record' && <Record {...ctx} />}
          {tab === 'couple' && <Couple {...ctx} />}
        </div>
        <div className="sm-tabs">
          {TABS.map(([k, t]) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-label={t} onClick={() => setTab(k)}>
              {ICON[k]}
            </button>
          ))}
        </div>
      </>
    )
  }
  return (
    <div className="page sm">
      {body}
      {toast && <div className="sm-toast">{toast}</div>}
    </div>
  )
}

/* ───────── 공통 조각 ───────── */
function Home(c) {
  const { s, today, qOf, mine, stage, dday, setView } = c
  const done = !!mine(today)
  const q = qOf(today)
  return (
    <div className="sm-home">
      <div className="sm-names">{s.me} <i>{ICON.heart}</i> {s.pt}</div>
      <div className="sm-days">사랑한 지 <b>{dday}</b> 일 째</div>
      <button className="sm-center" aria-label="오늘의 질문" onClick={() => q && setView({ t: done ? 'detail' : 'edit', date: today })}>
        {!done && <span className="sm-mail">{ICON.mail}<i>1</i></span>}
        <Egg stage={Math.min(stage, 2)} happy={done} />
        <p>{done ? '오늘의 답변을 남겼어요' : '오늘의 질문이 도착했어요'}</p>
      </button>
    </div>
  )
}

function List(c) {
  const { allDates, qOf, setView } = c
  return (
    <div className="sm-list">
      {[...allDates].reverse().map((d) => {
        const q = qOf(d)
        if (!q) return null
        return (
          <button key={d} className="sm-li" onClick={() => setView({ t: 'detail', date: d })}>
            <em>#{pad(q.n)}</em>
            <span>{QS[q.qi][1]}</span>
          </button>
        )
      })}
    </div>
  )
}

function Record(c) {
  const { s, today, qOf, mine, setView } = c
  const t = parse(today)
  const [cal, setCal] = useState({ y: t.getFullYear(), m: t.getMonth() })
  const [sel, setSel] = useState(today)
  const first = new Date(cal.y, cal.m, 1).getDay()
  const len = new Date(cal.y, cal.m + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: len }, (_, i) => dk(new Date(cal.y, cal.m, i + 1)))]
  const go = (n) => setCal((p) => {
    const d = new Date(p.y, p.m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const q = qOf(sel)
  const pd = ptDone(sel, today)
  const m = mine(sel)
  return (
    <div className="sm-pad">
      <div className="sm-card sm-cal">
        <div className="sm-cal-h">
          <button onClick={() => go(-1)} aria-label="이전 달">‹</button>
          <b>{cal.y}년 {cal.m + 1}월</b>
          <button onClick={() => go(1)} aria-label="다음 달">›</button>
        </div>
        <div className="sm-cal-g">
          {DAYS.map((d, i) => <span key={d} className={`w ${i === 0 ? 'sun' : ''}`}>{d}</span>)}
          {cells.map((k, i) => {
            if (!k) return <span key={`e${i}`} />
            const has = !!qOf(k)
            const me = !!mine(k)
            const both = me && ptDone(k, today)
            return (
              <button key={k} className={`d ${k === sel ? 'sel' : ''} ${k === today ? 'today' : ''} ${both ? 'both' : me ? 'me' : has ? 'q' : ''}`} onClick={() => setSel(k)}>
                {Number(k.slice(8))}
                {both && <i>{ICON.heart}</i>}
              </button>
            )
          })}
        </div>
        <div className="sm-legend">
          <span><i className="lb" />둘 다 완료</span>
          <span><i className="lm" />나만 완료</span>
          <span><i className="lq" />질문만 도착</span>
        </div>
      </div>

      <div className="sm-diary">
        <div className="sm-diary-d">{label(sel)}</div>
        {!q ? (
          <p className="sm-none">이 날의 기록은 없어요</p>
        ) : (
          <>
            <div className="sm-meta"><span className="sm-no">Q{q.n}</span><em>{QS[q.qi][0]}</em></div>
            <p className="sm-q">{QS[q.qi][1]}</p>
            <div className="sm-who-a"><b>{s.me}</b></div>
            <p className={`sm-a ${m ? '' : 'none'}`}>{m ? m.text : '아직 답변하지 않았어요'}</p>
            <div className="sm-who-a"><b>{s.pt}</b></div>
            <p className={`sm-a ${m && pd ? '' : 'none'}`}>
              {m && pd ? QS[q.qi][2] : !pd ? '아직 답변 전이에요' : '내 답변을 완료하면 볼 수 있어요'}
            </p>
            <button className="sm-btn ghost" onClick={() => setView({ t: m ? 'detail' : 'edit', date: sel })}>{m ? '자세히 보기' : '답변하러 가기'}</button>
          </>
        )}
      </div>
    </div>
  )
}

function Couple(c) {
  const { s, setS, today, dday, setToast } = c
  const pick = (key) => (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      const im = new Image()
      im.onload = () => {
        const S = 144
        const cv = document.createElement('canvas')
        cv.width = S
        cv.height = S
        const m = Math.min(im.width, im.height)
        cv.getContext('2d').drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S)
        setS((p) => ({ ...p, [key]: cv.toDataURL('image/jpeg', 0.8) }))
        setToast('프로필 사진을 바꿨어요')
      }
      im.src = r.result
    }
    r.readAsDataURL(file)
    e.target.value = ''
  }
  const list = []
  if (s.start) {
    ;[100, 200, 300, 365, 500, 730, 1000, 1095].forEach((n) => list.push([n === 365 ? '1주년' : n === 730 ? '2주년' : n === 1095 ? '3주년' : `${n}일`, addDays(s.start, n - 1)]))
  }
  const nextIdx = list.findIndex(([, d]) => d >= today)
  return (
    <div className="sm-pad">
      <div className="sm-card sm-prof">
        {[['me', 'meImg', '나'], ['pt', 'ptImg', '상대방']].map(([w, im, t]) => (
          <div key={w} className="sm-pf">
            <label className="sm-av-l">
              <Avatar img={s[im]} who={w} size={64} />
              <span className="sm-cam">사진</span>
              <input type="file" accept="image/*" onChange={pick(im)} hidden />
            </label>
            <div className="sm-inp">
              <small>{t === '나' ? '내 이름' : '상대방 이름'}</small>
              <input value={s[w]} maxLength={8} onChange={(e) => setS((p) => ({ ...p, [w]: e.target.value }))} onBlur={() => !s[w].trim() && setS((p) => ({ ...p, [w]: w === 'me' ? '성화' : '윤호' }))} />
            </div>
          </div>
        ))}
      </div>

      <div className="sm-card">
        <div className="sm-meta"><span className="sm-tag">사귄 날짜</span>{s.start && <em>D+{dday}</em>}</div>
        <input className="sm-date" type="date" max={today} value={s.start || ''} onChange={(e) => e.target.value && setS((p) => ({ ...p, start: e.target.value }))} />
        <p className="sm-note">날짜를 바꾸면 D-day와 기념일이 자동으로 다시 계산돼요.</p>
      </div>

      {list.length > 0 && (
        <div className="sm-card">
          <div className="sm-meta"><span className="sm-tag">기념일</span></div>
          {list.map(([n, d], i) => {
            const left = diff(d, today)
            return (
              <div key={n} className={`sm-ann ${i === nextIdx ? 'next' : ''} ${left < 0 ? 'past' : ''}`}>
                <b>{n}</b>
                <span>{d.replace(/-/g, '.')}</span>
                <em>{left === 0 ? '오늘' : left > 0 ? `D-${left}` : '지남'}</em>
              </div>
            )
          })}
        </div>
      )}

      <p className="sm-note c">상대방 프로필과 답변은 시뮬레이션이에요. 실제 계정 연결은 아니며, 모든 기록은 이 기기에만 저장돼요.</p>
    </div>
  )
}

/* ───────── 상세 / 작성 화면 ───────── */
const dot = (d) => d.replace(/-/g, '.')

function Detail({ s, today, qOf, mine, date, setView, onBack }) {
  const q = qOf(date)
  const m = mine(date)
  const pd = ptDone(date, today)
  if (!q) return <Wrap onBack={onBack}><p className="sm-none">기록이 없어요</p></Wrap>
  const edit = () => setView({ t: 'edit', date })
  return (
    <Wrap onBack={onBack} right={m ? <button aria-label="수정" onClick={edit}>{ICON.pen}</button> : null}>
      <div className="sm-qn">#{q.n}번째 질문 <span>{dot(date)}</span></div>
      <p className="sm-q big">{QS[q.qi][1]}</p>
      <div className="sm-ans">
        <b>{s.me}</b>
        <p className={m ? '' : 'none'}>{m ? m.text : '아직 답변하지 않았어요'}</p>
      </div>
      <div className="sm-ans">
        <b>{s.pt}</b>
        <p className={m && pd ? '' : 'none'}>{pd && QS[q.qi][2] ? (m ? QS[q.qi][2] : '내 답변을 완료하면 볼 수 있어요') : '아직 답변 전이에요'}</p>
      </div>
      {!m && <button className="sm-under" onClick={edit}>답변 쓰기</button>}
    </Wrap>
  )
}

function Edit({ s, qOf, mine, date, onSave, onBack }) {
  const q = qOf(date)
  const [t, setT] = useState(() => (mine(date) ? mine(date).text : ''))
  if (!q) return <Wrap onBack={onBack}><p className="sm-none">작성할 수 없는 날짜예요</p></Wrap>
  return (
    <Wrap onBack={onBack} right={<button aria-label="저장" disabled={!t.trim()} onClick={() => onSave(date, t)}>{ICON.check}</button>}>
      <div className="sm-qn">#{q.n}번째 질문 <span>{dot(date)}</span></div>
      <p className="sm-q big">{QS[q.qi][1]}</p>
      <textarea className="sm-ta" autoFocus value={t} maxLength={80} onChange={(e) => setT(e.target.value)} placeholder="답변을 입력해 주세요." />
      <small className="sm-cnt">{t.length} / 80</small>
    </Wrap>
  )
}

function Wrap({ onBack, right, children }) {
  return (
    <>
      <div className="sm-top">
        <button className="sm-bk" onClick={onBack} aria-label="뒤로">{ICON.back}</button>
        <span />
        <div className="sm-top-r">{right}</div>
      </div>
      <div className="sm-scroll"><div className="sm-pad">{children}</div></div>
    </>
  )
}
