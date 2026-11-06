// 등장인물 데이터. 새 인물은 여기에 추가하면 됩니다.
// 주의: 실존 인물과 무관한 가상 인물입니다.
// 생년월일은 연도만 확정된 임시 값이며 언제든 교체 가능합니다.

// 플레이어(주인공) = 박성화. 화면은 성화의 휴대폰 시점입니다.
export const ME = 'sh'

export const CHARACTERS = {
  sh: { name: '박성화', tint: '#5ac8fa', birth: '1998-09-14', job: '탑알바' }, // 주인공 (임시 생일)

  hj: { name: '김홍중', tint: '#ff9f0a', birth: '1998-05-02', job: '아이돌 (활동 중)' }, // 임시 생일
  wy: { name: '정우영', tint: '#bf5af2', birth: '1999-07-19' }, // 임시 생일
  yh: { name: '정윤호', tint: '#8e8e93', birth: '1999-03-23' }, // 임시 생일

  // 주변 인물 (현실감용 조연. 비중을 키우지 않음)
  nae: { name: '서나은', tint: '#30d158' }, // 탑알바 동료
  boss: { name: '사장님', tint: '#64d2ff' }, // 탑알바 가게 사장님

  unknown: { name: '알 수 없음', tint: '#aeaeb2' },
}

export const initialOf = (id) => (CHARACTERS[id]?.name || '?').replace('@', '').slice(0, 1)

// 연락처 (전화 앱)
export const CONTACTS = [
  { id: 'hj', phone: '010-0000-0001' },
  { id: 'wy', phone: '010-0000-0002' },
  { id: 'yh', phone: '010-0000-0003' },
  { id: 'nae', phone: '010-0000-0004' },
  { id: 'boss', phone: '010-0000-0005' },
]

// 대화방 메타 정보 (메시지 / DM)
// 각 관계는 독립된 대화방으로 유지합니다. 그룹방은 두지 않습니다.
export const THREAD_META = {
  'msg:hj': { app: 'messages', title: '김홍중', members: ['hj'] },
  'dm:wy': { app: 'dm', title: '정우영', members: ['wy'] },
  'msg:yh': { app: 'messages', title: '정윤호', members: ['yh'] },
  'msg:nae': { app: 'messages', title: '서나은', members: ['nae'] },
  'msg:boss': { app: 'messages', title: '사장님', members: ['boss'] },
}
