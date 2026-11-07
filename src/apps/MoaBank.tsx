// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import './MoaBank.css'
import { usePersist } from '../engine/persist'

/* =========================================================
   신한 SOL뱅크 — 가상 모바일뱅킹 (연습용, 실제 금융 거래 없음)
   단일 원장(db.txs)이 유일한 진실의 원천입니다.
   잔액·보유수량·통계는 모두 원장에서 계산하므로 중복 반영이 없습니다.
   ========================================================= */

/* ---------- 시간/금액 유틸 (한국 시간) ---------- */
const DAY = 86400000, H9 = 9 * 3600000
const kst0 = () => Math.floor((Date.now() + H9) / DAY) * DAY - H9
const K = (t) => new Date(t + H9)
const dkey = (t) => K(t).toISOString().slice(0, 10)
const mkey = (t) => K(t).toISOString().slice(0, 7)
const WD = '일월화수목금토'
const dlabel = (t) => { const k = K(t); return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${WD[k.getUTCDay()]})` }
const tlabel = (t) => K(t).toISOString().slice(11, 16)
const full = (t) => `${dkey(t)} ${tlabel(t)}`
const toInput = (t) => K(t).toISOString().slice(0, 16)
const fromInput = (v) => Date.parse(v + ':00+09:00')
const num = (n) => Math.round(n).toLocaleString('ko-KR')
const won = (n) => (n < 0 ? '-' : '') + num(Math.abs(n)) + '원'
const pct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
// 신용카드: 결제일(payDay) 이후 첫 결제일에 계좌에서 출금
const nextPay = (at, day) => {
  const k = K(at); let m = k.getUTCMonth()
  if (k.getUTCDate() >= day) m++
  return Date.UTC(k.getUTCFullYear(), m, day) - H9
}

/* ---------- 아이콘 (Lucide 스타일, stroke 1.8) ---------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  down: '<path d="M17 7 7 17M17 17H7V7"/>',
  up: '<path d="M7 17 17 7M7 7h10v10"/>',
  chart: '<path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  undo: '<path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5-1.4M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4zM3 5v14a2 2 0 0 0 2 2h15V7M16 14h2"/>',
}
const Ic = ({ n, s = 20 }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: I[n] }} />
)

const Logo = ({ s = 28 }) => (
  <svg viewBox="0 0 40 40" width={s} height={s} aria-hidden="true">
    <rect width="40" height="40" rx="12" fill="#0046b8" />
    <path d="M27.5 11.5c-2.1-2-4.6-3-7.8-3-5.1 0-8.5 2.5-8.5 6.2 0 8.1 17.5 3.8 17.5 11.1 0 3.7-3.6 6.1-8.8 6.1-3.5 0-6.7-1.2-9.1-3.6" fill="none" stroke="#fff" strokeWidth="3.1" strokeLinecap="round"/>
    <circle cx="30.8" cy="30.4" r="3.1" fill="#68d5f4"/>
  </svg>
)

/* ---------- 샘플 데이터 ---------- */
const makeSeed = () => {
  const z = kst0(), cap = Date.now() - 60000
  const at = (d, h = 12, m = 0) => Math.min(z + d * DAY + (h * 60 + m) * 60000, cap)
  const accounts = [
    { id: 'a1', name: 'SOL 입출금통장', no: '3333-12-4821907', open: 4200000 },
    { id: 'a2', name: '생활비 통장', no: '3333-04-7730215', open: 420000 },
    { id: 'a3', name: 'SOL 파킹통장', no: '3333-27-1156098', open: 3000000 },
  ]
  const cards = [
    { id: 'c1', name: '신한 SOL 신용카드', kind: 'credit', last4: '4829', acc: 'a1', payDay: 14, tone: 'navy' },
    { id: 'c2', name: '신한 SOL 체크카드', kind: 'check', last4: '7163', acc: 'a2', tone: 'blue' },
  ]
  const stocks = [
    { code: '900101', name: '한강전자', price: 72400 },
    { code: '900102', name: '새벽바이오', price: 48150 },
    { code: '900103', name: '미래모빌리티', price: 215000 },
    { code: '900104', name: '온누리푸드', price: 31700 },
    { code: '900105', name: '한빛에너지', price: 18950 },
  ]
  const txs = []
  const bank = (acc, dir, amt, w, party, memo = '') => txs.push({ id: uid(), kind: 'bank', acc, dir, amt, at: w, eff: w, party, memo, status: 'ok' })
  const xfer = (from, to, amt, w, memo = '') => {
    const grp = uid(), nm = (id) => accounts.find((a) => a.id === id).name
    txs.push({ id: uid(), kind: 'transfer', grp, acc: from, dir: 'out', amt, at: w, eff: w, party: nm(to), memo, status: 'ok' })
    txs.push({ id: uid(), kind: 'transfer', grp, acc: to, dir: 'in', amt, at: w, eff: w, party: nm(from), memo, status: 'ok' })
  }
  const charge = (cid, amt, d, h, merchant, memo = '', status = 'ok') => {
    const c = cards.find((x) => x.id === cid), w = at(d, h, 17)
    txs.push({ id: uid(), kind: 'card', cardId: cid, acc: c.acc, dir: 'out', amt, at: w, eff: c.kind === 'credit' ? nextPay(w, c.payDay) : w, party: merchant, memo, status })
  }
  const trade = (side, code, qty, price, d) => {
    const s = stocks.find((x) => x.code === code), w = at(d, 10, 31)
    txs.push({ id: uid(), kind: 'stock', acc: 'a1', code, qty, price, side, dir: side === 'buy' ? 'out' : 'in', amt: qty * price, at: w, eff: w, party: `${s.name} ${side === 'buy' ? '매수' : '매도'}`, memo: '', status: 'ok' })
  }
  bank('a1', 'in', 3200000, at(-34, 9, 0), '주식회사 한빛테크', '10월 급여')
  bank('a1', 'out', 650000, at(-33, 8, 40), '김영수', '월세')
  bank('a1', 'out', 59000, at(-30, 7, 0), '통신요금 자동이체', '')
  trade('buy', '900101', 10, 68000, -28)
  xfer('a1', 'a3', 1000000, at(-25, 18, 5), '파킹 적립')
  trade('buy', '900102', 20, 45500, -22)
  bank('a1', 'out', 128000, at(-20, 9, 12), '관리사무소', '관리비')
  trade('buy', '900104', 30, 30000, -18)
  trade('buy', '900103', 3, 205000, -15)
  xfer('a1', 'a2', 300000, at(-12, 20, 10), '생활비')
  bank('a1', 'in', 480000, at(-9, 15, 22), '디자인스튜디오 온', '프리랜서 정산')
  trade('buy', '900101', 5, 70200, -8)
  bank('a1', 'out', 87000, at(-6, 7, 0), '보장보험 자동이체', '')
  trade('sell', '900102', 5, 47000, -4)
  bank('a1', 'in', 142000, at(-1, 11, 3), '국세환급금', '환급')
  bank('a1', 'in', 3820, at(0, 0, 5), '예금이자', '')
  bank('a2', 'out', 44000, at(-10, 7, 0), '통신요금 자동이체', '')
  bank('a2', 'in', 50000, at(-2, 13, 40), '박지수', '용돈')
  ;[[54300, -27, 18, '온누리마트'], [23000, -24, 19, '바삭치킨', '친구 모임'], [30000, -21, 8, '지하철 교통카드', '충전'], [18500, -19, 20, '심야서점'], [5800, -16, 9, '한강카페'], [28000, -13, 21, '시네온 영화관'],
    [41200, -11, 18, '온누리마트'], [9000, -8, 12, '새벽집 국밥'], [6300, -6, 9, '한강카페'], [89000, -5, 22, '데일리샵', '온라인 주문', 'cancel'], [21000, -3, 20, '바삭치킨'], [4800, -1, 9, '한강카페']]
    .forEach(([a, d, h, m, memo, st]) => charge('c1', a, d, h, m, memo || '', st || 'ok'))
  ;[[3400, -26, 22, '새벽25 편의점'], [8500, -22, 12, '새벽집 국밥'], [12000, -17, 17, '건강약국'], [4500, -12, 9, '한강카페'], [33700, -9, 19, '온누리마트'], [5100, -7, 23, '새벽25 편의점'], [14000, -4, 20, '시네온 영화관'], [19500, -2, 20, '바삭치킨']]
    .forEach(([a, d, h, m]) => charge('c2', a, d, h, m))
  return { v: 1, accounts, cards, stocks, txs }
}

/* ---------- 원장 엔진 ---------- */
const sorted = (a) => [...a].sort((x, y) => x.eff - y.eff || x.at - y.at)
const sgn = (t) => (t.dir === 'in' ? t.amt : -t.amt)
const balances = (db, now) => {
  const b = {}
  db.accounts.forEach((a) => { b[a.id] = a.open + db.txs.filter((t) => t.acc === a.id && t.status === 'ok' && t.eff <= now).reduce((s, t) => s + sgn(t), 0) })
  return b
}
const holdings = (db) => {
  const h = {}
  db.stocks.forEach((s) => { h[s.code] = { qty: 0, cost: 0 } })
  db.txs.filter((t) => t.kind === 'stock' && t.status === 'ok').sort((a, b) => a.at - b.at).forEach((t) => {
    const x = h[t.code]
    if (!x) return
    if (t.side === 'buy') { x.qty += t.qty; x.cost += t.amt } else { const avg = x.qty ? x.cost / x.qty : 0; x.cost -= avg * t.qty; x.qty -= t.qty }
  })
  return h
}
const ledger = (db, now) => {
  const after = {}
  db.accounts.forEach((a) => {
    let b = a.open
    sorted(db.txs.filter((t) => t.acc === a.id && t.status === 'ok' && t.eff <= now)).forEach((t) => { b += sgn(t); after[t.id] = b })
  })
  return db.txs.filter((t) => after[t.id] != null).map((t) => ({ ...t, after: after[t.id] })).sort((a, b) => b.eff - a.eff || b.at - a.at)
}
// 모든 변경 후 검증: 잔액 음수(결제 예정분 포함), 보유 수량 음수 방지
const validate = (db) => {
  for (const a of db.accounts) {
    let b = a.open
    for (const t of sorted(db.txs.filter((x) => x.acc === a.id && x.status === 'ok'))) { b += sgn(t); if (b < 0) return `${a.name} 잔액이 부족해요 (결제 예정 금액 포함)` }
  }
  const q = {}
  for (const t of db.txs.filter((x) => x.kind === 'stock' && x.status === 'ok').sort((a, b) => a.at - b.at)) {
    q[t.code] = (q[t.code] || 0) + (t.side === 'buy' ? t.qty : -t.qty)
    if (q[t.code] < 0) return '보유 수량보다 많이 매도할 수 없어요'
  }
  return null
}
const monthStat = (db, mk) => {
  let inn = 0, out = 0
  db.txs.forEach((t) => {
    if (t.status !== 'ok' || mkey(t.at) !== mk) return
    if (t.kind === 'bank') t.dir === 'in' ? (inn += t.amt) : (out += t.amt)
    if (t.kind === 'card') out += t.amt
  })
  return { inn, out }
}
const kindLabel = (t) => t.kind === 'bank' ? (t.dir === 'in' ? '입금' : '출금') : t.kind === 'transfer' ? (t.dir === 'in' ? '이체 입금' : '이체 출금') : t.kind === 'card' ? (t.status === 'cancel' ? '결제 취소' : '카드 결제') : t.side === 'buy' ? '주식 매수' : '주식 매도'
const groupBy = (rows, f) => { const m = new Map(); rows.forEach((r) => { const k = f(r); m.has(k) ? m.get(k).push(r) : m.set(k, [r]) }); return [...m.entries()] }

/* ---------- 작은 컴포넌트 ---------- */
const kindIcon = (t) => (t.kind === 'card' ? 'card' : t.kind === 'stock' ? 'chart' : t.kind === 'transfer' ? 'swap' : t.dir === 'in' ? 'down' : 'up')

function TxRow({ t, db, onClick }) {
  const card = t.cardId && db.cards.find((c) => c.id === t.cardId)
  const acc = db.accounts.find((a) => a.id === t.acc)
  const sub = card && card.kind === 'credit' ? `결제대금 · ${card.name}` : `${tlabel(t.eff)} · ${acc ? acc.name : ''}${t.memo ? ' · ' + t.memo : ''}`
  return (
    <button className="moa-row" onClick={onClick}>
      <i className={'moa-ri k-' + t.kind + (t.dir === 'in' ? ' in' : '')}><Ic n={kindIcon(t)} s={18} /></i>
      <div className="moa-rm"><b>{t.party}</b><span><u className={'moa-tag k-' + t.kind + (t.dir === 'in' ? ' in' : '')}>{kindLabel(t)}</u>{sub}</span></div>
      <div className="moa-ra"><b className={t.dir === 'in' ? 'in' : ''}>{t.dir === 'in' ? '+' : '-'}{num(t.amt)}원</b>{t.after != null && <span>{num(t.after)}원</span>}</div>
    </button>
  )
}
function CardRow({ t, onClick }) {
  const c = t.status === 'cancel'
  return (
    <button className={'moa-row' + (c ? ' cx' : '')} onClick={onClick}>
      <i className="moa-ri k-card"><Ic n={c ? 'ban' : 'card'} s={18} /></i>
      <div className="moa-rm"><b>{t.party}</b><span>{dkey(t.at).slice(5).replace('-', '.')} {tlabel(t.at)} · {c ? '결제 취소' : '승인'}{t.memo ? ' · ' + t.memo : ''}</span></div>
      <div className="moa-ra"><b>{num(t.amt)}원</b></div>
    </button>
  )
}
const Groups = ({ rows, keyOf, children }) =>
  groupBy(rows, (r) => dkey(keyOf(r))).map(([k, items]) => (
    <div key={k} className="moa-grp"><div className="moa-day">{dlabel(keyOf(items[0]))}</div><div className="moa-card flat">{items.map(children)}</div></div>
  ))
const Empty = ({ children }) => <p className="moa-empty">{children}</p>
const Head = ({ title, left, right }) => <header className="moa-head"><div className="moa-hl">{left}</div><h1>{title}</h1><div className="moa-hr">{right}</div></header>
const Sheet = ({ title, onClose, children }) => (
  <div className="moa-ov" onClick={onClose}>
    <div className="moa-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="moa-shh"><b>{title}</b><button className="moa-ib" aria-label="닫기" onClick={onClose}><Ic n="x" /></button></div>
      <div className="moa-shb">{children}</div>
    </div>
  </div>
)
const Seg = ({ v, set, opts }) => <div className="moa-seg">{opts.map(([k, l]) => <button key={k} className={v === k ? 'on' : ''} onClick={() => set(k)}>{l}</button>)}</div>
const Fld = ({ l, children }) => <label className="moa-fld"><span>{l}</span>{children}</label>
const Amt = ({ v, set, ph = '0' }) => (
  <div className="moa-amt"><input inputMode="numeric" placeholder={ph} value={v ? num(+v) : ''} onChange={(e) => set(e.target.value.replace(/\D/g, '').slice(0, 12))} /><em>원</em></div>
)
const CardVisual = ({ c, onClick, mini }) => (
  <button className={`moa-cv ${c.tone}${mini ? ' mini' : ''}`} onClick={onClick}>
    <svg className="moa-cvg" viewBox="0 0 320 200" aria-hidden="true"><circle cx="270" cy="30" r="90" /><circle cx="300" cy="150" r="60" /></svg>
    <span className="moa-cvk">{c.kind === 'credit' ? '신용카드' : '체크카드'}</span>
    <b className="moa-cvn">{c.name}</b>
    <span className="moa-cvno">**** **** **** {c.last4}</span>
  </button>
)

/* ---------- 입력 폼 ---------- */
function Form({ f, db, commit, close }) {
  const nowIn = toInput(Date.now())
  const first = db.accounts[0]?.id
  const tx0 = f.k === 'edit' ? db.txs.find((t) => t.id === f.id) : null
  const [v, setV] = useState(() => {
    if (f.k === 'bank') return { dir: f.dir || 'out', acc: f.acc || first, amt: '', party: '', memo: '', at: nowIn }
    if (f.k === 'transfer') return { from: f.from || first, to: (db.accounts.find((a) => a.id !== (f.from || first)) || {}).id || '', amt: '', memo: '', at: nowIn }
    if (f.k === 'card') return { cardId: f.cardId || db.cards[0]?.id, amt: '', party: '', memo: '', at: nowIn }
    if (f.k === 'stock') { const s = db.stocks.find((x) => x.code === f.code) || db.stocks[0]; return { side: f.side || 'buy', code: s?.code, qty: '', price: String(s?.price || ''), acc: first, at: nowIn } }
    if (f.k === 'acct') return { name: '', amt: '' }
    if (f.k === 'price') return { price: String(db.stocks.find((s) => s.code === f.code)?.price || '') }
    if (f.k === 'edit') return { amt: String(tx0.amt), party: tx0.party, memo: tx0.memo || '', at: toInput(tx0.at) }
    return {}
  })
  const [e, setE] = useState('')
  const set = (p) => setV((x) => ({ ...x, ...p }))
  const need = f.k !== 'acct' && f.k !== 'price' && f.k !== 'edit' && !db.accounts.length
  const done = (err) => (err ? setE(err) : close())
  const when = () => { const w = fromInput(v.at); if (!w) { setE('일시를 확인해주세요'); return null } if (w > Date.now() + 60000) { setE('미래 일시는 입력할 수 없어요'); return null } return w }
  const go = () => {
    setE('')
    if (f.k === 'price') { const p = +v.price; if (!(p > 0)) return setE('시세를 입력해주세요'); return done(commit((d) => { d.stocks.find((s) => s.code === f.code).price = p; return d })) }
    if (f.k === 'acct') {
      if (!v.name.trim()) return setE('계좌 이름을 입력해주세요')
      const id = uid(), no = `3333-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 9000000) + 1000000)}`, amt = +v.amt || 0
      return done(commit((d) => { d.accounts.push({ id, name: v.name.trim(), no, open: 0 }); if (amt > 0) { const w = Date.now() - 1000; d.txs.push({ id: uid(), kind: 'bank', acc: id, dir: 'in', amt, at: w, eff: w, party: '최초 입금', memo: '', status: 'ok' }) } return d }))
    }
    const amt = f.k === 'stock' ? (+v.qty || 0) * (+v.price || 0) : +v.amt
    if (!(amt > 0)) return setE(f.k === 'stock' ? '수량과 가격을 입력해주세요' : '금액을 입력해주세요')
    if (f.k === 'stock' && !Number.isInteger(+v.qty)) return setE('수량은 정수로 입력해주세요')
    const w = when(); if (!w) return
    if (f.k === 'edit') {
      const ids = tx0.grp ? db.txs.filter((x) => x.grp === tx0.grp).map((x) => x.id) : [tx0.id]
      return done(commit((d) => { d.txs.forEach((x) => { if (ids.includes(x.id)) { x.amt = amt; x.at = w; x.eff = w; x.memo = v.memo.trim(); if (x.id === tx0.id && tx0.kind === 'bank') x.party = v.party.trim() || x.party } }); return d }))
    }
    if (f.k === 'bank') return done(commit((d) => { d.txs.push({ id: uid(), kind: 'bank', acc: v.acc, dir: v.dir, amt, at: w, eff: w, party: v.party.trim() || (v.dir === 'in' ? '입금' : '출금'), memo: v.memo.trim(), status: 'ok' }); return d }))
    if (f.k === 'transfer') {
      if (!v.to || v.to === v.from) return setE('받는 계좌를 다시 선택해주세요')
      const nm = (id) => db.accounts.find((a) => a.id === id).name, grp = uid()
      return done(commit((d) => {
        d.txs.push({ id: uid(), kind: 'transfer', grp, acc: v.from, dir: 'out', amt, at: w, eff: w, party: nm(v.to), memo: v.memo.trim(), status: 'ok' })
        d.txs.push({ id: uid(), kind: 'transfer', grp, acc: v.to, dir: 'in', amt, at: w, eff: w, party: nm(v.from), memo: v.memo.trim(), status: 'ok' })
        return d
      }))
    }
    if (f.k === 'card') {
      const c = db.cards.find((x) => x.id === v.cardId)
      if (!v.party.trim()) return setE('가맹점명을 입력해주세요')
      return done(commit((d) => { d.txs.push({ id: uid(), kind: 'card', cardId: c.id, acc: c.acc, dir: 'out', amt, at: w, eff: c.kind === 'credit' ? nextPay(w, c.payDay) : w, party: v.party.trim(), memo: v.memo.trim(), status: 'ok' }); return d }))
    }
    if (f.k === 'stock') {
      const s = db.stocks.find((x) => x.code === v.code)
      return done(commit((d) => { d.txs.push({ id: uid(), kind: 'stock', acc: v.acc, code: s.code, qty: +v.qty, price: +v.price, side: v.side, dir: v.side === 'buy' ? 'out' : 'in', amt, at: w, eff: w, party: `${s.name} ${v.side === 'buy' ? '매수' : '매도'}`, memo: '', status: 'ok' }); return d }))
    }
  }
  const accSel = (k) => <select value={v[k]} onChange={(x) => set({ [k]: x.target.value })}>{db.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
  const title = { bank: '거래 내역 추가', transfer: '계좌 이체', card: '카드 결제 내역 추가', stock: '주식 매매', acct: '계좌 추가', price: '시세 수정', edit: '거래 수정' }[f.k]
  if (need) return <Sheet title={title} onClose={close}><Empty>먼저 계좌를 추가해주세요</Empty></Sheet>
  const st = f.k === 'stock' ? db.stocks.find((x) => x.code === v.code) : null
  return (
    <Sheet title={title} onClose={close}>
      {f.k === 'bank' && <><Seg v={v.dir} set={(dir) => set({ dir })} opts={[['in', '입금'], ['out', '출금']]} /><Fld l="계좌">{accSel('acc')}</Fld></>}
      {f.k === 'transfer' && <><Fld l="출금 계좌">{accSel('from')}</Fld><Fld l="입금 계좌">{accSel('to')}</Fld></>}
      {f.k === 'card' && <Fld l="카드"><select value={v.cardId} onChange={(x) => set({ cardId: x.target.value })}>{db.cards.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.last4})</option>)}</select></Fld>}
      {f.k === 'stock' && (
        <>
          <Seg v={v.side} set={(side) => set({ side })} opts={[['buy', '매수'], ['sell', '매도']]} />
          <Fld l="종목"><select value={v.code} onChange={(x) => set({ code: x.target.value, price: String(db.stocks.find((s) => s.code === x.target.value).price) })}>{db.stocks.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}</select></Fld>
          <Fld l={v.side === 'buy' ? '출금 계좌' : '입금 계좌'}>{accSel('acc')}</Fld>
          <Fld l="수량(주)"><input inputMode="numeric" placeholder="0" value={v.qty} onChange={(x) => set({ qty: x.target.value.replace(/\D/g, '').slice(0, 9) })} /></Fld>
          <Fld l="1주당 가격(샘플 시세 · 수정 가능)"><Amt v={v.price} set={(price) => set({ price })} /></Fld>
          <p className="moa-sum">{st?.name} · 거래금액 <b>{won((+v.qty || 0) * (+v.price || 0))}</b></p>
        </>
      )}
      {f.k === 'acct' && <><Fld l="계좌 이름"><input maxLength={16} placeholder="예: 여행 통장" value={v.name} onChange={(x) => set({ name: x.target.value })} /></Fld><Fld l="최초 입금액(선택)"><Amt v={v.amt} set={(amt) => set({ amt })} /></Fld></>}
      {f.k === 'price' && <Fld l="현재가 (직접 입력)"><Amt v={v.price} set={(price) => set({ price })} /></Fld>}
      {(f.k === 'bank' || f.k === 'transfer' || f.k === 'card' || f.k === 'edit') && <Fld l="금액"><Amt v={v.amt} set={(amt) => set({ amt })} /></Fld>}
      {(f.k === 'bank' || (f.k === 'edit' && tx0.kind === 'bank')) && <Fld l="거래 상대방"><input maxLength={20} placeholder="예: 홍길동" value={v.party} onChange={(x) => set({ party: x.target.value })} /></Fld>}
      {f.k === 'card' && <Fld l="가맹점명"><input maxLength={20} placeholder="예: 한강카페" value={v.party} onChange={(x) => set({ party: x.target.value })} /></Fld>}
      {(f.k === 'bank' || f.k === 'transfer' || f.k === 'card' || f.k === 'edit') && <Fld l="메모"><input maxLength={30} placeholder="선택 입력" value={v.memo} onChange={(x) => set({ memo: x.target.value })} /></Fld>}
      {f.k !== 'acct' && f.k !== 'price' && <Fld l="거래 일시 (한국 시간)"><input type="datetime-local" value={v.at} max={nowIn} onChange={(x) => set({ at: x.target.value })} /></Fld>}
      {e && <p className="moa-err">{e}</p>}
      <button className="moa-btn pri" onClick={go}>{f.k === 'stock' ? (v.side === 'buy' ? '매수하기' : '매도하기') : f.k === 'transfer' ? '이체하기' : '확인'}</button>
    </Sheet>
  )
}

/* ---------- 메인 ---------- */
export default function ShinhanSOL({ close }) {
  const seed = useMemo(makeSeed, [])
  const [raw, setRaw] = usePersist('shinhan.sol.db', seed)
  const ok = raw && ['accounts', 'cards', 'stocks', 'txs'].every((k) => Array.isArray(raw[k]))
  const db = ok ? raw : seed
  useEffect(() => { if (!ok) setRaw(seed) }, [])

  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null) // {k:'acct'|'card'|'stock', id}
  const [sheet, setSheet] = useState(null) // {k:'form', f} | {k:'tx', id}
  const [seg, setSeg] = useState('acct')
  const [toast, setToast] = useState('')
  const [fl, setFl] = useState({ acc: 'all', dir: 'all', per: 'all', from: '', to: '', q: '' })
  const [cardSel, setCardSel] = useState(null)
  const [hide, setHide] = useState(false)
  const [sel, setSel] = useState(null)

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }
  const commit = (fn) => {
    const next = fn(JSON.parse(JSON.stringify(db)))
    const err = validate(next)
    if (err) return err
    setRaw(next)
    return null
  }
  const act = (fn, msg) => { const e = commit(fn); e ? say(e) : msg && say(msg); return !e }

  const now = Date.now()
  const bal = balances(db, now)
  const hold = holdings(db)
  const led = ledger(db, now)
  const cash = db.accounts.reduce((s, a) => s + bal[a.id], 0)
  const price = (code) => db.stocks.find((s) => s.code === code)?.price || 0
  const stockVal = db.stocks.reduce((s, x) => s + hold[x.code].qty * x.price, 0)
  const stockCost = db.stocks.reduce((s, x) => s + hold[x.code].cost, 0)
  const total = cash + stockVal
  const mk = mkey(now), ms = monthStat(db, mk)
  const accName = (id) => db.accounts.find((a) => a.id === id)?.name || '삭제된 계좌'
  const openForm = (f) => setSheet({ k: 'form', f })
  const openTx = (id) => setSheet({ k: 'tx', id })
  const del = (t) => {
    if (!window.confirm(t.grp ? '이체 내역을 삭제하면 두 계좌의 잔액이 함께 조정돼요. 삭제할까요?' : '이 거래를 삭제할까요? 잔액이 다시 계산돼요.')) return
    if (act((d) => { d.txs = d.txs.filter((x) => (t.grp ? x.grp !== t.grp : x.id !== t.id)); return d }, '삭제했어요')) setSheet(null)
  }

  /* 상세 시트 */
  const TxSheet = () => {
    const t = db.txs.find((x) => x.id === sheet.id)
    if (!t) return null
    const l = led.find((x) => x.id === t.id)
    const card = t.cardId && db.cards.find((c) => c.id === t.cardId)
    const kv = [
      ['구분', kindLabel(t)], ['거래 일시', full(t.at)],
      card?.kind === 'credit' && ['결제 예정일', dkey(t.eff)],
      ['계좌', accName(t.acc)], card && ['카드', `${card.name} (${card.last4})`],
      [t.kind === 'card' ? '가맹점' : '상대방', t.party], t.memo && ['메모', t.memo],
      t.kind === 'stock' && ['거래 내용', `${num(t.qty)}주 × ${num(t.price)}원`],
      l && ['거래 후 잔액', won(l.after)],
    ].filter(Boolean)
    return (
      <Sheet title="거래 상세" onClose={() => setSheet(null)}>
        <div className="moa-big"><span>{t.party}</span><b className={t.dir === 'in' ? 'in' : ''}>{t.dir === 'in' ? '+' : '-'}{won(t.amt)}</b>{t.status === 'cancel' && <em>결제 취소됨</em>}</div>
        <dl className="moa-kv">{kv.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        <div className="moa-two">
          {t.kind === 'card' && (t.status === 'ok'
            ? <button className="moa-btn" onClick={() => act((d) => { const x = d.txs.find((y) => y.id === t.id); x.status = 'cancel'; return d }, '결제를 취소했어요')}><Ic n="ban" s={16} />결제 취소</button>
            : <button className="moa-btn" onClick={() => act((d) => { d.txs.find((y) => y.id === t.id).status = 'ok'; return d }, '취소를 철회했어요')}><Ic n="undo" s={16} />취소 철회</button>)}
          {(t.kind === 'bank' || t.kind === 'transfer') && <button className="moa-btn" onClick={() => openForm({ k: 'edit', id: t.id })}><Ic n="edit" s={16} />수정</button>}
          <button className="moa-btn dng" onClick={() => del(t)}><Ic n="trash" s={16} />삭제</button>
        </div>
      </Sheet>
    )
  }

  /* ===== 탭 화면 ===== */
  const mny = (n) => (hide ? '•••••••원' : won(n))
  const eyeBtn = <button className="moa-eye" aria-label={hide ? '잔액 표시' : '잔액 숨기기'} onClick={() => setHide(!hide)}><Ic n={hide ? 'eyeoff' : 'eye'} s={18} /></button>
  const Home = () => {
    const bankR = led.filter((t) => t.kind === 'bank' || t.kind === 'transfer').slice(0, 4)
    const cardR = db.txs.filter((t) => t.kind === 'card' && t.at <= now).sort((a, b) => b.at - a.at).slice(0, 4)
    const stockR = db.txs.filter((t) => t.kind === 'stock' && t.status === 'ok' && t.at <= now).sort((a, b) => b.at - a.at).slice(0, 3)
    const selA = db.accounts.find((a) => a.id === sel) || db.accounts[0]
    return (
      <>
        <header className="moa-top">
          <Logo s={30} /><h1>신한 SOL뱅크</h1>
          <button className="moa-ib" aria-label="알림" onClick={() => say('새로운 알림이 없어요')}><Ic n="bell" /></button>
          <button className="moa-ib" aria-label="메뉴" onClick={() => setSheet({ k: 'menu' })}><Ic n="menu" /></button>
        </header>
        <section className="moa-hero">
          <span>전체 계좌 잔액 {eyeBtn}</span>
          <b>{mny(cash)}</b>
          {selA && <em className="moa-selc">선택 계좌 · {selA.name}</em>}
          <div className="moa-two">
            <button className="moa-btn w" onClick={() => openForm({ k: 'transfer', from: selA?.id })}>이체</button>
            <button className="moa-btn w" onClick={() => openForm({ k: 'bank', dir: 'in', acc: selA?.id })}>입금</button>
            <button className="moa-btn w" onClick={() => openForm({ k: 'bank', dir: 'out', acc: selA?.id })}>출금</button>
          </div>
        </section>
        <div className="moa-sec pad"><h3>내 계좌</h3><button onClick={() => openForm({ k: 'acct' })}>계좌 추가 <Ic n="plus" s={14} /></button></div>
        <div className="moa-card flat">
          {db.accounts.map((a) => (
            <div key={a.id} className={'moa-acc' + (selA?.id === a.id ? ' on' : '')}>
              <button className="moa-row" onClick={() => setSel(a.id)}>
                <i className="moa-ri k-bank"><Ic n="wallet" s={18} /></i>
                <div className="moa-rm"><b>{a.name}</b><span>{a.no}</span></div>
                <div className="moa-ra"><b>{mny(bal[a.id])}</b></div>
              </button>
              {selA?.id === a.id && <button className="moa-more" onClick={() => setView({ k: 'acct', id: a.id })}>거래 내역 보기 <Ic n="chev" s={14} /></button>}
            </div>
          ))}
          {!db.accounts.length && <Empty>등록된 계좌가 없어요</Empty>}
        </div>
        <div className="moa-sec pad"><h3>최근 입출금</h3><button onClick={() => setTab('tx')}>더보기 <Ic n="chev" s={14} /></button></div>
        <div className="moa-card flat">{bankR.map((t) => <TxRow key={t.id} t={t} db={db} onClick={() => openTx(t.id)} />)}{!bankR.length && <Empty>입출금 내역이 없어요</Empty>}</div>
        <div className="moa-sec pad"><h3>최근 카드 이용</h3><button onClick={() => setTab('card')}>더보기 <Ic n="chev" s={14} /></button></div>
        <div className="moa-card flat">{cardR.map((t) => <CardRow key={t.id} t={t} onClick={() => openTx(t.id)} />)}{!cardR.length && <Empty>카드 이용 내역이 없어요</Empty>}</div>
        <div className="moa-sec pad"><h3>최근 증권 거래</h3><button onClick={() => setTab('stock')}>더보기 <Ic n="chev" s={14} /></button></div>
        <div className="moa-card flat">{stockR.map((t) => <TxRow key={t.id} t={t} db={db} onClick={() => openTx(t.id)} />)}{!stockR.length && <Empty>증권 거래 내역이 없어요</Empty>}</div>
        <p className="moa-foot">신한 SOL뱅크는 가상의 연습용 앱이에요. 실제 금융기관과 연결되어 있지 않아요.</p>
      </>
    )
  }

  const Tx = () => {
    const rows = led.filter((t) => {
      if (fl.acc !== 'all' && t.acc !== fl.acc) return false
      if (fl.dir !== 'all' && t.dir !== fl.dir) return false
      if (fl.per === 'm' && mkey(t.eff) !== mk) return false
      if (fl.per === '7' && t.eff < now - 7 * DAY) return false
      if (fl.per === '30' && t.eff < now - 30 * DAY) return false
      if (fl.per === 'c') { if (fl.from && dkey(t.eff) < fl.from) return false; if (fl.to && dkey(t.eff) > fl.to) return false }
      const q = fl.q.trim()
      return !q || (t.party + (t.memo || '') + accName(t.acc)).includes(q)
    })
    const si = rows.filter((t) => t.dir === 'in').reduce((s, t) => s + t.amt, 0), so = rows.filter((t) => t.dir === 'out').reduce((s, t) => s + t.amt, 0)
    const up = (p) => setFl({ ...fl, ...p })
    return (
      <>
        <Head title="입출금" right={<button className="moa-ib" aria-label="거래 추가" onClick={() => openForm({ k: 'bank' })}><Ic n="plus" /></button>} />
        <section className="moa-card">
          <div className="moa-sec"><h3>전체 계좌 잔액</h3>{eyeBtn}</div>
          <b className="moa-num">{mny(cash)}</b>
          <div className="moa-lst">{db.accounts.map((a) => <button key={a.id} className="moa-line" onClick={() => setView({ k: 'acct', id: a.id })}><span>{a.name}<small>{a.no}</small></span><b>{mny(bal[a.id])}</b></button>)}</div>
          <div className="moa-two"><button className="moa-btn pri" onClick={() => openForm({ k: 'transfer' })}><Ic n="swap" s={16} />이체</button><button className="moa-btn" onClick={() => openForm({ k: 'bank', dir: 'in' })}><Ic n="plus" s={16} />입금 · 출금</button></div>
        </section>
        <div className="moa-search"><Ic n="search" s={18} /><input placeholder="거래처, 메모 검색" value={fl.q} onChange={(e) => up({ q: e.target.value })} />{fl.q && <button className="moa-ib" aria-label="지우기" onClick={() => up({ q: '' })}><Ic n="x" s={16} /></button>}</div>
        <div className="moa-chips"><button className={fl.acc === 'all' ? 'on' : ''} onClick={() => up({ acc: 'all' })}>전체 계좌</button>{db.accounts.map((a) => <button key={a.id} className={fl.acc === a.id ? 'on' : ''} onClick={() => up({ acc: a.id })}>{a.name}</button>)}</div>
        <Seg v={fl.dir} set={(dir) => up({ dir })} opts={[['all', '전체'], ['in', '입금'], ['out', '출금']]} />
        <div className="moa-chips"><>{[['all', '전체 기간'], ['m', '이번 달'], ['7', '최근 7일'], ['30', '최근 30일'], ['c', '직접 선택']].map(([k, l]) => <button key={k} className={fl.per === k ? 'on' : ''} onClick={() => up({ per: k })}>{l}</button>)}</></div>
        {fl.per === 'c' && <div className="moa-dr"><input type="date" value={fl.from} onChange={(e) => up({ from: e.target.value })} /><span>~</span><input type="date" value={fl.to} onChange={(e) => up({ to: e.target.value })} /></div>}
        <div className="moa-card moa-ms"><div><span>입금 합계</span><b className="in">{won(si)}</b></div><div><span>출금 합계</span><b>{won(so)}</b></div></div>
        {rows.length === 0 ? <Empty>조건에 맞는 거래 내역이 없어요</Empty> : <Groups rows={rows} keyOf={(t) => t.eff}>{(t) => <TxRow key={t.id} t={t} db={db} onClick={() => openTx(t.id)} />}</Groups>}
      </>
    )
  }

  const cardStat = (c) => {
    const mine = db.txs.filter((t) => t.cardId === c.id && t.status === 'ok')
    return { use: mine.filter((t) => mkey(t.at) === mk).reduce((s, t) => s + t.amt, 0), due: mine.filter((t) => t.eff > now).reduce((s, t) => s + t.amt, 0), pay: c.kind === 'credit' ? nextPay(now, c.payDay) : null }
  }
  const Cards = () => (
    <>
      <Head title="카드" right={<button className="moa-ib" aria-label="카드 결제 추가" onClick={() => openForm({ k: 'card' })}><Ic n="plus" /></button>} />
      {db.cards.length === 0 && <Empty>보유한 카드가 없어요</Empty>}
      {db.cards.map((c) => {
        const s = cardStat(c)
        return (
          <div className="moa-cw" key={c.id}>
            <CardVisual c={c} onClick={() => setView({ k: 'card', id: c.id })} />
            <div className="moa-card moa-ms"><div><span>이번 달 이용 금액</span><b>{won(s.use)}</b></div><div><span>{c.kind === 'credit' ? '결제 예정 금액' : '결제 방식'}</span><b>{c.kind === 'credit' ? won(s.due) : '즉시 출금'}</b></div></div>
            <p className="moa-sub">{c.kind === 'credit' ? `결제일 매월 ${c.payDay}일 · 다음 결제일 ${dkey(s.pay).slice(5).replace('-', '월 ')}일` : ''} 결제 계좌 {accName(c.acc)}</p>
          </div>
        )
      })}
      {(() => { const rows = db.txs.filter((t) => t.kind === 'card' && t.at <= now).sort((a, b) => b.at - a.at); return (<><div className="moa-sec pad"><h3>카드 이용 내역</h3></div>{rows.length === 0 ? <Empty>이용 내역이 없어요</Empty> : <Groups rows={rows} keyOf={(t) => t.at}>{(t) => <CardRow key={t.id} t={t} onClick={() => openTx(t.id)} />}</Groups>}</>) })()}
    </>
  )

  const Stocks = () => {
    const pl = stockVal - stockCost, rate = stockCost > 0 ? pct((pl / stockCost) * 100) : '-'
    const cls = pl >= 0 ? 'up' : 'dn'
    const list = [...db.stocks].sort((a, b) => (hold[b.code].qty > 0) - (hold[a.code].qty > 0))
    const trades = db.txs.filter((t) => t.kind === 'stock' && t.status === 'ok' && t.at <= now).sort((a, b) => b.at - a.at)
    return (
      <>
        <Head title="증권" right={<button className="moa-ib" aria-label="매매" onClick={() => openForm({ k: 'stock' })}><Ic n="plus" /></button>} />
        <section className="moa-card stk">
          <div className="moa-sec"><h3>총 주식 평가금액</h3></div>
          <b className="moa-num">{won(stockVal)}</b>
          <div className="moa-ms"><div><span>총 매입금액</span><b>{won(stockCost)}</b></div><div><span>평가손익</span><b className={cls}>{won(pl)}</b></div><div><span>수익률</span><b className={cls}>{rate}</b></div></div>
        </section>
        <p className="moa-note">표시된 현재가는 샘플 데이터이며 직접 입력한 값이에요. 실시간 시세가 아니고, 실제 주문도 이루어지지 않아요.</p>
        <div className="moa-sec pad"><h3>보유 종목</h3></div>
        <div className="moa-card flat">{list.map((s) => { const h = hold[s.code], ev = h.qty * s.price, p = ev - h.cost; return (
          <button key={s.code} className="moa-row" onClick={() => setView({ k: 'stock', id: s.code })}>
            <i className="moa-ri k-stock"><Ic n="chart" s={18} /></i>
            <div className="moa-rm"><b>{s.name}</b><span>{h.qty ? `${num(h.qty)}주 · 매입 ${num(h.cost / h.qty)}원` : `${s.code} · 미보유`}</span><span>현재가 {num(s.price)}원</span></div>
            <div className="moa-ra"><b>{won(ev)}</b>{h.qty > 0 && <span className={p >= 0 ? 'up' : 'dn'}>{won(p)} ({pct(h.cost ? (p / h.cost) * 100 : 0)})</span>}</div>
          </button>) })}</div>
        <div className="moa-sec pad"><h3>매수 · 매도 내역</h3></div>
        {trades.length === 0 ? <Empty>매매 내역이 없어요</Empty> : <Groups rows={trades} keyOf={(t) => t.at}>{(t) => <TxRow key={t.id} t={t} db={db} onClick={() => openTx(t.id)} />}</Groups>}
      </>
    )
  }

  /* ===== 상세 화면 ===== */
  const View = () => {
    const back = <button className="moa-ib" aria-label="뒤로" onClick={() => setView(null)}><Ic n="back" /></button>
    if (view.k === 'acct') {
      const a = db.accounts.find((x) => x.id === view.id)
      if (!a) return null
      const rows = led.filter((t) => t.acc === a.id)
      const linked = db.cards.some((c) => c.acc === a.id)
      return (
        <>
          <Head title={a.name} left={back} right={<button className="moa-ib" aria-label="계좌 삭제" onClick={() => {
            if (linked) return say('연결된 카드가 있어 삭제할 수 없어요')
            if (window.confirm('계좌와 거래 내역이 모두 삭제돼요. 삭제할까요?') && act((d) => { d.accounts = d.accounts.filter((x) => x.id !== a.id); d.txs = d.txs.filter((x) => x.acc !== a.id); return d }, '계좌를 삭제했어요')) setView(null)
          }}><Ic n="trash" /></button>} />
          <section className="moa-hero"><span>{a.no}</span><b>{won(bal[a.id])}</b>
            <div className="moa-two"><button className="moa-btn w" onClick={() => openForm({ k: 'bank', dir: 'in', acc: a.id })}>입금</button><button className="moa-btn w" onClick={() => openForm({ k: 'bank', dir: 'out', acc: a.id })}>출금</button><button className="moa-btn w" onClick={() => openForm({ k: 'transfer', from: a.id })}>이체</button></div></section>
          {rows.length === 0 ? <Empty>거래 내역이 없어요</Empty> : <Groups rows={rows} keyOf={(t) => t.eff}>{(t) => <TxRow key={t.id} t={t} db={db} onClick={() => openTx(t.id)} />}</Groups>}
        </>
      )
    }
    if (view.k === 'card') {
      const c = db.cards.find((x) => x.id === view.id)
      if (!c) return null
      const s = cardStat(c), rows = db.txs.filter((t) => t.cardId === c.id && t.at <= now).sort((a, b) => b.at - a.at)
      return (
        <>
          <Head title="카드 상세" left={back} right={<button className="moa-ib" aria-label="결제 추가" onClick={() => openForm({ k: 'card', cardId: c.id })}><Ic n="plus" /></button>} />
          <div className="moa-cw"><CardVisual c={c} /></div>
          <dl className="moa-card moa-kv"><div><dt>이번 달 이용 금액</dt><dd>{won(s.use)}</dd></div>{c.kind === 'credit' ? <><div><dt>결제 예정 금액</dt><dd>{won(s.due)}</dd></div><div><dt>결제일</dt><dd>매월 {c.payDay}일 (다음 {dkey(s.pay)})</dd></div></> : <div><dt>결제 방식</dt><dd>사용 즉시 계좌 출금</dd></div>}<div><dt>결제 계좌</dt><dd>{accName(c.acc)}</dd></div></dl>
          {rows.length === 0 ? <Empty>이용 내역이 없어요</Empty> : <Groups rows={rows} keyOf={(t) => t.at}>{(t) => <CardRow key={t.id} t={t} onClick={() => openTx(t.id)} />}</Groups>}
        </>
      )
    }
    const s = db.stocks.find((x) => x.code === view.id)
    if (!s) return null
    const h = hold[s.code], ev = h.qty * s.price, pl = ev - h.cost
    const rows = db.txs.filter((t) => t.code === s.code).sort((a, b) => b.at - a.at)
    return (
      <>
        <Head title={s.name} left={back} />
        <section className="moa-hero"><span>{s.code} · 현재가(샘플, 수동 입력)</span><b>{won(s.price)}</b>
          <div className="moa-two"><button className="moa-btn w" onClick={() => openForm({ k: 'stock', side: 'buy', code: s.code })}>매수</button><button className="moa-btn w" onClick={() => openForm({ k: 'stock', side: 'sell', code: s.code })}>매도</button><button className="moa-btn w" onClick={() => openForm({ k: 'price', code: s.code })}>시세 수정</button></div></section>
        <dl className="moa-card moa-kv">
          <div><dt>보유 수량</dt><dd>{num(h.qty)}주</dd></div><div><dt>평균 매입가</dt><dd>{h.qty ? won(h.cost / h.qty) : '-'}</dd></div><div><dt>평가금액</dt><dd>{won(ev)}</dd></div>
          <div><dt>평가손익</dt><dd className={pl >= 0 ? 'up' : 'dn'}>{won(pl)}</dd></div><div><dt>수익률</dt><dd className={pl >= 0 ? 'up' : 'dn'}>{h.cost > 0 ? pct((pl / h.cost) * 100) : '-'}</dd></div>
        </dl>
        <div className="moa-sec pad"><h3>매수 · 매도 내역</h3></div>
        {rows.length === 0 ? <Empty>매매 내역이 없어요</Empty> : <Groups rows={rows} keyOf={(t) => t.at}>{(t) => (
          <button key={t.id} className="moa-row" onClick={() => openTx(t.id)}><i className={'moa-ri k-stock ' + (t.side === 'sell' ? 'in' : '')}><Ic n="chart" s={18} /></i><div className="moa-rm"><b>{t.side === 'buy' ? '매수' : '매도'} {num(t.qty)}주</b><span>{tlabel(t.at)} · {num(t.price)}원 · {accName(t.acc)}</span></div><div className="moa-ra"><b>{won(t.amt)}</b></div></button>
        )}</Groups>}
      </>
    )
  }

  const tabs = [['home', '홈', 'home'], ['tx', '입출금', 'swap'], ['card', '카드', 'card'], ['stock', '증권', 'chart']]
  return (
    <div className="moa">
      <main className="moa-main" key={tab}>{tab === 'home' ? Home() : tab === 'tx' ? Tx() : tab === 'card' ? Cards() : Stocks()}</main>
      <nav className="moa-tabs">{tabs.map(([k, l, i]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setView(null) }}><Ic n={i} s={22} /><span>{l}</span></button>)}</nav>
      {view && <div className="moa-view"><div className="moa-main">{View()}</div></div>}
      {sheet?.k === 'form' && <Form key={JSON.stringify(sheet.f)} f={sheet.f} db={db} commit={commit} close={() => setSheet(null)} />}
      {sheet?.k === 'menu' && (
        <Sheet title="신한 SOL뱅크" onClose={() => setSheet(null)}>
          <div className="moa-card flat">{[['home', '홈', 'home'], ['tx', '입출금', 'swap'], ['card', '카드', 'card'], ['stock', '증권', 'chart']].map(([k, l, i]) => <button key={k} className="moa-row" onClick={() => { setTab(k); setView(null); setSheet(null) }}><i className="moa-ri"><Ic n={i} s={18} /></i><div className="moa-rm"><b>{l}</b></div><Ic n="chev" s={16} /></button>)}</div>
          <button className="moa-btn" onClick={() => { setSheet(null); close() }}>앱 닫기</button>
        </Sheet>
      )}
      {sheet?.k === 'tx' && TxSheet()}
      {toast && <div className="moa-toast">{toast}</div>}
    </div>
  )
}
