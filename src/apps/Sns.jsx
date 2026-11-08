import { useEffect, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META } from '../data/characters'
import { SNS_ACCOUNTS, SNS_STORIES, SNS_HIGHLIGHTS, EXPLORE_TAGS } from '../data/story'
import { Avatar } from '../components/Overlays'
import Thread from '../components/Thread'
import { fmtTime } from '../utils'

const ME_ID = '_starhwa_'
const ME_INITIAL = '박'

// 사진 원본 URL. 크롭은 쿼리(fit=crop)로 처리해 화면 비율에 맞춘다.
const PHOTOS = {
  cafe: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0',
  food: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  travel: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
  street: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455',
  land: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
  daily: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
}
// '/'로 시작하면 public 폴더의 로컬 사진 (base 경로 반영)
const photoUrl = (key, w, h) => (key.startsWith('/') ? `${import.meta.env.BASE_URL}${key.slice(1)}` : `${PHOTOS[key]}?w=${w}&h=${h}&fit=crop&auto=format&q=80`)

const Ico = ({ d, fill, size = 26, stroke = '#000', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z'
const BUBBLE = 'M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z'
const SEND = 'M22 2L11 13M22 2l-7 20-4-9-9-4z'
const BOOKMARK = 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'
const SEARCH = 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35'
const HOME = 'M3 10.5L12 3l9 7.5V21h-6v-7H9v7H3z'
const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'
const CAMERA = 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
const CLOSE = 'M18 6L6 18M6 6l12 12'
const PLUS = 'M12 5v14M5 12h14'
const MENU = 'M4 9h16M4 15h16'
const REELS = 'M4 4h16v16H4zM10 8.5v7l6-3.5z'
// 상대 시간: 방금 전 / N분 전 / N시간 전 / N일 전 / N개월 전 / N년 전
const relTime = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}개월 전`
  return `${Math.floor(mo / 12)}년 전`
}
const fmtCount = (n) => (n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, '')}만` : n.toLocaleString())

const Dots = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#262626">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
)

const Back = ({ onClick }) => (
  <button className="back" onClick={onClick} aria-label="뒤로">
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L2 10l8 8" />
    </svg>
  </button>
)

// 사진 로딩 실패 또는 사진 없음 → 색상 배경 + 카메라 아이콘(또는 지정된 대체 글자)
function Photo({ photo, tint = '#e5e5ea', w = 900, h = 900, className = '', alt = '', fallback }) {
  const [failed, setFailed] = useState(false)
  if (!photo || !PHOTOS[photo] || failed) {
    return (
      <div className={`ph-fallback ${className}`} style={{ background: tint }} role="img" aria-label={alt}>
        {fallback ?? <Ico d={CAMERA} size={Math.max(20, Math.min(w, h) * 0.18)} stroke="#8e8e93" sw={1.4} />}
      </div>
    )
  }
  return (
    <img
      className={className}
      src={photoUrl(photo, w, h)}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

// 계정 프로필 원형 이미지 (사진 없으면 이니셜)
function AccountAvatar({ id, size = 32 }) {
  const acc = SNS_ACCOUNTS[id]
  const initial = id === ME_ID ? ME_INITIAL : (id || '?').slice(0, 1).toUpperCase()
  return (
    <span className="sns-av" style={{ width: size, height: size }}>
      <Photo
        photo={acc?.photo}
        tint="linear-gradient(#ddd,#bbb)"
        w={160}
        h={160}
        alt={id}
        fallback={<span style={{ fontSize: size * 0.42, color: '#fff' }}>{initial}</span>}
      />
    </span>
  )
}

// 스토리 / 하이라이트 뷰어. 자동 진행, 좌우 탭 이동, 길게 누르면 일시정지, 답장·반응
function StoryViewer({ title, owner, when, slides, onClose, onDone, onToast }) {
  const [idx, setIdx] = useState(0)
  const [hold, setHold] = useState(false)
  const [focus, setFocus] = useState(false)
  const [reply, setReply] = useState('')
  const [liked, setLiked] = useState(false)
  const [floats, setFloats] = useState([])
  const n = slides.length
  const paused = hold || focus

  const next = () => (idx < n - 1 ? setIdx(idx + 1) : (onDone || onClose)())
  const prev = () => idx > 0 && setIdx(idx - 1)
  const react = (emoji) => {
    const id = Date.now() + Math.random()
    setFloats((f) => [...f, { id, emoji }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100)
  }

  const head = (
    <div className="story-head">
      <div className="story-who">
        <AccountAvatar id={owner} size={28} />
        <div className="story-name">
          <b>{title}</b>
          {when && <span>{when}</span>}
        </div>
      </div>
      <div className="story-head-r">
        <Ico d={MENU} size={22} stroke="#fff" sw={2} />
        <button className="story-x" onClick={onClose} aria-label="닫기">
          <Ico d={CLOSE} size={22} stroke="#fff" sw={2.2} />
        </button>
      </div>
    </div>
  )

  if (!n) {
    return (
      <div className="story-view story-empty">
        {head}
        <div>{title === '내 스토리' ? '새 스토리를 추가해 보세요' : '스토리가 없습니다'}</div>
      </div>
    )
  }

  const s = slides[idx]
  return (
    <div className="story-view">
      <div className="story-stage">
      <Photo key={idx} photo={s.photo} tint="#2b2b30" w={540} h={960} className="story-photo" alt={s.text} />
      <div className="story-shade" />
      <div className="story-bars">
        {slides.map((_, i) => (
          <div key={i} className="story-bar">
            <i
              key={i === idx ? `cur${idx}` : `o${i}`}
              className={i < idx ? 'done' : i === idx ? 'run' : ''}
              style={i === idx ? { animationPlayState: paused ? 'paused' : 'running' } : undefined}
              onAnimationEnd={i === idx ? next : undefined}
            />
          </div>
        ))}
      </div>
      {head}
      <div
        className="story-zones"
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onPointerCancel={() => setHold(false)}
      >
        <button aria-label="이전 스토리" onClick={prev} />
        <button aria-label="다음 스토리" onClick={next} />
      </div>
      {floats.map((f) => (
        <span key={f.id} className="story-float">{f.emoji}</span>
      ))}
      </div>
      <div className="story-foot">
        <form
          className="story-reply"
          onSubmit={(e) => {
            e.preventDefault()
            if (!reply.trim()) return
            onToast(`${title}님에게 답장을 보냈습니다`)
            setReply('')
          }}
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="메시지 보내기..."
          />
        </form>
        <button
          className="story-like"
          onClick={() => {
            if (!liked) react('❤️')
            setLiked(!liked)
          }}
          aria-label="좋아요"
        >
          <Ico d={HEART} fill={liked ? '#ff3040' : 'none'} stroke={liked ? '#ff3040' : '#fff'} size={28} />
        </button>
        <button className="story-like" onClick={() => onToast(`${title}님에게 공유했습니다`)} aria-label="공유">
          <Ico d={SEND} stroke="#fff" size={28} />
        </button>
      </div>
    </div>
  )
}

// 게시물 카드 (피드 / 상세 화면 공용)
function PostCard({ post, state, actions, onUser, onComment, onMore, onShare }) {
  const liked = !!state.liked[post.id]
  const saved = !!state.saved[post.id]
  const [pop, setPop] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const doubleTap = () => {
    if (!liked) actions.like(post.id)
    setPop(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPop(false), 700)
  }
  const likes = post.likes + (liked ? 1 : 0)
  const when = post.ts ? relTime(post.ts) : post.ago
  const longCaption = post.text.length > 26

  return (
    <article className="post">
      <div className="post-head">
        <button className="post-user" onClick={() => onUser(post.user)}>
          <AccountAvatar id={post.user} size={32} />
          <span className="post-meta">
            <b>{post.user}</b>
            {post.loc && <i>{post.loc}</i>}
          </span>
        </button>
        <span className="post-head-r">
          {post.user !== ME_ID && !state.follows[post.user] && (
            <button className="post-follow" onClick={() => actions.follow(post.user)}>
              팔로우
            </button>
          )}
          <button className="post-more" onClick={onMore} aria-label="더보기">
            <Ico d={MENU} size={22} sw={2} />
          </button>
        </span>
      </div>
      <div className="post-img" onDoubleClick={doubleTap}>
        <Photo photo={post.photo} tint={post.tint} w={900} h={1125} className="post-photo" alt={post.text} />
        {pop && (
          <span className="heart-pop">
            <Ico d={HEART} fill="#fff" stroke="#fff" size={96} />
          </span>
        )}
      </div>
      <div className="post-actions">
        <button className="act" onClick={() => actions.like(post.id)} aria-label="좋아요">
          <Ico d={HEART} fill={liked ? '#ff3040' : 'none'} stroke={liked ? '#ff3040' : '#000'} size={26} />
          <span>{fmtCount(likes)}</span>
        </button>
        <button className="act" onClick={onComment} aria-label="댓글">
          <Ico d={BUBBLE} size={26} />
          {post.comments.length > 0 && <span>{fmtCount(post.comments.length)}</span>}
        </button>
        <button className="act" onClick={onShare} aria-label="공유">
          <Ico d={SEND} size={26} />
          {post.shares > 0 && <span>{fmtCount(post.shares)}</span>}
        </button>
        <span className="grow" />
        <button className="ic-btn" onClick={() => actions.save(post.id)} aria-label="저장">
          <Ico d={BOOKMARK} fill={saved ? '#000' : 'none'} size={26} />
        </button>
      </div>
      <div className={`post-cap ${longCaption && !expanded ? 'clip' : ''}`}>
        <b>{post.user}</b> {post.text}
      </div>
      {longCaption && !expanded && (
        <button className="post-more-txt" onClick={() => setExpanded(true)}>
          더 보기
        </button>
      )}
      {post.comments.length > 0 && (
        <button className="post-cm" onClick={onComment}>
          댓글 {post.comments.length}개 모두 보기
        </button>
      )}
      {post.comments.slice(-2).map((c, i) => (
        <div key={i} className="post-prev">
          <b>{c.user}</b> {c.text}
        </div>
      ))}
      {when && <div className="post-time">{when}</div>}
    </article>
  )
}

// 프로필 화면 (본인 / 다른 계정 공용)
function ProfileView({ uid, mine, state, actions, onBack, onPost, onHighlight, onEdit, onShare }) {
  const acc = SNS_ACCOUNTS[uid]
  const list = state.posts.filter((p) => p.user === uid)
  const following = !!state.follows[uid]
  const followers = mine ? 294 : acc.followers + (following ? 1 : 0)
  const followingCount = mine ? 303 : acc.following
  const name = mine ? '박성화' : (acc.name || uid)
  const bio = mine ? state.profile.bio : acc.bio

  return (
    <>
      <div className="sns-top">
        {mine ? <span /> : <Back onClick={onBack} />}
        <b>{mine ? ME_ID : uid}</b>
        <span />
      </div>
      <div className="scroll">
        <div className="prof">
          <AccountAvatar id={uid} size={80} />
          <div className="prof-stats">
            <div>
              <b>{list.length}</b>게시물
            </div>
            <div>
              <b>{followers.toLocaleString()}</b>팔로워
            </div>
            <div>
              <b>{followingCount}</b>팔로잉
            </div>
          </div>
        </div>
        <div className="prof-bio">
          <b>{name}</b>
          {bio && (
            <>
              <br />
              {bio}
            </>
          )}
        </div>
        <div className="prof-btns">
          {mine ? (
            <>
              <span onClick={onEdit}>프로필 편집</span>
              <span onClick={onShare}>프로필 공유</span>
            </>
          ) : (
            <>
              <span className={following ? '' : 'primary'} onClick={() => actions.follow(uid)}>
                {following ? '팔로잉' : '팔로우'}
              </span>
              <span onClick={onShare}>공유</span>
            </>
          )}
        </div>
        {mine && (
          <div className="hl-row">
            {SNS_HIGHLIGHTS.map((h) => (
              <button key={h.id} className="hl" onClick={() => onHighlight(h)}>
                <span className="hl-ring">
                  <Photo photo={h.photo} w={160} h={160} className="hl-img" alt={h.title} />
                </span>
                <span>{h.title}</span>
              </button>
            ))}
          </div>
        )}
        <div className="prof-tabs">
          <Ico d={GRID} size={22} />
        </div>
        {list.length === 0 ? (
          <div className="empty">게시물이 없습니다.</div>
        ) : (
          <div className="prof-grid">
            {list.map((p) => (
              <button key={p.id} className="grid-cell" onClick={() => onPost(p.id)} aria-label={p.text}>
                <Photo photo={p.photo} tint={p.tint} w={300} h={300} className="grid-img" alt={p.text} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const STORY_TRAY = [
  { key: 'me', name: '내 스토리', mine: true, when: '' },
  ...Object.keys(SNS_STORIES).map((id) => ({ key: id, name: id, when: '3시간 전' })),
]

export default function Sns({ params }) {
  const { state, actions } = useGame()
  const initialDm = params?.thread && params.thread.startsWith('dm:') ? params.thread : null
  const [tab, setTab] = useState(initialDm ? 'dm' : 'feed')
  const [dmId, setDmId] = useState(initialDm)
  const [sheet, setSheet] = useState(null) // { kind: 'comments' | 'more' | 'edit', id? }
  const [draft, setDraft] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [story, setStory] = useState(null)
  const [hl, setHl] = useState(null)
  const [postId, setPostId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const flash = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1600)
  }

  const posts = state.posts
  const postOf = (id) => posts.find((p) => p.id === id)
  const post = sheet?.id ? postOf(sheet.id) : null
  const dmRows = Object.keys(THREAD_META).filter((id) => THREAD_META[id].app === 'dm' && (state.threads[id] || []).length > 0)
  const unreadDm = dmRows.reduce((n, id) => n + state.threads[id].filter((m) => m.unread).length, 0)
  const newsOut = !!state.flags.newsOut
  const closeSheet = () => setSheet(null)

  if (dmId) return <Thread id={dmId} dm onBack={() => setDmId(null)} />

  const buildStory = (key) => ({ key, title: key, owner: key, when: '3시간 전', slides: SNS_STORIES[key] })
  const openStory = (s) => {
    if (s.mine) return setStory({ key: 'me', title: '내 스토리', owner: ME_ID, when: '', slides: [] })
    setStory(buildStory(s.key))
  }
  const closeStory = () => {
    if (story && story.key !== 'me') actions.storySeen(story.key)
    setStory(null)
  }
  // 현재 계정 다음에 남아 있는(아직 안 본) 스토리가 있으면 이어서 재생, 없으면 닫기
  const finishStory = () => {
    const keys = STORY_TRAY.filter((t) => !t.mine).map((t) => t.key)
    const i = keys.indexOf(story.key)
    const nxt = keys.find((k, j) => j > i && !state.storySeen[k])
    if (story.key !== 'me') actions.storySeen(story.key)
    setStory(nxt ? buildStory(nxt) : null)
  }

  const cardProps = {
    state,
    actions,
    onUser: (id) => setUserId(id),
    onShare: () => flash('링크를 복사했습니다'),
  }

  const q = query.trim().toLowerCase()
  const matchAccounts = Object.keys(SNS_ACCOUNTS).filter((id) => q && (id.includes(q) || SNS_ACCOUNTS[id].bio.toLowerCase().includes(q)))
  const matchPosts = posts.filter((p) => q && (p.text.toLowerCase().includes(q) || (p.loc || '').toLowerCase().includes(q)))
  const explorePosts = [...posts].sort((a, b) => b.likes - a.likes)
  const recommended = Object.keys(SNS_ACCOUNTS).filter((id) => !state.follows[id]).slice(0, 5)

  return (
    <div className="page sns">
      {tab === 'feed' && (
        <>
          <div className="ig-top">
            <button className="glass-btn" onClick={() => flash('새 게시물 작성은 준비 중입니다')} aria-label="새 게시물">
              <Ico d={PLUS} size={22} sw={2} />
            </button>
            <span className="ig-wordmark">Instagram</span>
            <button className="glass-btn" onClick={() => setTab('notif')} aria-label="알림">
              <Ico d={HEART} size={22} />
              {state.snsNotifs.length > 0 && <i className="dot" />}
            </button>
          </div>
          <div className="scroll">
            <div className="stories">
              {STORY_TRAY.map((s) => {
                const id = s.mine ? ME_ID : s.key
                const seen = !!state.storySeen[s.key]
                return (
                  <button key={s.key} className="story" onClick={() => openStory(s)}>
                    <div className={`ring-av ${s.mine ? 'mine' : seen ? 'seen' : ''}`}>
                      <div className="ring-in">
                        <AccountAvatar id={id} size={58} />
                      </div>
                      {s.mine && <i className="add">+</i>}
                    </div>
                    <span>{s.name}</span>
                  </button>
                )
              })}
            </div>
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                {...cardProps}
                onComment={() => setSheet({ kind: 'comments', id: p.id })}
                onMore={() => setSheet({ kind: 'more', id: p.id })}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="sns-top search-top">
            <label className="sns-search">
              <Ico d={SEARCH} size={16} stroke="#8e8e93" sw={2.2} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" />
            </label>
            {query && (
              <button className="cancel" onClick={() => setQuery('')}>
                취소
              </button>
            )}
          </div>
          <div className="scroll">
            {!q && (
              <>
                <div className="tag-row">
                  {EXPLORE_TAGS.map((t) => (
                    <button key={t} onClick={() => setQuery(t)}>
                      #{t}
                    </button>
                  ))}
                </div>
                {recommended.length > 0 && (
                  <>
                    <div className="sec-title">추천 계정</div>
                    <div className="rec-row">
                      {recommended.map((id) => (
                        <div key={id} className="rec-card">
                          <button onClick={() => setUserId(id)} className="rec-open">
                            <AccountAvatar id={id} size={56} />
                          </button>
                          <b>{id}</b>
                          <button className={`btn-follow ${state.follows[id] ? 'on' : ''}`} onClick={() => actions.follow(id)}>
                            {state.follows[id] ? '팔로잉' : '팔로우'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="xp-grid">
                  {explorePosts.map((p, i) => (
                    <button key={p.id} className={`grid-cell ${i % 5 === 0 ? 'xp-big' : ''}`} onClick={() => setPostId(p.id)} aria-label={p.text}>
                      <Photo photo={p.photo} tint={p.tint} w={i % 5 === 0 ? 600 : 300} h={i % 5 === 0 ? 600 : 300} className="grid-img" alt={p.text} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {q && (
              <>
                {matchAccounts.length === 0 && matchPosts.length === 0 && <div className="empty">검색 결과가 없습니다.</div>}
                {matchAccounts.map((id) => (
                  <div key={id} className="acc-row">
                    <button className="acc-main-btn" onClick={() => setUserId(id)}>
                      <AccountAvatar id={id} size={44} />
                    </button>
                    <div className="acc-main" onClick={() => setUserId(id)}>
                      <b>{id}</b>
                      <span>{SNS_ACCOUNTS[id].bio || '계정'}</span>
                    </div>
                    <button className={`btn-follow ${state.follows[id] ? 'on' : ''}`} onClick={() => actions.follow(id)}>
                      {state.follows[id] ? '팔로잉' : '팔로우'}
                    </button>
                  </div>
                ))}
                {matchPosts.length > 0 && (
                  <div className="prof-grid">
                    {matchPosts.map((p) => (
                      <button key={p.id} className="grid-cell" onClick={() => setPostId(p.id)} aria-label={p.text}>
                        <Photo photo={p.photo} tint={p.tint} w={300} h={300} className="grid-img" alt={p.text} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {tab === 'dm' && (
        <>
          <div className="sns-top">
            <Back onClick={() => setTab('feed')} />
            <b>yoonho_j</b>
            <span className="dm-compose" aria-label="새 메시지">
              <Ico d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={22} />
            </span>
          </div>
          <div className="scroll">
            <label className="dm-search">
              <Ico d={SEARCH} size={16} stroke="#8e8e93" sw={2.2} />
              <span>검색</span>
            </label>
            {dmRows.length === 0 && <div className="empty">메시지가 없습니다.</div>}
            {dmRows.map((id) => {
              const l = state.threads[id]
              const last = l[l.length - 1]
              const unread = l.some((m) => m.unread)
              return (
                <button key={id} className="msg-row" onClick={() => setDmId(id)}>
                  <Avatar id={THREAD_META[id].members[0]} size={52} />
                  <div className="msg-main">
                    <div className="msg-top">
                      <b style={{ fontWeight: unread ? 700 : 500 }}>{THREAD_META[id].title}</b>
                      <span>{fmtTime(last.ts)}</span>
                    </div>
                    <div className="msg-prev" style={{ color: unread ? '#000' : undefined }}>
                      {last.text}
                    </div>
                  </div>
                  {unread && <i className="unread-dot" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {tab === 'notif' && (
        <>
          <div className="sns-top">
            <Back onClick={() => setTab('feed')} />
            <b>알림</b>
            <span />
          </div>
          <div className="scroll">
            {state.snsNotifs.length === 0 && <div className="empty">새로운 알림이 없습니다.</div>}
            {state.snsNotifs.map((n) => (
              <div key={n.id} className="notif-row">
                <AccountAvatar id={n.user} size={40} />
                <div>
                  <b>{n.user}</b> {n.text}
                  <div className="muted">{relTime(n.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'profile' && (
        <ProfileView
          uid={ME_ID}
          mine
          state={state}
          actions={actions}
          onPost={(id) => setPostId(id)}
          onHighlight={(h) => setHl(h)}
          onEdit={() => {
            setBioDraft(state.profile.bio)
            setSheet({ kind: 'edit' })
          }}
          onShare={() => flash('프로필 링크를 복사했습니다')}
        />
      )}

      {(tab === 'feed' || tab === 'search' || tab === 'profile' || tab === 'dm') && (
        <nav className="ig-tabs">
          <button className={tab === 'feed' ? 'on' : ''} onClick={() => setTab('feed')} aria-label="홈">
            <Ico d={HOME} fill={tab === 'feed' ? '#000' : 'none'} size={26} />
          </button>
          <button onClick={() => flash('릴스는 준비 중입니다')} aria-label="릴스">
            <Ico d={REELS} size={26} />
          </button>
          <button className={tab === 'dm' ? 'on' : ''} onClick={() => setTab('dm')} aria-label="메시지">
            <Ico d={SEND} size={26} />
            {unreadDm > 0 && <i className="dot" />}
          </button>
          <button className="search-disabled" type="button" disabled aria-label="검색 (비활성화)">
            <Ico d={SEARCH} size={26} sw={1.8} />
          </button>
          <button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')} aria-label="프로필">
            <AccountAvatar id={ME_ID} size={26} />
          </button>
        </nav>
      )}

      {/* 다른 계정 프로필 */}
      {userId && !postId && (
        <div className="sns-overlay">
          <ProfileView
            uid={userId}
            state={state}
            actions={actions}
            onBack={() => setUserId(null)}
            onPost={(id) => setPostId(id)}
            onShare={() => flash('프로필 링크를 복사했습니다')}
          />
        </div>
      )}

      {/* 게시물 상세 */}
      {postId && postOf(postId) && (
        <div className="sns-overlay">
          <div className="sns-top">
            <Back onClick={() => setPostId(null)} />
            <b>게시물</b>
            <span />
          </div>
          <div className="scroll">
            <PostCard
              post={postOf(postId)}
              {...cardProps}
              onComment={() => setSheet({ kind: 'comments', id: postId })}
              onMore={() => setSheet({ kind: 'more', id: postId })}
            />
          </div>
        </div>
      )}

      {sheet?.kind === 'comments' && post && (
        <div className="sheet-wrap" onClick={closeSheet}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grab" />
            <div className="sheet-title">댓글</div>
            <div className="sheet-list">
              {post.comments.length === 0 && <div className="empty">첫 댓글을 남겨보세요.</div>}
              {post.comments.map((c, i) => (
                <div key={i} className="cm">
                  <AccountAvatar id={c.user} size={30} />
                  <div>
                    <b>{c.user}</b> {c.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              className="cm-input"
              onSubmit={(e) => {
                e.preventDefault()
                if (!draft.trim()) return
                actions.comment(post.id, draft.trim())
                setDraft('')
              }}
            >
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="댓글 달기..." />
              <button type="submit">게시</button>
            </form>
          </div>
        </div>
      )}

      {sheet?.kind === 'more' && post && (
        <div className="sheet-wrap" onClick={closeSheet}>
          <div className="sheet short" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grab" />
            <div className="sheet-menu">
              <button
                onClick={() => {
                  actions.save(post.id)
                  flash(state.saved[post.id] ? '저장을 취소했습니다' : '저장했습니다')
                  closeSheet()
                }}
              >
                {state.saved[post.id] ? '저장 취소' : '저장'}
              </button>
              <button
                onClick={() => {
                  flash('링크를 복사했습니다')
                  closeSheet()
                }}
              >
                링크 복사
              </button>
              {post.user !== ME_ID && (
                <button
                  onClick={() => {
                    actions.follow(post.user)
                    closeSheet()
                  }}
                >
                  {state.follows[post.user] ? '팔로우 취소' : `${post.user} 팔로우`}
                </button>
              )}
              <button onClick={closeSheet}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {sheet?.kind === 'edit' && (
        <div className="sheet-wrap" onClick={closeSheet}>
          <div className="sheet short" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grab" />
            <div className="sheet-title">프로필 편집</div>
            <form
              className="edit-form"
              onSubmit={(e) => {
                e.preventDefault()
                actions.saveProfile({ bio: bioDraft.trim() })
                closeSheet()
                flash('프로필을 저장했습니다')
              }}
            >
              <label htmlFor="bio">소개</label>
              <textarea id="bio" value={bioDraft} maxLength={80} onChange={(e) => setBioDraft(e.target.value)} />
              <button type="submit">완료</button>
            </form>
          </div>
        </div>
      )}

      {story && <StoryViewer key={story.key} title={story.title} owner={story.owner} when={story.when} slides={story.slides} onClose={closeStory} onDone={finishStory} onToast={flash} />}
      {hl && <StoryViewer title={hl.title} owner={ME_ID} when="" slides={hl.items} onClose={() => setHl(null)} onToast={flash} />}

      {toast && <div className="sns-toast">{toast}</div>}
    </div>
  )
}
