// 사파리 가상 인터넷 페이지. requireFlag 가 있으면 해당 플래그가 켜진 뒤에만 검색됨.
// 모든 매체/커뮤니티는 가상입니다.

export const WEB_PAGES = [
  {
    id: 'news1',
    site: '엔터포커스',
    url: 'entfocus.example/news/1',
    title: '[단독] ARCA 박성화, 비공개 연애 사실 알려져',
    keywords: ['박성화', 'arca', '아르카', '열애', '연애', '기사', '단독'],
    requireFlag: 'newsOut',
    body: [
      { type: 'p', text: '그룹 ARCA 멤버 박성화의 비공개 연애 사실이 알려지며 온라인이 술렁이고 있다.' },
      { type: 'p', text: '소속사 측은 아직 공식 입장을 내놓지 않은 상태다.' },
      { type: 'p', text: '(가상의 기사입니다. 구체적인 사건 전개는 추후 확정됩니다.)' },
    ],
  },
  {
    id: 'comm1',
    site: '팬덤광장',
    url: 'fandomsquare.example/arca/3021',
    title: '다들 이거 봤어? 진짜야?',
    keywords: ['박성화', 'arca', '아르카', '커뮤니티', '팬', '열애'],
    requireFlag: 'newsOut',
    body: [
      { type: 'p', text: '방금 올라온 기사 봤는데 이게 사실이야?' },
      { type: 'c', user: 'ㅇㅇ', text: '일단 공식 입장 나올 때까지 기다리자' },
      { type: 'c', user: '달빛', text: '상대방 개인 SNS까지 찾아가는 건 진짜 아니다' },
      { type: 'c', user: '익명', text: '솔직히 좀 충격이긴 하다' },
    ],
  },
  {
    id: 'weather',
    site: '날씨누리',
    url: 'weathernuri.example/seoul',
    title: '서울 오늘 날씨',
    keywords: ['날씨', '서울', '기온'],
    body: [
      { type: 'p', text: '서울: 구름 조금, 12°C' },
      { type: 'p', text: '밤부터 기온이 조금 내려가겠습니다.' },
    ],
  },
  {
    id: 'food',
    site: '맛집지도',
    url: 'matjipmap.example/dinner',
    title: '저녁 메뉴 고민될 때 인기 검색어',
    keywords: ['저녁', '맛집', '메뉴', '음식', '뭐 먹'],
    body: [
      { type: 'p', text: '찌개, 파스타, 치킨, 덮밥, 샤브샤브' },
      { type: 'p', text: '오늘 저녁은 어떤 메뉴가 끌리세요?' },
    ],
  },
]

export const BOOKMARKS = [
  { label: '날씨누리', q: '날씨' },
  { label: '맛집지도', q: '맛집' },
  { label: '팬덤광장', q: '커뮤니티' },
  { label: '엔터포커스', q: '기사' },
]
