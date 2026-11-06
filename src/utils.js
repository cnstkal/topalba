export const pad = (n) => String(n).padStart(2, '0')

export const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 오후 6:34
export function fmtTime(ts) {
  const d = new Date(ts)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}`
}

// 상태바용 6:34
export function fmtStatus(d = new Date()) {
  return `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`
}

export function fmtDate(d = new Date()) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}
