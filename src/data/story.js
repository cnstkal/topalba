// ─────────────────────────────────────────────────────────────
// 스토리 데이터 (UI 코드와 완전히 분리)
//
// 이벤트 구조
// id      : 고유 ID
// delay   : 조건 충족 후 실행까지 대기 시간(ms). 화면에 시간이 표시되지 않음
// after   : 이 이벤트들이 모두 끝나야 실행 (없으면 게임 시작 직후)
// trigger : 'unlock' 이면 선택지/전화 응답 등으로 unlock 되어야만 실행
// effects : 실행되는 효과 목록
//
// 효과(t) 종류
// msg, notify, post, snsnotif, mail, call, ring, flag, unlock, ending
//
// 선택지(choices) 구조: { label, text?, flags?, score?, unlock? }
//
// 설정 메모
// - 주인공은 박성화. 김홍중 / 정우영 / 정윤호는 서로 접점이 없고,
//   각 관계는 독립적으로 진행합니다. 세 사람은 서로의 존재를 모릅니다.
// - 사건은 일상적인 연락, 약속, 근무 일정 위주입니다.
// - 엔딩 및 마지막 선택지 문구는 아직 확정하지 않아 placeholder 로 둡니다.
// ─────────────────────────────────────────────────────────────

export const EVENTS = [
  // ── 1. 평범한 하루 (게임 시작 후 약 1분) ─────────────────────

  {
    id: 'e_hj1',
    delay: 1500,
    effects: [
      { t: 'msg', thread: 'msg:hj', from: 'hj', text: '성화야 오늘 알바 몇 시에 끝나?' },
      { t: 'notify', app: 'messages', title: '김홍중', body: '성화야 오늘 알바 몇 시에 끝나?', thread: 'msg:hj' },
    ],
  },

  {
    id: 'e_nae',
    delay: 13000,
    effects: [
      { t: 'msg', thread: 'msg:nae', from: 'nae', text: '성화 씨, 내일 오전 근무 혹시 바꿔줄 수 있어요?' },
      { t: 'notify', app: 'messages', title: '서나은', body: '성화 씨, 내일 오전 근무 혹시 바꿔줄 수 있어요?', thread: 'msg:nae' },
    ],
  },

  {
    id: 'e_hj2',
    delay: 24000,
    after: ['e_hj1'],
    effects: [
      {
        t: 'msg',
        thread: 'msg:hj',
        from: 'hj',
        text: '오늘 연습 끝나고 저녁 같이 먹을래? 늦으면 그냥 말해줘',
        choices: [
          { label: '좋아, 같이 먹자', unlock: ['r_hj2'] },
          { label: '오늘은 좀 피곤해', unlock: ['r_hj2'] },
        ],
      },
    ],
  },

  {
    id: 'r_hj2',
    trigger: 'unlock',
    delay: 1800,
    effects: [{ t: 'msg', thread: 'msg:hj', from: 'hj', text: '응 그럼 이따 연락할게' }],
  },

  {
    id: 'e_mail0',
    delay: 34000,
    effects: [
      {
        t: 'mail',
        mail: {
          id: 'mail_notice',
          from: '카드사',
          addr: 'card@bank.example',
          subject: '[안내] 11월 결제 예정 금액 안내',
          preview: '이번 달 결제 예정 금액을 안내드립니다.',
          body: '안녕하세요, 고객님.\n\n11월 결제 예정 금액을 안내드립니다. 결제일 전에 잔액을 확인해 주시기 바랍니다.\n\n감사합니다.',
        },
      },
      { t: 'notify', app: 'mail', title: '카드사', body: '[안내] 11월 결제 예정 금액 안내' },
    ],
  },

  // ── 2. 일상 속 연락 ──────────────────────────────────────────

  {
    id: 'e_friend',
    delay: 62000,
    after: ['e_hj1'],
    effects: [
      { t: 'msg', thread: 'msg:yh', from: 'yh', text: '안녕하세요, 지난번에 가게에서 뵌 정윤호예요.' },
      { t: 'msg', thread: 'msg:yh', from: 'yh', text: '혹시 이번 주에 시간 괜찮으실지 여쭤보려고요.' },
      { t: 'notify', app: 'messages', title: '정윤호', body: '혹시 이번 주에 시간 괜찮으실지 여쭤보려고요.', thread: 'msg:yh' },
    ],
  },

  {
    id: 'e_sns1',
    delay: 7000,
    after: ['e_friend'],
    effects: [
      {
        t: 'post',
        post: {
          id: 'p1',
          user: 'seoul_walker',
          text: '오늘 날씨 너무 좋다. 점심 산책 굿',
          likes: 84,
          comments: [{ user: 'mint_tea', text: '저도 나가고 싶어요ㅎㅎ' }],
          tint: '#d6ecff',
        },
      },
      {
        t: 'post',
        post: {
          id: 'p2',
          user: 'daily_cafe_note',
          text: '새로 생긴 동네 빵집 줄이 너무 길어서 포기했어요',
          likes: 37,
          comments: [],
          tint: '#f5e6d3',
        },
      },
      { t: 'snsnotif', user: 'mint_tea', text: '회원님의 게시물을 좋아합니다.' },
    ],
  },

  {
    id: 'e_boss_call',
    delay: 9000,
    after: ['e_sns1'],
    effects: [
      { t: 'call', from: 'boss', missed: true },
      { t: 'msg', thread: 'msg:boss', from: 'boss', text: '성화 씨, 이번 주 금요일 저녁 근무 가능한지 확인 부탁드려요.' },
      { t: 'notify', app: 'phone', title: '부재중 전화', body: '사장님' },
    ],
  },

  {
    id: 'e_mail1',
    delay: 10000,
    after: ['e_sns1'],
    effects: [
      {
        t: 'mail',
        mail: {
          id: 'mail_gym',
          from: '○○ 헬스장',
          addr: 'help@gym.example',
          subject: '[안내] 회원권 갱신 안내',
          preview: '회원권 갱신 기간이 다가왔습니다.',
          body: '안녕하세요, ○○ 헬스장입니다.\n\n회원권 갱신 기간이 다가와 안내드립니다. 기간 내 갱신하시면 기존 혜택을 그대로 이용하실 수 있습니다.\n\n감사합니다.',
        },
      },
      { t: 'notify', app: 'mail', title: '○○ 헬스장', body: '[안내] 회원권 갱신 안내' },
    ],
  },

  // ── 3. 홍중과의 통화 (오랜만의 안부) ───────────────────────

  {
    id: 'e_hj_ring',
    delay: 12000,
    after: ['e_boss_call'],
    effects: [{ t: 'ring', from: 'hj', onAccept: ['e_hj_acc'], onDecline: ['e_hj_dec'] }],
  },

  {
    id: 'e_hj_acc',
    trigger: 'unlock',
    delay: 1500,
    effects: [
      { t: 'flag', key: 'answered', value: true },
      { t: 'msg', thread: 'msg:hj', from: 'hj', text: '오랜만에 목소리 들으니까 좋다. 시간 되면 밥 한번 먹자.' },
      { t: 'unlock', ids: ['e_hj_choice'] },
    ],
  },

  {
    id: 'e_hj_dec',
    trigger: 'unlock',
    delay: 1500,
    effects: [
      { t: 'flag', key: 'answered', value: false },
      { t: 'call', from: 'hj', missed: true },
      { t: 'msg', thread: 'msg:hj', from: 'hj', text: '바쁜가 보다. 시간 될 때 연락해.' },
      { t: 'unlock', ids: ['e_hj_choice'] },
    ],
  },

  {
    id: 'e_hj_choice',
    trigger: 'unlock',
    delay: 3000,
    effects: [
      {
        t: 'msg',
        thread: 'msg:hj',
        from: 'hj',
        text: '이번 주 목요일 저녁 어때? 예전에 가던 식당 아직 있더라',
        choices: [
          { label: '좋아, 그날 보자', score: { meet: 1 }, unlock: ['e_dm2'] },
          { label: '다음 주에 보자', score: { later: 1 }, unlock: ['e_dm2'] },
          { label: '이번엔 어려울 것 같아', score: { busy: 1 }, unlock: ['e_dm2'] },
        ],
      },
    ],
  },

  // ── 4. 우영의 DM ───────────────────────────────────────────

  {
    id: 'e_dm2',
    trigger: 'unlock',
    delay: 5000,
    effects: [
      {
        t: 'msg',
        thread: 'dm:wy',
        from: 'wy',
        text: '성화 오늘 시간 돼? 저녁에 잠깐 볼래?',
        choices: [
          { label: '좋아, 저녁에 보자', score: { yes: 1 }, unlock: ['e_final'] },
          { label: '오늘은 어려워', score: { no: 1 }, unlock: ['e_final'] },
          { label: '나중에 연락할게', score: { later: 1 }, unlock: ['e_final'] },
        ],
      },
      { t: 'notify', app: 'dm', title: '정우영', body: '성화 오늘 시간 돼? 저녁에 잠깐 볼래?', thread: 'dm:wy' },
    ],
  },

  // ── 5. 마지막 선택 → 엔딩 판정 ─────────────────────────────
  // 선택지 문구와 각 엔딩의 구체적인 내용은 추후 결정 예정 (placeholder)

  {
    id: 'e_final',
    trigger: 'unlock',
    delay: 6000,
    effects: [
      {
        t: 'msg',
        thread: 'msg:hj',
        from: 'hj',
        text: '마지막으로 하나만 물어볼게.',
        choices: [
          { label: '선택지 A', flags: { final: 'A' }, unlock: ['e_end'] },
          { label: '선택지 B', flags: { final: 'B' }, unlock: ['e_end'] },
          { label: '선택지 C', flags: { final: 'C' }, unlock: ['e_end'] },
          { label: '선택지 D', flags: { final: 'D' }, unlock: ['e_end'] },
        ],
      },
    ],
  },

  {
    id: 'e_end',
    trigger: 'unlock',
    delay: 2500,
    effects: [{ t: 'ending' }],
  },
]

export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]))

// ── 초기 데이터 (게임 시작 시점에 이미 있는 내용) ──────────────

export const INITIAL_THREADS = {
  'msg:hj': [
    { id: 'i1', from: 'sh', text: '어제 고생했어', ts: Date.now() - 86400000, read: true },
    { id: 'i2', from: 'hj', text: '너도! 얼른 자', ts: Date.now() - 86000000 },
  ],
}

export const INITIAL_NOTES = [
  { id: 'n1', title: '장볼 것', body: '우유\n계란\n식빵\n두부', ts: Date.now() - 3 * 86400000 },
  { id: 'n2', title: '알바 시간표', body: '- 화/목 오후 근무\n- 금 저녁 근무 가능 여부 확인\n- 주말 오픈 조', ts: Date.now() - 86400000 },
]

export const INITIAL_MAILS = [
  {
    id: 'mail_init1',
    from: '쇼핑몰',
    addr: 'event@shop.example',
    subject: '이번 주 한정 할인 쿠폰이 도착했어요',
    preview: '놓치기 전에 확인해 보세요.',
    body: '이번 주 한정 할인 쿠폰이 도착했어요.\n\n지금 바로 확인해 보세요.',
    ts: Date.now() - 2 * 86400000,
    read: true,
  },
]

export const INITIAL_SENT = [
  {
    id: 'sent1',
    from: '나',
    to: '사장님',
    addr: 'boss@shop.example',
    subject: '다음 달 근무 가능 시간 보내드립니다',
    preview: '사장님, 요청하신 근무 가능 시간 정리해서 보내드려요.',
    body: '사장님, 요청하신 근무 가능 시간 정리해서 보내드려요.\n확인 부탁드립니다.\n\n박성화 드림',
    ts: Date.now() - 4 * 86400000,
  },
]

export const INITIAL_POSTS = [
  { id: 'p0a', user: 'cafe_seoul_log', text: '오늘의 커피', likes: 312, comments: [{ user: 'coffee_day', text: '맛있겠다' }], tint: '#f5e6d3' },
  { id: 'p0b', user: 'han_river_walk', text: '퇴근길 하늘이 예뻐서', likes: 508, comments: [], tint: '#d6ecff' },
]

export const INITIAL_RECENTS = [
  { id: 'c1', from: 'nae', missed: false, ts: Date.now() - 2 * 86400000 },
  { id: 'c2', from: 'hj', missed: false, ts: Date.now() - 86400000 },
]
