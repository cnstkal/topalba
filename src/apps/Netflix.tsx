import { useEffect, useMemo, useRef, useState } from 'react'
import './Netflix.css'

const KEY = 'netflix-app-v2'
// 실제 재생 가능한 CC0 샘플 클립 (스트리밍 서버 대신 사용)
const SAMPLE = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const PHOTO = [
  'photo-1489599849927-2ee91cede3ba',
  'photo-1440404653325-ab127d49abc1',
  'photo-1485846234645-a62644f84728',
  'photo-1517604931442-7e0c8ed2963c',
]
const GRAD = [['#8a1c1c', '#1c0b0b'], ['#1c3f8a', '#0b111c'], ['#1c6b5a', '#0b1c18'], ['#6b3a1c', '#1c120b'], ['#5a1c8a', '#140b1c'], ['#8a1c5a', '#1c0b14']]
const AVATARS = [
  { color: '#E50914', glyph: ':)' }, { color: '#2b7de9', glyph: ':D' }, { color: '#f5a623', glyph: 'B)' },
  { color: '#3fb950', glyph: ';)' }, { color: '#9b59b6', glyph: '8)' }, { color: '#e84393', glyph: ':P' },
]
const GENRES = ['한국 드라마', '해외 드라마', '한국 영화', '해외 영화', '애니메이션', '다큐멘터리', '예능', '스릴러', '로맨스', '액션', 'SF', '판타지', '공포']
const CAPS = ['(바람 소리)', '꽃이 천천히 피어난다.', '이야기는 여기서 시작된다.', '(잔잔한 음악)']

// id|제목|s(시리즈)/m(영화)|장르|연도|등급|시즌 또는 러닝타임|설명|출연|감독
const RAW = `squid|오징어 게임|s|한국 드라마,스릴러|2021|18+|시즌 3|456억 원의 상금이 걸린 의문의 서바이벌에 빚더미에 오른 사람들이 목숨을 건다.|이정재,박해수,위하준|황동혁
glory|더 글로리|s|한국 드라마,스릴러|2022|18+|시즌 2|학교폭력의 상처를 안은 여자가 오랜 시간 공들여 복수의 판을 짠다.|송혜교,이도현,임지연|안길호
crash|사랑의 불시착|s|한국 드라마,로맨스|2019|15+|시즌 1|패러글라이딩 사고로 북한에 떨어진 재벌 상속녀를 숨겨주는 장교의 이야기.|현빈,손예진,서지혜|이정효
kingdom|킹덤|s|한국 드라마,공포,판타지|2019|18+|시즌 2|역병이 번진 조선, 왕위를 둘러싼 암투 속에서 되살아난 자들이 밤마다 깨어난다.|주지훈,배두나,류승룡|김성훈
hell|지옥|s|한국 드라마,공포,SF|2021|18+|시즌 2|천사가 나타나 죽음의 시각을 고지하고, 그 선고는 반드시 실행된다.|유아인,김현주,박정민|연상호
sweet|스위트홈|s|한국 드라마,공포|2020|18+|시즌 3|괴물로 변해가는 사람들 사이에서 아파트 주민들이 살아남기 위해 뭉친다.|송강,이진욱,이시영|이응복
school|오늘 우리 학교는|s|한국 드라마,공포|2022|18+|시즌 1|좀비 바이러스가 퍼진 고등학교에 고립된 학생들이 탈출을 시도한다.|박지후,윤찬영,조이현|이재규
myname|마이 네임|s|한국 드라마,액션|2021|18+|시즌 1|아버지의 죽음 뒤 조직에 잠입한 여고생이 경찰이 되어 진실을 쫓는다.|한소희,박희순,안보현|김진민
juvenile|소년심판|s|한국 드라마,스릴러|2022|15+|시즌 1|소년범을 혐오하는 판사가 소년부에서 아이들의 죄와 마주하는 법정 드라마.|김혜수,김무열,이성민|홍종찬
chef|흑백요리사: 요리 계급 전쟁|s|예능|2024|12+|시즌 2|무명의 요리사와 스타 셰프가 같은 주방에서 맞붙는 서바이벌 요리 예능.|백종원,안성재,정지선|김학민
stranger|기묘한 이야기|s|해외 드라마,SF,공포|2016|15+|시즌 4|인디애나의 작은 마을에서 소년이 사라지고, 정체 모를 소녀와 기이한 현상이 나타난다.|밀리 바비 브라운,핀 울프하드,위노나 라이더|더퍼 형제
witcher|위쳐|s|해외 드라마,판타지,액션|2019|18+|시즌 3|괴물 사냥꾼 게롤트가 운명에 얽힌 공주와 마법사를 만나 대륙의 전쟁에 휘말린다.|헨리 카빌,아냐 칼로트라,프레야 앨런|로런 슈미트 히시리치
bridgerton|브리저튼|s|해외 드라마,로맨스|2020|18+|시즌 3|19세기 런던 사교계, 브리저튼 가문 자녀들의 사랑과 혼담이 끊임없이 화제를 낳는다.|피비 다이네버,레게-장 페이지,나탈리 에먼|크리스 반 듀슨
narcos|나르코스|s|해외 드라마,액션|2015|18+|시즌 3|콜롬비아 마약왕을 추적하는 미국 요원들의 집요한 수사를 따라간다.|와그너 모라,페드로 파스칼,보이드 홀브룩|크리스 브랭카토
crown|더 크라운|s|해외 드라마|2016|15+|시즌 6|엘리자베스 2세의 즉위와 영국 왕실의 반세기를 그린 대하 드라마.|클레어 포이,올리비아 콜먼,이멜다 스턴턴|피터 모건
arcane|아케인|s|애니메이션,SF,판타지|2021|15+|시즌 2|번영의 도시 필트오버와 빈민가 자운, 두 자매의 갈라진 운명을 그린 애니메이션.|헤일리 스테인펠드,엘라 퍼넬,케빈 알레한드로|크리스티앙 링크
convenience|새벽 두 시의 편의점|s|한국 드라마,로맨스|2025|12+|시즌 1|심야 편의점 야간 근무자와 매일 같은 시각에 찾아오는 단골 사이에 싹트는 마음.|한서진,오도윤,강미래|정하윤
lighthouse|서해 등대|s|한국 드라마,스릴러|2025|15+|시즌 1|외딴 섬 등대에서 발견된 낡은 일지가 20년 전 실종 사건을 다시 불러낸다.|이도경,문서아,장태오|백승우
escape|주말 탈출 대작전|s|예능|2025|12+|시즌 1|출연자들이 매주 다른 도시에서 제한 시간 안에 미션을 풀고 돌아오는 리얼 버라이어티.|김도현,이채원,박세준|오민재
garden|별의 정원|s|애니메이션,판타지|2025|ALL|시즌 1|밤마다 별이 내려앉는 정원을 지키는 소녀와 작은 여우의 모험.|이서아,최민호,정다은|윤가람
lastnight|도시의 마지막 밤|s|해외 드라마,스릴러|2025|18+|시즌 1|정전이 닥친 대도시, 하룻밤 사이 벌어진 연쇄 사건을 쫓는 형사와 기자.|엘레나 프라이스,마커스 웨인,다니엘 최|사라 콜드웰
busan|부산행|m|한국 영화,공포,액션|2016|15+|1시간 58분|서울에서 부산으로 향하는 KTX 안에서 좀비 바이러스가 퍼지며 승객들의 사투가 시작된다.|공유,마동석,정유미|연상호
parasite|기생충|m|한국 영화,스릴러|2019|15+|2시간 12분|전원 백수인 가족이 부유한 가정에 하나둘 스며들며 예기치 못한 사건이 벌어진다.|송강호,이선균,조여정|봉준호
oldboy|올드보이|m|한국 영화,스릴러,액션|2003|18+|2시간 0분|이유도 모른 채 15년간 갇혔던 남자가 풀려나 자신을 가둔 자를 찾아 나선다.|최민식,유지태,강혜정|박찬욱
pamyo|파묘|m|한국 영화,공포,스릴러|2024|15+|2시간 14분|거액의 의뢰를 받은 무당과 풍수사가 수상한 묘를 이장하며 불길한 일을 겪는다.|최민식,김고은,유해진|장재현
hejil|헤어질 결심|m|한국 영화,로맨스,스릴러|2022|15+|2시간 18분|산에서 떨어져 죽은 남자의 사건을 수사하던 형사가 피의자에게 빠져든다.|박해일,탕웨이,이정현|박찬욱
extreme|극한직업|m|한국 영화,액션|2019|15+|1시간 51분|마약반 형사들이 잠복을 위해 치킨집을 인수했다가 뜻밖의 대박을 맞는다.|류승룡,이하늬,진선규|이병헌
crimecity|범죄도시|m|한국 영화,액션|2017|18+|1시간 48분|금천경찰서 강력반 형사가 조선족 범죄 조직의 잔혹한 폭력에 맞선다.|마동석,윤계상,조재윤|강윤성
inception|인셉션|m|해외 영화,SF,액션|2010|12+|2시간 28분|타인의 꿈에 들어가 생각을 훔치는 도둑이 마지막 의뢰로 생각을 심는 작전에 나선다.|레오나르도 디카프리오,조지프 고든레빗,엘리엇 페이지|크리스토퍼 놀란
interstellar|인터스텔라|m|해외 영화,SF|2014|12+|2시간 49분|황폐해진 지구를 떠나 인류가 살 새 행성을 찾아 웜홀 너머로 향하는 우주 비행사들.|매튜 매코너헤이,앤 해서웨이,제시카 차스테인|크리스토퍼 놀란
chihiro|센과 치히로의 행방불명|m|애니메이션,판타지|2001|ALL|2시간 5분|이사 가던 길에 신들의 온천장에 들어선 소녀가 부모를 구하기 위해 일을 시작한다.|히이라기 루미,이리노 미유,나쓰키 마리|미야자키 하야오
yourname|너의 이름은|m|애니메이션,로맨스,판타지|2016|12+|1시간 47분|서로의 몸이 뒤바뀌는 도쿄와 시골의 두 고등학생이 운명적인 재난에 맞닥뜨린다.|카미키 류노스케,카미시라이시 모네,나가사와 마사미|신카이 마코토
octopus|나의 문어 선생님|m|다큐멘터리|2020|ALL|1시간 25분|지쳐 있던 다큐 감독이 남아프리카 바다에서 만난 문어와 1년간 교감하는 기록.|크레이그 포스터|피파 얼리히, 제임스 리드
ourplanet|우리의 행성|s|다큐멘터리|2019|ALL|시즌 1|빙하부터 열대우림까지, 기후 변화가 지구 생태계에 미치는 영향을 영상으로 담았다.|데이비드 애튼버러|앨러스테어 포더길
lastflight|마지막 비행|m|해외 영화,액션|2024|15+|1시간 52분|납치당한 여객기에서 은퇴를 앞둔 기장이 승객들을 지키려 마지막 비행에 나선다.|토머스 라일리,소피아 알바레즈,케빈 오|마이클 번스
redmoon|붉은 달 아래서|m|한국 영화,공포|2024|18+|1시간 38분|붉은 달이 뜨는 밤마다 외딴 마을의 폐교에서 이상한 소리가 흘러나온다.|김하은,서준혁,배미영|조현우
eleventh|열한 번째 계절|m|한국 영화,로맨스|2025|12+|2시간 4분|십 년 만에 고향으로 돌아온 두 사람이 사라진 여름의 기억을 하나씩 꺼내 본다.|정유나,한시우,오세림|임수연
aurora|오로라 프로토콜|m|해외 영화,SF|2025|15+|2시간 11분|북극 관측소에서 수신된 정체불명의 신호가 인류의 통신망을 멈추게 한다.|리아 윈터스,오마르 하산,박진|엘리엇 크레이그
darkforest|검은 숲의 왕|m|해외 영화,판타지|2024|15+|2시간 18분|저주받은 숲을 다스리는 왕과 그를 쓰러뜨리려는 견습 기사의 운명적 대결.|토비아스 레인,클라라 보이드,앤더스 용|헬렌 마샬
silent|소리 없는 증인|m|한국 영화,스릴러|2025|15+|1시간 47분|살인 사건의 유일한 목격자가 청각 장애인 소녀라는 사실이 수사를 뒤흔든다.|김서현,박정훈,이수미|최경민
sea|바다의 기억|m|다큐멘터리|2025|ALL|1시간 32분|동해안 해녀들의 일상과 사라져 가는 바다 문화를 따라간 다큐멘터리.|고순자,김말례|한유림`

const ALL = RAW.split('\n').map((l, n) => {
  const [id, title, t, g, year, age, len, desc, cast, dir] = l.split('|')
  const series = t === 's'
  return {
    n, id, title, series, genres: g.split(','), year: +year, age, len, desc, cast: cast.split(','), dir,
    seasons: series ? +len.replace(/\D/g, '') : 0, eps: 6 + (n % 4) * 2,
  }
})
const BY = Object.fromEntries(ALL.map((c) => [c.id, c]))
const pick = (ids) => ids.map((i) => BY[i]).filter(Boolean)
const HOT = ['squid', 'stranger', 'pamyo', 'hell', 'glory', 'arcane', 'busan', 'bridgerton', 'sweet', 'inception', 'chef']
const POP = ['glory', 'crash', 'parasite', 'witcher', 'kingdom', 'extreme', 'narcos', 'yourname', 'crown', 'school', 'chihiro']
const TOP_ALL = ['squid', 'pamyo', 'glory', 'hell', 'chef', 'myname', 'busan', 'juvenile', 'stranger', 'hejil']
const TOP_S = ['squid', 'glory', 'hell', 'chef', 'myname', 'juvenile', 'stranger', 'sweet', 'school', 'crash']
const TOP_M = ['pamyo', 'busan', 'hejil', 'parasite', 'crimecity', 'inception', 'interstellar', 'extreme', 'oldboy', 'lastflight']
const SEED_PROG = { glory: { s: 1, e: 3, f: 0.4, t: 3 }, inception: { s: 1, e: 1, f: 0.65, t: 2 }, chef: { s: 1, e: 2, f: 0.2, t: 1 } }

const mkProfile = (id, name, a, kids, prog = {}) => ({ id, name, color: AVATARS[a].color, glyph: AVATARS[a].glyph, kids, list: [], hist: Object.keys(prog), prog, recent: [] })
const init = () => ({
  profiles: [mkProfile('p1', '성화', 0, false, SEED_PROG), mkProfile('p2', '우영', 1, false)],
  last: null,
})
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d && Array.isArray(d.profiles) && d.profiles.length) return d
  } catch { /* ignore */ }
  return null
}
const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const kidsOk = (c) => c.age === 'ALL' || c.age === '12+'

function Poster({ c, wide }) {
  const [bad, setBad] = useState(false)
  const g = GRAD[c.n % 6]
  return (
    <div className={`netflix-poster${wide ? ' netflix-poster-wide' : ''}`} style={{ background: `linear-gradient(160deg,${g[0]},${g[1]})` }}>
      {!bad && (
        <img src={`https://images.unsplash.com/${PHOTO[c.n % 4]}?w=${wide ? 640 : 400}`} alt="" loading="lazy"
          onError={() => setBad(true)} style={{ objectPosition: `${(c.n * 37) % 100}% ${(c.n * 53) % 100}%` }} />
      )}
      <span className="netflix-poster-t">{c.title}</span>
    </div>
  )
}

const Ic = {
  search: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>,
  back: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>,
  play: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>,
  pause: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>,
  plus: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 4v16M4 12h16" /></svg>,
  check: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>,
  x: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  back10: <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" /><text x="12" y="15.5" fontSize="7.5" fill="#fff" stroke="none" textAnchor="middle" fontWeight="700">10</text></svg>,
  fwd10: <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3-6.2M20 4v4h-4" /><text x="12" y="15.5" fontSize="7.5" fill="#fff" stroke="none" textAnchor="middle" fontWeight="700">10</text></svg>,
}

function Row({ title, items, onOpen, rank, wide, prog }) {
  if (!items.length) return null
  return (
    <section className="netflix-section">
      <h3 className="netflix-section-t">{title}</h3>
      <div className="netflix-row">
        {items.map((c, i) => (
          <button key={c.id} className={`netflix-item${rank ? ' netflix-item-rank' : ''}${wide ? ' netflix-item-wide' : ''}`} onClick={() => onOpen(c.id)}>
            {rank && <span className="netflix-rank">{i + 1}</span>}
            <div className="netflix-item-art">
              <Poster c={c} wide={wide} />
              {prog && <div className="netflix-bar"><i style={{ width: `${Math.round((prog[c.id]?.f || 0) * 100)}%` }} /></div>}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function Gate({ db, setDb, onPick }) {
  const [manage, setManage] = useState(false)
  const [ed, setEd] = useState(null)
  const ps = db.profiles
  const save = () => {
    const name = ed.name.trim().slice(0, 10)
    if (!name) return
    setDb((d) => {
      const { isNew, ...rest } = ed
      const np = { ...rest, name }
      return { ...d, profiles: isNew ? [...d.profiles, np] : d.profiles.map((p) => (p.id === np.id ? { ...p, name, color: np.color, glyph: np.glyph, kids: np.kids } : p)) }
    })
    setEd(null)
  }
  const del = () => {
    if (ps.length < 2) return
    setDb((d) => ({ ...d, profiles: d.profiles.filter((p) => p.id !== ed.id), last: d.last === ed.id ? null : d.last }))
    setEd(null)
  }
  const add = () => setEd({ isNew: true, id: 'p' + Date.now(), name: '', color: AVATARS[ps.length % 6].color, glyph: AVATARS[ps.length % 6].glyph, kids: false, list: [], hist: [], prog: {}, recent: [] })
  return (
    <div className="netflix-gate">
      <div className="netflix-gate-top">
        <span className="netflix-logo">NETFLIX</span>
        <button className="netflix-text-btn" onClick={() => setManage(!manage)}>{manage ? '완료' : '편집'}</button>
      </div>
      <h2 className="netflix-gate-t">{manage ? '프로필 관리' : '시청할 프로필을 선택하세요'}</h2>
      <div className="netflix-profiles">
        {ps.map((p) => (
          <button key={p.id} className={`netflix-profile${db.last === p.id ? ' netflix-profile-last' : ''}`} onClick={() => (manage ? setEd({ ...p }) : onPick(p.id))}>
            <div className="netflix-avatar" style={{ background: p.color }}>{p.glyph}{manage && <em className="netflix-avatar-edit">수정</em>}</div>
            <span>{p.name}</span>
            {p.kids && <b className="netflix-kids">KIDS</b>}
          </button>
        ))}
        {ps.length < 5 && (
          <button className="netflix-profile" onClick={add}>
            <div className="netflix-avatar netflix-avatar-add">{Ic.plus}</div>
            <span>프로필 추가</span>
          </button>
        )}
      </div>
      {ed && (
        <div className="netflix-modal">
          <div className="netflix-modal-box">
            <h3>{ed.isNew ? '프로필 추가' : '프로필 수정'}</h3>
            <div className="netflix-avatar netflix-avatar-big" style={{ background: ed.color }}>{ed.glyph}</div>
            <div className="netflix-swatches">
              {AVATARS.map((a) => (
                <button key={a.glyph} className={ed.glyph === a.glyph ? 'on' : ''} style={{ background: a.color }} onClick={() => setEd({ ...ed, color: a.color, glyph: a.glyph })}>{a.glyph}</button>
              ))}
            </div>
            <input className="netflix-input" value={ed.name} maxLength={10} placeholder="이름" onChange={(e) => setEd({ ...ed, name: e.target.value })} />
            <label className="netflix-check"><input type="checkbox" checked={ed.kids} onChange={(e) => setEd({ ...ed, kids: e.target.checked })} /> 키즈 프로필 (12세 이하 관람가만 표시)</label>
            <div className="netflix-modal-btns">
              <button className="netflix-btn-white" onClick={save}>저장</button>
              <button className="netflix-btn-gray" onClick={() => setEd(null)}>취소</button>
              {!ed.isNew && ps.length > 1 && <button className="netflix-btn-del" onClick={del}>프로필 삭제</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ c, me, pool, toggleList, play, open, back }) {
  const [season, setSeason] = useState(me.prog[c.id]?.s || 1)
  const inList = me.list.includes(c.id)
  const pr = me.prog[c.id]
  const similar = pool.filter((x) => x.id !== c.id && x.genres.some((g) => c.genres.includes(g))).slice(0, 9)
  const resumable = pr && pr.f < 0.95
  return (
    <div className="netflix-layer netflix-detail">
      <div className="netflix-hero netflix-hero-sm"><Poster c={c} wide /><div className="netflix-hero-fade" />
        <button className="netflix-back" onClick={back} aria-label="뒤로">{Ic.back}</button>
      </div>
      <div className="netflix-detail-body">
        <h1 className="netflix-title">{c.title}</h1>
        <p className="netflix-meta"><b className="netflix-green">{c.year}</b><span className="netflix-age">{c.age}</span>{c.series ? `시즌 ${c.seasons}개` : c.len}</p>
        <button className="netflix-btn-white netflix-btn-full" onClick={() => play(c.id, resumable ? pr.s : 1, resumable ? pr.e : 1)}>
          {Ic.play}<span>{resumable ? '이어서 재생' : '재생'}</span>
        </button>
        <p className="netflix-desc">{c.desc}</p>
        <p className="netflix-credit">출연: {c.cast.join(', ')}</p>
        <p className="netflix-credit">감독: {c.dir}</p>
        <p className="netflix-credit">장르: {c.genres.join(', ')}</p>
        <div className="netflix-actions">
          <button onClick={() => toggleList(c.id)}>{inList ? Ic.check : Ic.plus}<span>{inList ? '찜 해제' : '내가 찜한 콘텐츠'}</span></button>
        </div>
        {c.series && (
          <>
            <div className="netflix-seasons">
              {Array.from({ length: c.seasons }, (_, i) => (
                <button key={i} className={season === i + 1 ? 'on' : ''} onClick={() => setSeason(i + 1)}>시즌 {i + 1}</button>
              ))}
            </div>
            <h3 className="netflix-section-t netflix-pad0">회차 ({c.eps}개)</h3>
            {Array.from({ length: c.eps }, (_, i) => {
              const e = i + 1
              const cur = pr && pr.s === season && pr.e === e
              return (
                <button key={e} className="netflix-ep" onClick={() => play(c.id, season, e)}>
                  <div className="netflix-ep-art"><Poster c={{ ...c, n: c.n + e }} wide />{cur && <div className="netflix-bar"><i style={{ width: `${Math.round(pr.f * 100)}%` }} /></div>}</div>
                  <div className="netflix-ep-info"><b>{e}. {c.title} {e}화</b><span>{40 + ((c.n + e) % 4) * 5}분</span></div>
                </button>
              )
            })}
          </>
        )}
        <Row title="비슷한 콘텐츠" items={similar} onOpen={open} />
      </div>
    </div>
  )
}

function Player({ c, s, e, start, onSave, onNext, back }) {
  const vref = useRef(null)
  const box = useRef(null)
  const hideT = useRef(null)
  const live = useRef({ t: 0, d: 0 })
  const lastSave = useRef(0)
  const saveRef = useRef(onSave)
  saveRef.current = onSave
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [dur, setDur] = useState(0)
  const [ui, setUi] = useState(true)
  const [sheet, setSheet] = useState(null)
  const [cap, setCap] = useState('한국어')
  const [q, setQ] = useState('자동')
  const [err, setErr] = useState(false)
  const hasNext = c.series && e < c.eps

  const poke = () => {
    setUi(true)
    clearTimeout(hideT.current)
    hideT.current = setTimeout(() => setUi(false), 3200)
  }
  useEffect(() => () => {
    clearTimeout(hideT.current)
    const { t: ct, d } = live.current
    if (d) saveRef.current(Math.min(1, ct / d))
  }, [])

  const toggle = () => {
    const v = vref.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  }
  const seek = (x) => {
    const v = vref.current
    if (!v || !v.duration) return
    v.currentTime = Math.max(0, Math.min(v.duration, x))
    setT(v.currentTime)
    poke()
  }
  const full = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else box.current.requestFullscreen()
    } catch { /* 일부 환경에서는 지원 안 됨 */ }
  }
  return (
    <div className="netflix-layer netflix-player" ref={box} onClick={() => (ui && playing ? setUi(false) : poke())}>
      <video ref={vref} src={SAMPLE} playsInline preload="auto" className="netflix-video"
        onLoadedMetadata={(ev) => {
          const v = ev.currentTarget
          setDur(v.duration); live.current.d = v.duration
          if (start > 0 && start < 0.95) v.currentTime = start * v.duration
          v.play().catch(() => setPlaying(false))
        }}
        onTimeUpdate={(ev) => {
          const v = ev.currentTarget
          setT(v.currentTime); live.current.t = v.currentTime
          const now = Date.now()
          if (now - lastSave.current > 2000 && v.duration) { lastSave.current = now; saveRef.current(v.currentTime / v.duration) }
        }}
        onPlay={() => { setPlaying(true); poke() }}
        onPause={() => { setPlaying(false); setUi(true) }}
        onEnded={() => { live.current.t = 0; saveRef.current(1); if (hasNext) onNext(); else setUi(true) }}
        onError={() => setErr(true)} />
      {cap !== '끄기' && !err && playing && <div className="netflix-caption">{cap === '한국어' ? CAPS[Math.floor(t / 2) % CAPS.length] : ['(wind)', 'A flower slowly blooms.', 'The story begins here.', '(soft music)'][Math.floor(t / 2) % 4]}</div>}
      {err && <div className="netflix-err">샘플 영상을 불러오지 못했습니다.<br />네트워크 연결을 확인한 뒤 다시 시도해 주세요.</div>}
      <div className={`netflix-pui${ui || err ? ' on' : ''}`} onClick={(ev) => ev.stopPropagation()}>
        <div className="netflix-ptop">
          <button onClick={back} aria-label="뒤로">{Ic.back}</button>
          <div><b>{c.title}</b><span>{c.series ? `시즌 ${s}: ${e}화` : '샘플 영상'}</span></div>
        </div>
        <div className="netflix-pmid">
          <button onClick={() => seek(t - 10)} aria-label="10초 뒤로">{Ic.back10}</button>
          <button className="netflix-pbig" onClick={toggle} aria-label={playing ? '일시정지' : '재생'}>{playing ? Ic.pause : Ic.play}</button>
          <button onClick={() => seek(t + 10)} aria-label="10초 앞으로">{Ic.fwd10}</button>
        </div>
        <div className="netflix-pbot">
          <div className="netflix-seek">
            <input type="range" min="0" max={dur || 1} step="0.1" value={t} onChange={(ev) => seek(+ev.target.value)} style={{ '--p': `${dur ? (t / dur) * 100 : 0}%` }} />
            <span>{fmt(t)} / {fmt(dur)}</span>
          </div>
          <div className="netflix-ptools">
            {hasNext && <button onClick={onNext}>다음 회차</button>}
            <button onClick={() => setSheet('cap')}>자막 · {cap}</button>
            <button onClick={() => setSheet('q')}>화질 · {q}</button>
            <button onClick={full}>전체 화면</button>
          </div>
        </div>
      </div>
      {sheet && (
        <div className="netflix-sheet-bg" onClick={(ev) => { ev.stopPropagation(); setSheet(null) }}>
          <div className="netflix-sheet" onClick={(ev) => ev.stopPropagation()}>
            <h4>{sheet === 'cap' ? '자막' : '화질'}</h4>
            {(sheet === 'cap' ? ['끄기', '한국어', 'English'] : ['자동', '1080p', '720p', '480p']).map((o) => (
              <button key={o} className={(sheet === 'cap' ? cap : q) === o ? 'on' : ''} onClick={() => { sheet === 'cap' ? setCap(o) : setQ(o); setSheet(null) }}>{o}</button>
            ))}
            {sheet === 'q' && <p>샘플 영상은 단일 화질이라 선택값은 설정에만 반영됩니다.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Search({ me, pool, upd, open, back }) {
  const [q, setQ] = useState('')
  const kw = q.trim().toLowerCase()
  const res = useMemo(
    () => (kw ? pool.filter((c) => [c.title, c.dir, ...c.cast, ...c.genres, c.series ? '시리즈' : '영화'].some((s) => s.toLowerCase().includes(kw))) : []),
    [kw, pool],
  )
  const remember = (word) => {
    const w = word.trim()
    if (w) upd((p) => ({ ...p, recent: [w, ...p.recent.filter((x) => x !== w)].slice(0, 8) }))
  }
  return (
    <div className="netflix-layer netflix-search">
      <div className="netflix-search-bar">
        <button onClick={back} aria-label="뒤로">{Ic.back}</button>
        <input autoFocus value={q} placeholder="작품명, 배우, 감독, 장르 검색" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && remember(q)} />
        {q && <button onClick={() => setQ('')} aria-label="지우기">{Ic.x}</button>}
      </div>
      {!kw ? (
        <div className="netflix-search-body">
          {me.recent.length > 0 && (
            <>
              <div className="netflix-search-h"><h3>최근 검색어</h3><button className="netflix-text-btn" onClick={() => upd((p) => ({ ...p, recent: [] }))}>전체 삭제</button></div>
              {me.recent.map((w) => (
                <div key={w} className="netflix-recent">
                  <button onClick={() => setQ(w)}>{w}</button>
                  <button onClick={() => upd((p) => ({ ...p, recent: p.recent.filter((x) => x !== w) }))} aria-label="삭제">{Ic.x}</button>
                </div>
              ))}
            </>
          )}
          <h3 className="netflix-search-h2">지금 인기 있는 콘텐츠</h3>
          {pool.filter((c) => HOT.includes(c.id)).slice(0, 8).map((c) => (
            <button key={c.id} className="netflix-ep" onClick={() => { remember(c.title); open(c.id) }}>
              <div className="netflix-ep-art"><Poster c={c} wide /></div>
              <div className="netflix-ep-info"><b>{c.title}</b><span>{c.genres[0]}</span></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="netflix-search-body">
          <h3 className="netflix-search-h2">검색 결과 {res.length}건</h3>
          {res.length === 0 && <p className="netflix-empty">‘{q}’와(과) 일치하는 콘텐츠가 없습니다.</p>}
          <div className="netflix-grid">
            {res.map((c) => <button key={c.id} onClick={() => { remember(q); open(c.id) }}><Poster c={c} /></button>)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Netflix({ close }) {
  const [db, setDb] = useState(() => load() || init())
  const [pid, setPid] = useState(null)
  const [tab, setTab] = useState('home')
  const [stack, setStack] = useState([])
  const [genre, setGenre] = useState(GENRES[0])
  const [listFilter, setListFilter] = useState('전체')

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* 저장소 사용 불가 */ }
  }, [db])

  const me = db.profiles.find((p) => p.id === pid)
  const upd = (fn) => setDb((d) => ({ ...d, profiles: d.profiles.map((p) => (p.id === pid ? fn(p) : p)) }))
  const push = (x) => setStack((s) => [...s, x])
  const back = () => setStack((s) => s.slice(0, -1))
  const open = (id) => push({ t: 'detail', id })
  const play = (id, s, e) => push({ t: 'player', id, s, e })
  const toggleList = (id) => upd((p) => ({ ...p, list: p.list.includes(id) ? p.list.filter((x) => x !== id) : [id, ...p.list] }))
  const choose = (id) => { setDb((d) => ({ ...d, last: id })); setPid(id); setStack([]); setTab('home') }

  const pool = useMemo(() => (me?.kids ? ALL.filter(kidsOk) : ALL), [me])

  if (!me) return <div className="netflix-app"><Gate db={db} setDb={setDb} onPick={choose} /></div>

  const top = stack[stack.length - 1]
  const typed = pool.filter((c) => tab === 'series' ? c.series : tab === 'movie' ? !c.series : true)
  const inPool = (ids) => pick(ids).filter((c) => typed.includes(c))
  const hero = (tab === 'series' ? BY.glory : tab === 'movie' ? BY.pamyo : BY.squid)
  const heroC = typed.includes(hero) ? hero : typed[0]
  const cont = Object.entries(me.prog).filter(([id, v]) => v.f < 0.95 && BY[id] && typed.includes(BY[id])).sort((a, b) => b[1].t - a[1].t).map(([id]) => BY[id])
  const seen = new Set([...me.hist, ...me.list])
  const reco = typed.filter((c) => !seen.has(c.id)).sort((a, b) => ((b.genres.some((g) => pool.filter((x) => seen.has(x.id)).some((x) => x.genres.includes(g))) ? 1 : 0) - (a.genres.some((g) => pool.filter((x) => seen.has(x.id)).some((x) => x.genres.includes(g))) ? 1 : 0)))
  const listItems = me.list.map((i) => BY[i]).filter((c) => c && pool.includes(c) && (listFilter === '전체' || (listFilter === '시리즈' ? c.series : !c.series)))
  const tabs = [['home', '홈'], ['series', '시리즈'], ['movie', '영화'], ['list', '내가 찜한 콘텐츠']]

  return (
    <div className="netflix-app">
      <div className="netflix-scroll">
        <header className="netflix-head">
          <div className="netflix-head-row">
            <span className="netflix-logo">NETFLIX</span>
            <div className="netflix-head-r">
              <button onClick={() => push({ t: 'search' })} aria-label="검색">{Ic.search}</button>
              <button className="netflix-mini-avatar" style={{ background: me.color }} onClick={() => { setPid(null); setStack([]) }} aria-label="프로필 전환">{me.glyph}</button>
            </div>
          </div>
          <nav className="netflix-tabs">
            {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </nav>
        </header>

        {tab === 'list' ? (
          <div className="netflix-list-page">
            <h2 className="netflix-title netflix-pad">내가 찜한 콘텐츠</h2>
            <div className="netflix-seasons netflix-pad">
              {['전체', '시리즈', '영화'].map((f) => <button key={f} className={listFilter === f ? 'on' : ''} onClick={() => setListFilter(f)}>{f}</button>)}
            </div>
            {listItems.length === 0 ? <p className="netflix-empty">찜한 콘텐츠가 없습니다.<br />작품 상세 화면에서 ‘내가 찜한 콘텐츠’를 눌러 보세요.</p> : (
              <div className="netflix-grid netflix-pad">
                {listItems.map((c) => (
                  <button key={c.id} onClick={() => open(c.id)}><Poster c={c} /><em className="netflix-tag">{c.series ? '시리즈' : '영화'}</em></button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {heroC && (
              <div className="netflix-hero">
                <Poster c={heroC} wide />
                <div className="netflix-hero-fade" />
                <div className="netflix-hero-info">
                  <h1 className="netflix-hero-t">{heroC.title}</h1>
                  <p className="netflix-meta">{heroC.genres.slice(0, 2).join(' · ')} · {heroC.year}</p>
                  <p className="netflix-hero-d">{heroC.desc}</p>
                  <div className="netflix-hero-btns">
                    <button className="netflix-btn-white" onClick={() => play(heroC.id, 1, 1)}>{Ic.play}<span>재생</span></button>
                    <button className="netflix-btn-gray" onClick={() => toggleList(heroC.id)}>{me.list.includes(heroC.id) ? Ic.check : Ic.plus}<span>내가 찜한 콘텐츠</span></button>
                  </div>
                  <button className="netflix-text-btn netflix-info-link" onClick={() => open(heroC.id)}>상세 정보</button>
                </div>
              </div>
            )}
            <Row title="지금 뜨는 콘텐츠" items={inPool(HOT)} onOpen={open} />
            <Row title="넷플릭스 인기 콘텐츠" items={inPool(POP)} onOpen={open} />
            {tab === 'home' && <Row title="대한민국 TOP 10" items={pick(TOP_ALL).filter((c) => pool.includes(c))} onOpen={open} rank />}
            <Row title="이어보기" items={cont} onOpen={open} wide prog={me.prog} />
            {tab !== 'movie' && <Row title="오늘 대한민국의 TOP 10 시리즈" items={pick(TOP_S).filter((c) => pool.includes(c))} onOpen={open} rank />}
            {tab !== 'series' && <Row title="오늘 대한민국의 TOP 10 영화" items={pick(TOP_M).filter((c) => pool.includes(c))} onOpen={open} rank />}
            <Row title="넷플릭스 신작" items={typed.filter((c) => c.year >= 2025)} onOpen={open} />
            <Row title="추천 콘텐츠" items={reco.slice(0, 12)} onOpen={open} />
            <section className="netflix-section">
              <h3 className="netflix-section-t">장르별 콘텐츠</h3>
              <div className="netflix-chips">
                {GENRES.map((g) => <button key={g} className={genre === g ? 'on' : ''} onClick={() => setGenre(g)}>{g}</button>)}
              </div>
            </section>
            <Row title={genre} items={typed.filter((c) => c.genres.includes(genre))} onOpen={open} />
          </>
        )}
      </div>

      {top?.t === 'detail' && <Detail key={stack.length + top.id} c={BY[top.id]} me={me} pool={pool} toggleList={toggleList} play={play} open={open} back={back} />}
      {top?.t === 'search' && <Search me={me} pool={pool} upd={upd} open={open} back={back} />}
      {top?.t === 'player' && (
        <Player key={`${top.id}-${top.s}-${top.e}`} c={BY[top.id]} s={top.s} e={top.e}
          start={me.prog[top.id] && me.prog[top.id].s === top.s && me.prog[top.id].e === top.e ? me.prog[top.id].f : 0}
          onSave={(f) => upd((p) => ({ ...p, prog: { ...p.prog, [top.id]: { s: top.s, e: top.e, f, t: Date.now() } }, hist: [top.id, ...p.hist.filter((x) => x !== top.id)].slice(0, 50) }))}
          onNext={() => setStack((st) => [...st.slice(0, -1), { ...top, e: top.e + 1 }])}
          back={back} />
      )}
    </div>
  )
}
