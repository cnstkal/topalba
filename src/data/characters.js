// 등장인물 데이터. 새 인물은 여기에 추가하면 됩니다.
// 주의: 실존 인물과 무관한 가상 인물입니다.
// 생년월일은 연도만 확정된 임시 값이며 언제든 교체 가능합니다.

// 플레이어(주인공) = 박성화. 화면은 성화의 휴대폰 시점입니다.
export const ME = 'sh'

export const CHARACTERS = {
  sh: { name: '박성화', tint: '#5ac8fa', birth: '1998-09-14', job: '탑알바' }, // 주인공 (임시 생일)

  hj: { name: '김홍중', tint: '#ff9f0a', birth: '1998-05-02', job: '아이돌 (활동 중)', bio: '탑알바에서 성화를 처음 만났을 당시에는 아직 이름이 알려지지 않은 무명 아이돌이었다. 성화는 그를 평범한 일반인으로 알았고, 유명해진 뒤에도 종종 연락을 이어가는 중. 입이 무거운 성화를 믿고 사적인 이야기도 편하게 털어놓는다.' }, // 임시 생일
  wy: { name: '정우영', tint: '#bf5af2', birth: '1999-07-19' }, // 임시 생일
  yh: { name: '정윤호', tint: '#8e8e93', birth: '1999-03-23' }, // 임시 생일
  bro: { name: '형', tint: '#8e8e93' },
  mom: { name: '엄마', tint: '#ff9f0a' },
  dad: { name: '아빠', tint: '#64d2ff' },
  regular: { name: '단골손님', tint: '#aeaeb2' },
  friend: { name: '친구', tint: '#30d158' },

  // 주변 인물 (현실감용 조연. 비중을 키우지 않음)
  boss: { name: '사장님', tint: '#64d2ff' }, // 탑알바 가게 사장님

  unknown: { name: '알 수 없음', tint: '#aeaeb2' },
}

export const initialOf = (id) => (CHARACTERS[id]?.name || '?').replace('@', '').slice(0, 1)

// 연락처 (전화 앱)
export const CONTACTS = [
  { id: 'bro', phone: '010-0000-0010' },
  { id: 'mom', phone: '010-0000-0011' },
  { id: 'dad', phone: '010-0000-0012' },
  { id: 'hj', phone: '010-0000-0001' },
  { id: 'yh', phone: '010-0000-0003' },
  { id: 'wy', phone: '010-0000-0002' },
  { id: 'boss', phone: '010-0000-0005' },
  { id: 'regular', phone: '010-0000-0013' },
  { id: 'friend', phone: '010-0000-0014' },
]

// 대화방 메타 정보 (메시지 / DM)
// 각 관계는 독립된 대화방으로 유지합니다. 그룹방은 두지 않습니다.
export const THREAD_META = {
  'msg:bro': { app: 'messages', title: '형', members: ['bro'] },
  'msg:mom': { app: 'messages', title: '엄마', members: ['mom'] },
  'msg:dad': { app: 'messages', title: '아빠', members: ['dad'] },
  'msg:ads': { app: 'messages', title: '광고 알림', members: ['unknown'] },
  'msg:regular': { app: 'messages', title: '단골손님', members: ['regular'] },
  'msg:boss': { app: 'messages', title: '사장님', members: ['boss'] },
}
