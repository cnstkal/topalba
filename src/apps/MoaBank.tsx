// @ts-nocheck
import { useState } from 'react'
import './MoaBank.css'

/* 토스 다크 UI 목업 (연습용). 홈 / 이용내역 / 증권 / 종목차트만 동작, 나머지는 장식 */
const n = (v) => v.toLocaleString('ko-KR')
const P = { home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', gem: 'M6 3h12l4 6-10 12L2 9z', bag: 'M5 8h14l1 13H4zM8 8a4 4 0 0 1 8 0', chart: 'M3 20 8 9l5 6 4-9 4 14z', menu: 'M4 7h16M4 12h16M4 17h16', back: 'm15 18-6-6 6-6', search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM21 21l-5-5', heart: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z', bell: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8zM10 21h4', dots: 'M5 12h.01M12 12h.01M19 12h.01', heart2: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18', grid: 'M4 4h16v16H4zM4 12h16M12 12v8', chev: 'm9 6 6 6-6 6' }
const Ic = ({ d, s = 24, f }) => <svg viewBox="0 0 24 24" width={s} height={s} fill={f || 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={P[d]} /></svg>

const Av = ({ t }) => {
  const m = { cu: ['#7a3ea8', 'CU'], post: ['#ee3a37', '✉'], w: ['#3182f6', '₩'], cp: ['#fff', 'coupang'], cash: ['#2f6bd0', '₩'] }[t]
  return <i className={'av ' + t} style={{ background: m[0] }}>{m[1]}</i>
}

const WEEK = [['일', 8], ['월', 9], ['화', 10], ['수', 11], ['목', 12], ['금', 13], ['토', 14]]
const HIST = [
  ['8일 일요일', [
    { a: 'w', t: '-1,000,000원', s: '정윤호에게 송금 · 토스뱅크 → 정윤호', d: 1 },
    { a: 'w', t: '-12,500원', s: '배달의민족 · 저녁 식사' },
    { a: 'cu', t: '-5,400원', s: 'GS25 신림역점 · 간식' },
    { a: 'w', t: '-8,000원', s: '신림 김밥천국 · 식사' },
  ]],
  ['7일 토요일', [
    { a: 'w', t: '+250,000원', s: '김민준 → 내 토스뱅크 통장', b: 1 },
    { a: 'cp', t: '-18,900원', s: '쿠팡 · 생활용품' },
    { a: 'w', t: '-16,000원', s: '신림동 PC방 · 이용요금' },
    { a: 'w', t: '-32,000원', s: '마포 고깃집 · 식사' },
  ]],
  ['4일 수요일', [
    { a: 'w', t: '-14,800원', s: '배달의민족 · 점심' },
    { a: 'w', t: '-6,500원', s: '메가커피 신림점' },
    { a: 'w', t: '-22,000원', s: '홍콩반점 신림점 · 식사' },
  ]],
  ['3일 화요일', [
    { a: 'w', t: '+220,000원', s: '이준호 → 내 토스뱅크 통장', b: 1 },
    { a: 'cu', t: '-4,800원', s: 'CU 신림중앙점 · 편의점' },
    { a: 'w', t: '-11,000원', s: '배달의민족 · 저녁' },
  ]],
  ['10월 31일 토요일', [
    { a: 'w', t: '+280,000원', s: '박지훈 → 내 토스뱅크 통장', b: 1 },
    { a: 'w', t: '-19,000원', s: '신림역 PC방 · 이용요금' },
    { a: 'w', t: '-28,500원', s: '동네 삼겹살집 · 식사' },
  ]],
  ['10월 27일 화요일', [
    { a: 'w', t: '+230,000원', s: '최도현 → 내 토스뱅크 통장', b: 1 },
    { a: 'w', t: '-13,500원', s: '배달의민족 · 야식' },
    { a: 'w', t: '-7,000원', s: '카페 모모 · 음료' },
  ]],
]
const PAST = [['11월 8일 일요일', [['-1,000,000원', '정윤호에게 송금'], ['-12,500원', '배달의민족'], ['-8,000원', '김밥천국']]], ['11월 7일 토요일', [['+250,000원', '김민준 → 내 토스뱅크'], ['-16,000원', '신림동 PC방'], ['-32,000원', '마포 고깃집']]], ['11월 3일 화요일', [['+220,000원', '이준호 → 내 토스뱅크'], ['-11,000원', '배달의민족']]]]
const STK = [['SK하이닉스', 1120000, 2500000, '-55.2%']]
const CH = [1800,1760,1850,1780,1790,1770,1770,1700,1860,1700,1700,1530,1520,1180,1170,1500,1650,1790,1730,1500,1450,1400,1250,1120,1000,1080,1120,1060,1030,1050,1020,1000,1010,970,980,1000,1050,1020,1030,990,970,980,960,940]
const Chart = () => {
  const mn = Math.min(...CH), mx = Math.max(...CH), W = 400, H = 330
  const pts = CH.map((v, i) => `${(i / (CH.length - 1)) * W},${H - ((v - mn) / (mx - mn)) * H}`).join(' ')
  return <svg viewBox={`0 -20 ${W} ${H + 40}`} className="ch" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="#3182f6" strokeWidth="3" strokeLinejoin="round" /></svg>
}

export default function MoaBank({ close }) {
  const [tab, setTab] = useState('home'), [sub, setSub] = useState(null)
  const go = (t) => { setTab(t); setSub(null) }
  const Nav = () => (
    <nav className="bar">{[['home', '홈', 'home'], ['x1', '혜택', 'gem'], ['x2', '쇼핑', 'bag'], ['stock', '증권', 'chart'], ['x3', '전체', 'menu']].map(([k, l, i]) =>
      <button key={k} className={tab === k ? 'on' : ''} onClick={() => k === 'home' || k === 'stock' ? go(k) : null}><Ic d={i} /><span>{l}</span></button>)}</nav>
  )
  let body
  if (sub === 'chart') body = (
    <div className="pg">
      <div className="tb"><button onClick={() => setSub(null)}><Ic d="back" /></button><span className="sp" /><Ic d="heart" /><Ic d="bell" f="#fdb92a" /><Ic d="dots" /></div>
      <h2 className="nm">SK하이닉스</h2><h1 className="px">1,120,000원</h1>
      <p className="gr">매입 평균 2,500,000원 · 투자 원금 7,000,000원</p>
      <div className="tabs">{['차트', '호가', '내 주식', '종목정보', '커뮤니티'].map((t, i) => <span key={t} className={i ? '' : 'on'}>{t}</span>)}</div>
      <p className="gr dm">◯ 자세한 차트</p>
      <div className="cw"><span className="hi">최고 1,217,000원</span><Chart /><span className="lo">최저 1,070,000원</span></div>
      <div className="per">{['1일', '1주', '3달', '1년', '5년', '전체'].map((t, i) => <span key={t} className={i ? '' : 'on'}>{t}</span>)}<em><s /><s className="b" /></em></div>
      <div className="trd"><button className="sell">판매하기</button><button className="buy">구매하기</button></div>
    </div>
  )
  else if (sub === 'det') body = (
    <div className="pg">
      <div className="tb"><button onClick={() => setSub(null)}><Ic d="back" /></button><b className="ct">상세 내역</b><span>숨기기</span></div>
      <div className="who"><Av t="w" /> 진소윤</div><h1 className="px g">-100,000원 ✎</h1>
      {[['카테고리 설정', '이체', 1], ['메모', '메모를 남겨보세요', 1], ['지출 합계에 포함', ''], ['입금처', '내 카카오뱅크 3333327493840'], ['출금처', '내 토스뱅크 100160866332'], ['이체일시', '2026년 11월 6일 15:10'], ['받는 분 통장표시', '진소윤'], ['송금확인증', '발급받기', 1]].map(([a, b, c]) =>
        <div className="kv" key={a}><span>{a}</span>{a === '지출 합계에 포함' ? <u className="sw" /> : <em className={c ? 'bl' : ''}>{b}</em>}</div>)}
      <h3 className="h3">최근 3개월간 거래 내역</h3>
      <div className="two"><div><span>거래 횟수</span><b>26 회</b></div><div><span>총 금액</span><b>0원</b></div></div>
      {PAST.map(([d, l]) => <div key={d}><p className="day">{d}</p>{l.map(([a, b], i) => <div className="row" key={i}><Av t="w" /><div className="m"><b className="gr2">{a}</b><span>내 계좌 이체 | {b}</span></div></div>)}</div>)}
    </div>
  )
  else if (tab === 'hist') body = (
    <div className="pg">
      <div className="tb hist-head"><button onClick={() => go('home')}><Ic d="back" /></button><b className="ct">◀ 11월 ▶</b><span className="sp" /><Ic d="search" /><Ic d="dots" /></div>
      <div className="chips">{['전체', '카드', '입·출금', '투자', '페이·기타'].map((t, i) => <span key={t} className={i ? '' : 'on'}>{t}</span>)}</div>
      <div className="sum"><div><span>지출</span><b>-1,184,700원</b></div><div><span>수입</span><b>+1,000,000원</b></div></div>
      
      <div className="wk">{WEEK.map(([d, v]) => <div key={v}><span>{d}</span><b>{v}</b></div>)}</div>
      <div className="chv">⌄</div>
      {HIST.map(([d, l]) => <div key={d}><p className="day">{d}</p>{l.map((r, i) => r.cash
        ? <div className="row" key={i}><Av t="cash" /><div className="m"><b>{r.t}</b><span>{r.s}</span></div><button className="rcv">받기</button></div>
        : <div className="row" key={i} onClick={r.d ? () => setSub('det') : null}><Av t={r.a} /><div className="m"><b className={(r.b ? 'bl ' : '') + (r.x ? 'cx' : '')}>{r.o && <s>{r.o} </s>}{r.t}</b><span>{r.s}</span></div></div>)}</div>)}
    </div>
  )
  else if (tab === 'stock') body = (
    <div className="pg">
      <div className="tb"><span className="sp" /><Ic d="search" /><Ic d="menu" /></div>
      <h2 className="nm">토스증권</h2><p className="gr">러셀 2000 선물 <b className="up">2,760.50</b> <small className="up">+0.9%</small></p>
      <div className="acc"><i>⚡</i> 기본계좌 ⌃⌄ <span>계좌 보기</span></div>
      <div className="two2"><div><span>원화</span><b>328,450원</b></div><div><span>달러</span><b>$0.14</b></div></div>
      <p className="h3 s">내 투자</p><h1 className="px">3,136,000원</h1><p className="dn big">-3,864,000원 (-55.2%) · 투자 원금 700만원</p>
      <div className="flt"><span>수익률 높은 순 ⌄</span><em><u>현재가</u>평가금</em><em><u className="n">$</u><u>원</u></em></div>
      <p className="h3">국내주식 <b className="dn">-37.3%</b> 〉</p>
      {STK.map(([nm, p, a, r]) => <div className="row st" key={nm}>
        <svg viewBox="0 0 40 20" className="sp2"><path d="M0 14 8 8 14 4 22 8 30 7 40 5V20H0z" fill="#1d2b4a" /><path d="M0 14 8 8 14 4 22 8 30 7 40 5" stroke="#3182f6" fill="none" /></svg>
        <div className="m"><b className="w">{nm}</b>{a ? <span>내 평균 {n(a)}원</span> : null}</div>
        <div className="ra"><b>{n(p)}원</b><span className="dn">{r}</span></div></div>)}
    </div>
  )
  else body = (
    <div className="pg">
      <div className="tb"><b className="lg">◗ 토스뱅크 〉</b><span className="sp" /><Ic d="grid" /><i className="bw"><Ic d="bell" /></i></div>
      <div className="crd"><div className="ln"><i className="ic">⚡</i><div className="m"><b className="xl">328,450원</b><span>토스뱅크 통장 <u className="bl">+이자 191원</u></span></div><button className="gb">송금</button></div>
        <div className="ln"><i className="ic p">P</i><div className="m"><b className="xl">3번</b><span>송금·결제 후 받는 포인트</span></div><button className="gb">받기</button></div>
        <div className="ft"><span>계좌</span><span>대출</span><span>카드</span><span className="r">모두보기</span></div></div>
      <div className="crd ln" onClick={() => go('hist')}><div className="m"><b className="xl">1,184,700원</b><span>11월에 쓴 돈</span></div><button className="nw">새 내역 10건 +</button></div>
      <div className="crd"><div className="ln"><b className="xl">내 신용점수</b><em className="tag">변동 감지</em></div><div className="ft c"><span>계좌개설</span><span>카드발급</span><span>대출받기</span></div></div>
      <div className="crd"><div className="ln"><div className="m"><b className="xl">최근 본 상품</b><span>널담 뚱카롱 넌 사랑이야, 50g, 8개…</span></div><i className="th" /></div>
        <div className="ln"><div className="m"><b className="xl">방문한 서비스</b><span>페이스페이</span></div><i className="th s" /></div>
        <div className="ln"><div className="m"><b className="xl">오늘의 딜</b><span>맘스터치 최대 1.6만원 할인</span></div><i className="th r">요기요</i></div></div>
      <div className="crd ln"><div className="m"><b className="xl">인기 아우터 최대 70% 할인</b><span>아우터는 무신사에서 · AD</span></div></div>
      <div className="two3"><div className="crd">신용대출<br />한도 확인</div><div className="crd">바로 입금되는<br />카드론</div></div>
      <div className="crd"><p className="it">토스원 신한카드</p><p className="it">만들 수 있는 신용카드 한도 보기</p><p className="it">내 카드 리포트</p></div>
      <p className="set">⚙ 홈 화면 설정</p>
    </div>
  )
  return <div className="moa">{body}{!sub && <Nav />}{close && <button className="xx" onClick={close}>✕</button>}</div>
}
