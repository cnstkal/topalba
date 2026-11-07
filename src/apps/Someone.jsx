import { useEffect, useRef, useState } from 'react'
import { DAYS, pad } from '../utils'

/* ───────── 질문 은행 [분류, 질문, 상대방(시뮬레이션) 답변] ───────── */
const QS = [
  ['연애', '우리가 처음 만난 날, 서로 어떤 첫인상이었어?', '조금 낯을 가리는데 웃는 모습이 편안해서 자꾸 눈이 갔어.'],
  ['일상', '오늘 하루 중 가장 좋았던 순간은 언제야?', '점심 먹고 잠깐 햇볕 쬐면서 걸었던 시간이 제일 좋았어.'],
  ['취향', '요즘 자꾸 듣게 되는 노래가 있다면?', '늦은 밤에 잔잔한 노래를 계속 반복해서 듣고 있어.'],
  ['추억', '우리가 함께한 여행 중 가장 기억에 남는 곳은?', '길을 잃고 헤매다 우연히 찾은 작은 카페가 아직도 생각나.'],
  ['가치관', '연애에서 가장 중요하다고 생각하는 건 뭐야?', '솔직하게 말하는 거. 서운한 건 그날 풀고 싶어.'],
  ['연애', '나한테 가장 고마웠던 순간은 언제야?', '내가 힘들다고 말하기도 전에 먼저 알아채 줬을 때.'],
  ['일상', '아침에 눈 떴을 때 제일 먼저 드는 생각은?', '오늘 뭐 먹지? 아니면 5분만 더…'],
  ['취향', '가장 좋아하는 음식과 싫어하는 음식은?', '좋아하는 건 따끈한 국물 요리, 싫어하는 건 오이야.'],
  ['추억', '어릴 때 가장 좋아했던 놀이나 장난감은?', '인형 놀이랑 동네 놀이터에서 하던 술래잡기.'],
  ['가치관', '10년 뒤 우리는 어떤 모습이면 좋겠어?', '지금처럼 사소한 걸 같이 웃고 있으면 좋겠어.'],
  ['연애', '서로에게 처음 설렜던 순간이 기억나?', '같이 걷다가 자연스럽게 차도 쪽에 서 줬을 때.'],
  ['일상', '쉬는 날 가장 하고 싶은 일은 뭐야?', '늦잠 자고 일어나서 아무 계획 없이 산책하기.'],
  ['취향', '비 오는 날이 좋아, 맑은 날이 좋아? 왜?', '비 오는 날. 창밖 소리 들으면서 가만히 있는 게 좋아.'],
  ['추억', '요즘 문득 떠오르는 어릴 적 기억이 있어?', '할머니 댁 마루에서 수박 먹던 여름날.'],
  ['가치관', '돈과 시간 중에 어느 쪽이 더 소중해?', '시간. 돈은 다시 벌 수 있지만 시간은 못 돌리니까.'],
  ['연애', '우리 둘만 아는 작은 습관이나 별명이 있다면?', '이름 대신 부르는 우리만의 말이 제일 좋아.'],
  ['일상', '스트레스 받을 때 나만의 해소법이 있어?', '좋아하는 간식 사 먹고 일찍 눕기.'],
  ['취향', '몇 번이고 다시 보고 싶은 영화나 드라마는?', '잔잔하고 따뜻한 영화. 몇 번을 봐도 좋더라.'],
  ['추억', '우리 첫 데이트는 어땠는지 지금 떠올려 볼까?', '엄청 긴장했는데 지금 생각하면 귀여운 기억이야.'],
  ['가치관', '싸웠을 때 어떻게 화해하고 싶어?', '시간을 조금 갖고 나서 차분하게 이야기하고 싶어.'],
  ['연애', '요즘 내가 가장 귀여워 보일 때는 언제야?', '졸린 눈으로 말끝이 흐려질 때.'],
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
const load = () => {
  const base = { me: '성화', pt: '윤호', start: '2026-07-08', first: dk(new Date()), meImg: '', ptImg: '', ans: {} }
  try {
    const r = JSON.parse(localStorage.getItem(LS))
    if (r && typeof r === 'object') {
      const saved = { ...base, ...r, ans: r.ans && typeof r.ans === 'object' ? r.ans : {} }
      // 이전 기본 프로필 값만 새 설정으로 마이그레이션하고, 직접 바꾼 값은 유지
      if (!r.me || r.me === '나') saved.me = '성화'
      if (!r.pt || r.pt === '하늘') saved.pt = '윤호'
      if (!r.start) saved.start = '2026-07-08'
      return saved
    }
  } catch (e) {
    /* 손상된 데이터는 기본값 사용 */
  }
  return base
}

/* ───────── 시뮬레이션: 상대방 답변 여부 (날짜 기반 고정값) ───────── */
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const ptDone = (date, today) => (date === today ? hash(date) % 3 !== 0 : hash(date) % 5 !== 0)

/* ───────── 반려몽 성장 단계 ───────── */
const STEPS = [1, 3, 7, 14]
const STAGE = ['잠자는 알', '똑똑, 금이 갔어요', '껍질 밖이 궁금해요', '갓 태어난 몽', '쑥쑥 자란 몽']

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
  heart: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.6C5.6 16.2 3 12.9 3 9.7 3 7.2 4.9 5.4 7.2 5.4c1.9 0 3.7 1.1 4.8 3 1.1-1.9 2.9-3 4.8-3C19.1 5.4 21 7.2 21 9.7c0 3.2-2.6 6.5-9 10.9z" /></svg>,
}

/* ───────── 반려몽 (달걀 캐릭터) ───────── */
function Egg({ stage, happy, both }) {
  const E = '#fff1de'
  const L = '#7a5a48'
  const eyes = (y, x1 = 82, x2 = 118) =>
    happy ? (
      <g fill="none" stroke={L} strokeWidth="3" strokeLinecap="round">
        <path d={`M${x1 - 6} ${y + 2}q6 -8 12 0`} />
        <path d={`M${x2 - 6} ${y + 2}q6 -8 12 0`} />
      </g>
    ) : stage === 0 ? (
      <g fill="none" stroke={L} strokeWidth="3" strokeLinecap="round">
        <path d={`M${x1 - 6} ${y}q6 6 12 0`} />
        <path d={`M${x2 - 6} ${y}q6 6 12 0`} />
      </g>
    ) : (
      <g className="sm-blink" fill={L}>
        <ellipse cx={x1} cy={y} rx="4" ry="5" />
        <ellipse cx={x2} cy={y} rx="4" ry="5" />
      </g>
    )
  const blush = (y, x1 = 70, x2 = 130) => (
    <g fill="#f4b3a8" opacity={happy ? 0.85 : 0.5}>
      <ellipse cx={x1} cy={y} rx="9" ry="5.5" />
      <ellipse cx={x2} cy={y} rx="9" ry="5.5" />
    </g>
  )
  const mouth = (y) => <path d={happy ? `M92 ${y}q8 9 16 0` : `M95 ${y + 2}q5 4 10 0`} fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" />

  return (
    <svg className="sm-egg-svg" viewBox="0 0 200 230" width="220" height="253">
      <ellipse cx="100" cy="214" rx="58" ry="9" fill="#e6d3b8" opacity=".7" />
      {stage <= 2 && (
        <g>
          <path d="M100 20C150 20 172 100 172 142c0 42-30 64-72 64s-72-22-72-64C28 100 50 20 100 20z" fill={E} stroke={L} strokeWidth="3" strokeLinejoin="round" />
          <g fill="#f8d9bd" opacity=".8">
            <circle cx="64" cy="70" r="6" />
            <circle cx="138" cy="92" r="5" />
            <circle cx="120" cy="52" r="3.5" />
          </g>
          {stage === 1 && <path d="M80 36l10 12-8 9 12 10" fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {stage === 2 && (
            <g fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M62 62l14 12-10 11 16 10-8 8" />
              <path d="M128 50l-8 12 12 7-6 10" />
            </g>
          )}
          {eyes(stage === 0 ? 126 : 128)}
          {blush(140)}
          {mouth(142)}
          {stage === 0 && !happy && (
            <text className="sm-zzz" x="140" y="62" fontSize="20" fill="#c9a98c" fontWeight="700">
              z z
            </text>
          )}
        </g>
      )}
      {stage >= 3 && (
        <g>
          <circle cx="100" cy="118" r="54" fill="#ffe9a6" stroke={L} strokeWidth="3" />
          <path className="sm-wing l" d="M48 118c-14 2-18 14-8 22 8-2 14-10 8-22z" fill="#ffe09a" stroke={L} strokeWidth="3" strokeLinejoin="round" />
          <path className="sm-wing r" d="M152 118c14 2 18 14 8 22-8-2-14-10-8-22z" fill="#ffe09a" stroke={L} strokeWidth="3" strokeLinejoin="round" />
          {eyes(110, 82, 118)}
          {blush(124, 68, 132)}
          <path d="M92 120h16l-8 10z" fill="#f6a56b" stroke={L} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M92 150l12-14 14 14 14-14 14 14 12-12c4 30-12 50-52 58-40-8-56-28-52-58z" fill="none" />
          <path d="M44 156l12-10 12 12 12-12 12 12 12-12 12 12 12-12 12 12 8-8c2 30-14 52-52 52s-54-22-52-52z" fill={E} stroke={L} strokeWidth="3" strokeLinejoin="round" />
          {stage === 4 && (
            <g>
              <path d="M100 66c-2-10 2-16 8-18M100 66c-6-8-14-8-18-4" fill="none" stroke="#8fae7a" strokeWidth="4" strokeLinecap="round" />
              <path className="sm-heart" d="M160 60c-5-4-9 0-7 4 2 3 7 6 7 6s5-3 7-6c2-4-2-8-7-4z" fill="#f2a6a0" />
            </g>
          )}
        </g>
      )}
      {both && (
        <g className="sm-heart" fill="#f2a6a0">
          <path d="M30 64c-4-3-7 0-5.5 3 1.5 2.5 5.5 5 5.5 5s4-2.5 5.5-5c1.5-3-1.5-6-5.5-3z" />
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
    const n = diff(date, s.first) + 1
    if (date > today) return null
    if (saved) return { n: Math.max(n, 1), qi: saved.qi }
    if (n < 1) return null
    return { n, qi: (n - 1) % QS.length }
  }
  const mine = (date) => (s.ans[date] && s.ans[date].text ? s.ans[date] : null)
  const days = Array.from({ length: diff(today, s.first) + 1 }, (_, i) => addDays(s.first, i))
  const allDates = [...new Set([...days, ...Object.keys(s.ans)])].filter((d) => d <= today).sort()
  const count = Object.keys(s.ans).filter((d) => s.ans[d].text).length
  const stage = STEPS.filter((n) => count >= n).length
  const dday = s.start ? diff(today, s.start) + 1 : null

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
    body = (
      <>
        <div className="sm-top">
          <div className="sm-logo">
            썸원<span>{ICON.heart}</span>
          </div>
          <div className="sm-top-r">
            <button aria-label="알림" onClick={() => setBell(!bell)}>
              {ICON.bell}
              {!mine(today) && <i className="sm-dot" />}
            </button>
            <button aria-label="설정" onClick={() => setTab('couple')}>{ICON.gear}</button>
          </div>
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
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {ICON[k === 'list' ? 'list' : k]}
              <span>{t}</span>
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
function Chips({ s, date, today, mine }) {
  const pd = ptDone(date, today)
  return (
    <div className="sm-chips">
      <span className={mine(date) ? 'ok' : ''}>{s.me} {mine(date) ? '완료' : '전'}</span>
      <span className={pd ? 'ok' : ''}>{s.pt} {pd ? '완료' : '대기 중'}</span>
    </div>
  )
}

function Home(c) {
  const { s, today, qOf, mine, stage, count, dday, setView, setTab } = c
  const q = qOf(today)
  const done = !!mine(today)
  const pd = ptDone(today, today)
  const [wob, setWob] = useState(false)
  const next = STEPS[stage]
  const prev = stage ? STEPS[stage - 1] : 0
  const pct = next ? ((count - prev) / (next - prev)) * 100 : 100
  const msg = done
    ? pd ? `${s.pt}님 답변도 도착했어! 함께 확인해 봐` : '답변 고마워! 상대방을 기다리는 중이야'
    : stage === 0 ? '따뜻하게 품어 줘… 오늘의 질문에 답해 줄래?' : '오늘의 질문에 답해 주면 쑥쑥 자라!'
  return (
    <div className="sm-pad">
      <div className="sm-couple">
        <div className="sm-who">
          <Avatar img={s.meImg} who="me" />
          <span>{s.me}</span>
        </div>
        <button className="sm-dd" onClick={() => !s.start && setTab('couple')}>
          <small>{s.start ? '함께한 지' : '사귄 날짜를'}</small>
          <b>{s.start ? `D+${dday}` : '설정하기'}</b>
          <i>{ICON.heart}</i>
        </button>
        <div className="sm-who">
          <Avatar img={s.ptImg} who="pt" />
          <span>{s.pt}</span>
        </div>
      </div>

      <div className="sm-egg">
        <div className="sm-bubble">{msg}</div>
        <button className={wob ? 'wob' : ''} onClick={() => { setWob(true); setTimeout(() => setWob(false), 700) }} aria-label="반려몽">
          <Egg stage={stage} happy={done} both={done && pd} />
        </button>
        <div className="sm-stage">
          <b>{STAGE[stage]}</b>
          <div className="sm-bar"><i style={{ width: `${pct}%` }} /></div>
          <small>{next ? `다음 단계까지 답변 ${next - count}번` : '다 자랐어요! 계속 함께해요'}</small>
        </div>
      </div>

      <div className="sm-card sm-today">
        <div className="sm-meta">
          <span className="sm-tag">오늘의 질문</span>
          <em>#{q.n} · {label(today)}</em>
        </div>
        <p className="sm-q">{QS[q.qi][1]}</p>
        <Chips s={s} date={today} today={today} mine={mine} />
        <button className="sm-btn" onClick={() => setView({ t: done ? 'detail' : 'edit', date: today })}>
          {done ? '답변 확인하기' : '답변 쓰러 가기'}
        </button>
      </div>
    </div>
  )
}

function List(c) {
  const { s, today, qOf, mine, allDates, setView } = c
  const [f, setF] = useState('all')
  const rows = [...allDates].reverse().filter((d) => (f === 'all' ? true : f === 'done' ? !!mine(d) : !mine(d)))
  const total = allDates.length
  const done = allDates.filter((d) => mine(d)).length
  return (
    <div className="sm-pad">
      <h2 className="sm-h">질문 목록</h2>
      <p className="sm-sub">지금까지 {total}개의 질문 중 {done}개에 답했어요</p>
      <div className="sm-seg">
        {[['all', '전체'], ['done', '답변 완료'], ['todo', '아직 안 함']].map(([k, t]) => (
          <button key={k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{t}</button>
        ))}
      </div>
      {rows.length === 0 && <div className="sm-empty">해당하는 질문이 없어요</div>}
      {rows.map((d) => {
        const q = qOf(d)
        if (!q) return null
        return (
          <button key={d} className="sm-card sm-row" onClick={() => setView({ t: 'detail', date: d })}>
            <div className="sm-meta">
              <span className="sm-no">Q{q.n}</span>
              <em>{QS[q.qi][0]} · {label(d)}</em>
            </div>
            <p>{QS[q.qi][1]}</p>
            <Chips s={s} date={d} today={today} mine={mine} />
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
      <h2 className="sm-h">우리의 기록</h2>
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
      <h2 className="sm-h">우리 커플</h2>
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
function Detail({ s, today, qOf, mine, date, setView, onBack }) {
  const q = qOf(date)
  const m = mine(date)
  const pd = ptDone(date, today)
  if (!q) return <Wrap onBack={onBack} title="기록"><p className="sm-none">기록이 없어요</p></Wrap>
  return (
    <Wrap onBack={onBack} title={`Q${q.n}`}>
      <div className="sm-meta"><span className="sm-tag">{QS[q.qi][0]}</span><em>{label(date)}</em></div>
      <p className="sm-q big">{QS[q.qi][1]}</p>
      <div className="sm-paper">
        <div className="sm-who-a"><b>{s.me}</b>{m && <button onClick={() => setView({ t: 'edit', date })}>{ICON.pen}수정</button>}</div>
        <p className={`sm-a ${m ? '' : 'none'}`}>{m ? m.text : '아직 답변하지 않았어요'}</p>
      </div>
      <div className="sm-paper pt">
        <div className="sm-who-a"><b>{s.pt}</b></div>
        <p className={`sm-a ${m && pd ? '' : 'none'}`}>{m && pd ? QS[q.qi][2] : !pd ? `${s.pt}님은 아직 답변 전이에요 (대기 중)` : '내 답변을 완료하면 서로의 답변을 볼 수 있어요'}</p>
      </div>
      {!m && <button className="sm-btn" onClick={() => setView({ t: 'edit', date })}>답변 쓰기</button>}
      <p className="sm-note c">상대방 답변은 시뮬레이션이에요.</p>
    </Wrap>
  )
}

function Edit({ s, qOf, mine, date, onSave, onBack }) {
  const q = qOf(date)
  const [t, setT] = useState(() => (mine(date) ? mine(date).text : ''))
  if (!q) return <Wrap onBack={onBack} title="답변"><p className="sm-none">작성할 수 없는 날짜예요</p></Wrap>
  return (
    <Wrap onBack={onBack} title={mine(date) ? '답변 수정' : '답변 쓰기'}>
      <div className="sm-meta"><span className="sm-tag">Q{q.n}</span><em>{label(date)}</em></div>
      <p className="sm-q big">{QS[q.qi][1]}</p>
      <div className="sm-paper">
        <textarea autoFocus value={t} maxLength={300} onChange={(e) => setT(e.target.value)} placeholder={`${s.me}의 이야기를 적어 보세요`} />
        <small>{t.length}/300</small>
      </div>
      <button className="sm-btn" disabled={!t.trim()} onClick={() => onSave(date, t)}>저장하기</button>
    </Wrap>
  )
}

function Wrap({ onBack, title, children }) {
  return (
    <>
      <div className="sm-top sub">
        <button className="sm-bk" onClick={onBack} aria-label="뒤로">{ICON.back}</button>
        <b>{title}</b>
        <span style={{ width: 36 }} />
      </div>
      <div className="sm-scroll"><div className="sm-pad">{children}</div></div>
    </>
  )
}
