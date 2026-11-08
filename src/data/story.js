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
// - 성화와 홍중은 원래 알던 사이가 아닙니다. 탑알바에서 우연히 처음 만났으며,
//   당시 홍중은 아직 대중적으로 알려지지 않은 무명 아이돌이라 성화는 일반인으로 알았습니다.
//   홍중이 이후 유명해진 뒤에도 둘은 종종 연락합니다. 성화가 입이 무겁고 사생활을 지켜줘
//   홍중이 편하게 속내를 털어놓을 수 있는 몇 안 되는 지인입니다.
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
        text: '오늘 연습 끝나고 저녁 같이 먹을래? 탑알바 근처에 그때 자주 가던 곳 아직 있더라.',
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
          photo: 'street',
          loc: '서울 송파구',
          ago: '방금',
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
          photo: 'food',
          loc: '동네 빵집',
          ago: '방금',
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
      { t: 'msg', thread: 'msg:hj', from: 'hj', text: '오랜만이다. 요즘은 연락할 때마다 조심스러운데 너한텐 그냥 예전처럼 얘기해도 될 것 같아서.' },
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
        text: '이번 주 목요일 저녁 어때? 탑알바 끝나고 자주 가던 식당 아직 있더라.',
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
    { id: 'i1', from: 'sh', text: '그때 탑알바에서 처음 봤을 땐 진짜 그냥 일반인인 줄 알았는데', ts: Date.now() - 86400000, read: true },
    { id: 'i2', from: 'hj', text: 'ㅋㅋㅋ 그땐 아무도 몰랐지. 지금도 너는 똑같이 대해줘서 편하고', ts: Date.now() - 86000000 },
  ],
}

export const INITIAL_NOTES = [
  { id: 'n1', title: '장볼 것', body: '우유\n계란\n식빵\n두부', ts: Date.now() - 3 * 86400000 },
  { id: 'n2', title: '알바 시간표', body: '- 화/목 오후 근무\n- 금 저녁 근무 가능 여부 확인\n- 주말 오픈 조', ts: Date.now() - 86400000 },
]

export const INITIAL_MAILS = [
  {
    id: 'mail_init1', from: '무신사', addr: 'notice@musinsa.example',
    subject: '[광고] 이번 주 인기 상품 쿠폰 안내',
    preview: '회원님을 위한 할인 혜택을 확인해 보세요.',
    body: '안녕하세요. 무신사입니다.\n\n이번 주 인기 상품과 회원 전용 쿠폰을 안내드립니다.\n수신 설정은 마이페이지에서 변경할 수 있습니다.\n\n본 메일은 광고성 정보 수신 동의에 따라 발송되었습니다.',
    ts: Date.now() - 2 * 86400000, read: true,
  },
  {
    id: 'mail_init2', from: '네이버페이', addr: 'pay@notice.naver.example',
    subject: '[결제내역] 네이버페이 이용 내역 안내',
    preview: '최근 결제하신 내역을 안내드립니다.',
    body: '네이버페이 결제 내역을 안내드립니다.\n\n가맹점: 온라인 쇼핑몰\n결제금액: 24,800원\n결제수단: 등록 카드\n\n본 메일은 결제 정보 안내 메일입니다.',
    ts: Date.now() - 4 * 86400000, read: true,
  },
  {
    id: 'mail_init3', from: '오늘의집', addr: 'news@ohou.se.example',
    subject: '[광고] 오늘만 받을 수 있는 추천 혜택',
    preview: '관심 상품과 주간 할인 소식을 모았어요.',
    body: '안녕하세요. 오늘의집입니다.\n\n이번 주 인기 상품과 할인 소식을 전해드립니다.\n\n본 메일은 정기 수신 동의에 따라 발송되었습니다.',
    ts: Date.now() - 6 * 86400000, read: true,
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

// ── SNS 데이터 ──
// photo 값은 src/apps/Sns.jsx 의 PHOTOS 키 (cafe, food, travel, street, land, daily)
export const INITIAL_POSTS = [
  { id: 'p0a', user: 'cafe_seoul_log', photo: 'cafe', text: '오늘의 커피', loc: '서울 성수동', ago: '2시간 전', likes: 312, comments: [{ user: 'coffee_day', text: '맛있겠다' }], tint: '#f5e6d3' },
  { id: 'p0b', user: 'han_river_walk', photo: 'land', text: '퇴근길 하늘이 예뻐서', loc: '여의도 한강공원', ago: '5시간 전', likes: 508, comments: [], tint: '#d6ecff' },
  { id: 'ps1', user: '_starhwa_', photo: '/images/instagram/My/Post/1/IMG_9370.jpeg', photos: ['/images/instagram/My/Post/1/IMG_9370.jpeg', '/images/instagram/My/Post/1/IMG_9371.jpeg'], text: '쉬는 날 기록', loc: '', ago: '3일 전', likes: 41, comments: [{ user: 'wooyounggg__', text: '뭐야 여기 좋네' }], tint: '#e8f5e9' },
  { id: 'ps2', user: '_starhwa_', photo: '/images/instagram/My/Post/2/IMG_9027.jpeg', photos: ['/images/instagram/My/Post/2/IMG_9027.jpeg', '/images/instagram/My/Post/2/IMG_9028.jpeg'], text: '잠깐 바람 쐬러', loc: '바다', ago: '2주 전', likes: 96, comments: [{ user: 'yunou._.u', text: '사진 잘 나왔다' }], tint: '#d6ecff' },
  { id: 'ps3', user: '_starhwa_', photo: '/images/instagram/My/Post/3/IMG_6727.jpeg', photos: ['/images/instagram/My/Post/3/IMG_6727.jpeg', '/images/instagram/My/Post/3/IMG_6728.jpeg'], text: '🍚', loc: '', ago: '1주 전', likes: 57, comments: [{ user: 'no1likeme8_8', text: 'ㅋㅋㅋㅋ' }], tint: '#fff4cc' },
]

// 계정 프로필 (사진 키 / 소개 / 팔로워·팔로잉 수)
export const SNS_ACCOUNTS = {
  '_starhwa_': { name: '박성화', photo: '/images/instagram/My/Profile/IMG_1562.jpeg', bio: '', followers: 294, following: 303 },
  'no1likeme8_8': { name: '김홍중', photo: 'street', bio: '아이돌', followers: 0, following: 0 },
  'wooyounggg__': { name: '정우영', photo: 'food', bio: '', followers: 0, following: 0 },
  'yunou._.u': { name: '정윤호', photo: 'travel', bio: '', followers: 0, following: 0 },
  'oldschool_friend': { name: '고등학교 동창', photo: 'daily', bio: '', followers: 0, following: 0 },
  'afterwork_friend': { name: '회사에서 알게 된 사람', photo: 'cafe', bio: '', followers: 0, following: 0 },
  'samevibe_daily': { name: '일상 기록', photo: 'land', bio: '', followers: 0, following: 0 },
  cafe_seoul_log: { photo: 'cafe', bio: '서울 카페 기록 ☕', followers: 1204, following: 88 },
  han_river_walk: { photo: 'land', bio: '한강 산책 메모', followers: 3520, following: 210 },
  coffee_day: { photo: 'cafe', bio: '매일 커피', followers: 642, following: 301 },
  hello_star: { photo: 'travel', bio: '주말마다 어딘가로', followers: 978, following: 415 },
  seoul_walker: { photo: 'street', bio: '걷는 걸 좋아합니다', followers: 2210, following: 150 },
  daily_cafe_note: { photo: 'food', bio: '동네 빵집 기록', followers: 412, following: 96 },
  mint_tea: { photo: 'daily', bio: '', followers: 130, following: 240 },
}

export const SNS_FOLLOWING = {
  no1likeme8_8: true,
  wooyounggg__: true,
  'yunou._.u': true,
  oldschool_friend: true,
  afterwork_friend: true,
  samevibe_daily: true,
}

// 계정별 스토리 (열람 전후 테두리 구분용 키는 계정 id)
export const SNS_STORIES = {
  cafe_seoul_log: [
    { photo: 'cafe', text: '새 원두 도착' },
    { photo: 'food', text: '브런치 세트' },
  ],
  han_river_walk: [
    { photo: 'land', text: '노을 맛집' },
    { photo: 'street', text: '산책 끝' },
  ],
  coffee_day: [{ photo: 'cafe', text: '오늘도 아메리카노' }],
  hello_star: [
    { photo: 'travel', text: '주말엔 어디든' },
    { photo: 'daily', text: '좋아하는 노래 들으면서' },
  ],
}

// ════════════════════════════════════════════════════════════
// ★★★ [스토리 댓글] 데이터 — 요청한 내용만 여기에 추가 ★★★
// 키 = 스토리 주인 계정 아이디 (예: cafe_seoul_log, _starhwa_)
// ════════════════════════════════════════════════════════════
// ① 댓글 시트에 보이는 댓글 목록 (@멘션은 파란색으로 표시됨)
//   예) cafe_seoul_log: [{ user: 'coffee_day', text: '@hello_star 같이 가요!' }],
export const STORY_COMMENTS = {
}

// ② 스토리 화면 왼쪽 아래에 떠 있는 "내 답장" 말풍선 (내 프로필 사진 + 말풍선)
//   예) cafe_seoul_log: '우왕',
export const STORY_MY_REPLY = {
}
// ════════════════════════════════════════════════════════════

// 본인 프로필 하이라이트
export const SNS_HIGHLIGHTS = [
  { id: 'hl2', title: 'Bob', date: '11월 8일', photo: '/images/instagram/My/Bob/IMG_1514.jpeg', items: [{ photo: '/images/instagram/My/Bob/13E4739C-530C-4EFD-AD1D-60ABD56E2B1A.jpeg', text: '' }, { photo: '/images/instagram/My/Bob/86AF75B4-3C23-4238-B53A-513C36E033A9.jpeg', text: '' }, { photo: '/images/instagram/My/Bob/IMG_1514.jpeg', text: '' }, { photo: '/images/instagram/My/Bob/D9723346-730D-4C2E-9C65-00B48688ED37.jpeg', text: '' }, { photo: '/images/instagram/My/Bob/F94BB374-E39B-4BB4-B9FE-50AAA3BAC4EC.jpeg', text: '' }] },
]

export const INITIAL_PROFILE = { bio: '', name: '박성화', username: '_starhwa_', followers: 294, following: 303, posts: 3 }

export const EXPLORE_TAGS = ['카페', '한강', '맛집', '여행', '일상', '서울']

export const INITIAL_RECENTS = [
  { id: 'c1', from: 'nae', missed: false, ts: Date.now() - 2 * 86400000 },
  { id: 'c2', from: 'hj', missed: false, ts: Date.now() - 86400000 },
]
