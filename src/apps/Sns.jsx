import { useEffect, useRef, useState } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META } from '../data/characters'
import { SNS_ACCOUNTS, SNS_STORIES, SNS_HIGHLIGHTS, EXPLORE_TAGS, STORY_COMMENTS, STORY_MY_REPLY } from '../data/story'
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
  if (!photo || (!photo.startsWith('/') && !PHOTOS[photo]) || failed) {
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
    <span className="sns-av" data-uid={id} style={{ width: size, height: size }}>
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
  const [cmOpen, setCmOpen] = useState(false) // 스토리 댓글 시트
  // 같은 뷰어를 유지한 채 계정만 바뀌므로, 계정이 바뀌면 처음 사진부터 다시 시작
  useEffect(() => { setIdx(0); setLiked(false); setFloats([]) }, [owner])
  const n = slides.length
  const paused = hold || focus || cmOpen
  // 사진(슬라이드)마다 댓글을 붙일 수 있고, 없으면 스토리 주인 기준 데이터 사용
  const cmList = slides[idx]?.comments || STORY_COMMENTS[owner] || []
  const myReply = slides[idx]?.myReply ?? STORY_MY_REPLY[owner]
  // 스토리 왼쪽 아래 말풍선: 첫 번째 댓글(작성자 프로필 + 내용), 없으면 내 답장
  const bubble = cmList[0] || (myReply ? { user: ME_ID, text: myReply } : null)

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
          <b>
            {title}
            {when && <span className="story-date">{when}</span>}
          </b>
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
              key={i === idx ? `cur${owner}${idx}` : `o${i}`}
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
        {/* ★ [스토리 댓글] 댓글 버튼 */}
        <button className="story-like" onClick={() => setCmOpen(true)} aria-label="댓글">
          <Ico d={BUBBLE} stroke="#fff" size={28} />
        </button>
        <button className="story-like" onClick={() => onToast(`${title}님에게 공유했습니다`)} aria-label="공유">
          <Ico d={SEND} stroke="#fff" size={28} />
        </button>
      </div>

      {/* ★ [스토리 댓글] 내 답장 말풍선 (STORY_MY_REPLY) */}
      {bubble && (
        <div className="story-myreply">
          <AccountAvatar id={bubble.user} size={36} />
          <span>{bubble.text}</span>
        </div>
      )}

      {/* ★ [스토리 댓글] 댓글 시트 (STORY_COMMENTS) */}
      {cmOpen && (
        <div className="story-cm-wrap" onClick={() => setCmOpen(false)}>
          <div className="story-cm" onClick={(e) => e.stopPropagation()}>
            <div className="story-cm-grab" />
            <div className="story-cm-list">
              {cmList.map((c, i) => (
                <div key={i} className="story-cm-item">
                  <AccountAvatar id={c.user} size={44} />
                  <div>
                    <b>{c.user}</b>
                    <p>{c.text.split(/(@[\w._]+)/).map((t, j) => (t.startsWith('@') ? <em key={j}>{t}</em> : t))}</p>
                    <small>답글 달기</small>
                    {(c.replies || []).map((r, k) => (
                      <div key={k} className="story-cm-reply">
                        <AccountAvatar id={r.user} size={28} />
                        <div>
                          <b>{r.user}</b>
                          <p>{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="story-cm-in">
              <AccountAvatar id={ME_ID} size={44} />
              <div className="story-cm-box"><span>댓글을 달거나 친구를 @언급하세요...</span><i>GIF</i></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 게시물 카드 (피드 / 상세 화면 공용)
function PostCard({ post, state, actions, onUser, onComment, onMore, onShare, detail }) {
  const liked = !!state.liked[post.id]
  const saved = !!state.saved[post.id]
  const [pop, setPop] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [pi, setPi] = useState(0)
  const imgs = post.photos || [post.photo]
  const likers = [...new Set([...post.comments.map((c) => c.user), ...Object.keys(SNS_ACCOUNTS)])].filter((id) => id !== post.user).slice(0, 3)
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
    <article className={`post ${detail ? 'detail' : ''}`}>
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
        {imgs.length > 1 ? (
          <div className="post-track" onScroll={(e) => setPi(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {imgs.map((u) => (
              <div className="post-slide" key={u}>
                <Photo photo={u} tint={post.tint} w={900} h={1125} className="post-photo" alt={post.text} />
              </div>
            ))}
          </div>
        ) : (
          <Photo photo={post.photo} tint={post.tint} w={900} h={1125} className="post-photo" alt={post.text} />
        )}
        {imgs.length > 1 && <span className="post-count">{pi + 1}/{imgs.length}</span>}
        {pop && (
          <span className="heart-pop">
            <Ico d={HEART} fill="#fff" stroke="#fff" size={96} />
          </span>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="post-dots">{imgs.map((u, i) => <i key={u} className={i === pi ? 'on' : ''} />)}</div>
      )}
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
      {detail && (
        <div className="post-liked">
          <span className="pl-av">
            {likers.map((id) => <AccountAvatar key={id} id={id} size={26} />)}
          </span>
          <span><b>{likers[0]}</b>님 외 <b>여러 명</b>이 좋아합니다</span>
        </div>
      )}
      <div className="post-cap">
        <b>{post.user}</b> {post.text}
      </div>
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
function ProfileView({ uid, mine, state, actions, onBack, onPost, onHighlight, onEdit, onShare, onMessage }) {
  const acc = SNS_ACCOUNTS[uid]
  const list = state.posts.filter((p) => p.user === uid)
  const following = !!state.follows[uid]
  const followers = mine ? 572 : acc.followers + (following ? 1 : 0)
  const followingCount = mine ? 54 : acc.following
  const name = mine ? '박성화' : (acc.name || uid)
  const bio = mine ? state.profile.bio : acc.bio

  return (
    <>
      {mine ? (
        <div className="sns-top me-top">
          <Ico d="M12 5v14M5 12h14" size={28} sw={2.2} />
          <b>{ME_ID}<Ico d="M6 9l6 6 6-6" size={16} sw={2.4} /></b>
          <Ico d="M4 7h16M4 12h16M4 17h16" size={28} sw={2.2} />
        </div>
      ) : (
        <div className="sns-top">
          <Back onClick={onBack} />
          <b>{uid}</b>
          <span />
        </div>
      )}
      <div className="scroll">
        <div className={`prof ${mine ? 'me' : ''}`}>
          {mine ? (
            <span className="me-av"><AccountAvatar id={uid} size={100} /><i>+</i></span>
          ) : (
            <AccountAvatar id={uid} size={80} />
          )}
          <div className="prof-stats">
            <div>
              <b>{mine ? list.length : (acc.posts ?? list.length)}</b>게시물
            </div>
            <div>
              <b>{followers.toLocaleString()}</b>팔로워
            </div>
            <div>
              <b>{followingCount}</b>팔로잉
            </div>
          </div>
        </div>
        {mine ? (
          <div className="me-pill"><Ico d="M17 8.500C16 5.800 13 4 10 4.500 6.500 5 4 8 4 12c0 4 2.500 7.500 7 7.500 3.500 0 6-2 6-4.500 0-2.500-2-4-4.500-4-2 0-3.500 1-3.500 2.500 0 1.200 1 2 2.200 2 2 0 3-1.800 3-5" size={16} sw={2.4} />{ME_ID}</div>
        ) : (
          <div className="prof-bio">
            <b>{name}</b>
            {bio && (
              <>
                <br />
                {bio}
              </>
            )}
          </div>
        )}
        <div className="prof-btns">
          {mine ? (
            <>
              <span onClick={onEdit}>프로필 편집</span>
              <span onClick={onShare}>프로필 공유</span>
              <span className="me-add"><Ico d="M15 20v-1.500a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9 11a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM19 8v6M16 11h6" size={22} sw={2.2} /></span>
            </>
          ) : (
            <>
              <span className={following ? '' : 'primary'} onClick={() => actions.follow(uid)}>
                {following ? '팔로잉' : '팔로우'}
              </span>
              <span onClick={onMessage}>메시지</span>
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
        <div className={`prof-tabs ${mine ? 'me' : ''}`}>
          <span className="on"><Ico d={GRID} size={24} /></span>
          {mine && <span><Ico d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" size={24} sw={1.8} /></span>}
          {mine && <span><Ico d="M4 8a2 2 0 0 1 2-2h2l1.500-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={24} sw={1.8} /></span>}
        </div>
        {list.length === 0 ? (
          <div className="empty">게시물이 없습니다.</div>
        ) : (
          <div className="prof-grid">
            {list.map((p) => (
              <button key={p.id} className="grid-cell" onClick={() => onPost(p.id)} aria-label={p.text}>
                <Photo photo={p.photo} tint={p.tint} w={300} h={300} className="grid-img" alt={p.text} />
                {p.photos?.length > 1 && (
                  <span className="grid-multi"><Ico d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2M4 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#fff" stroke="#fff" size={22} sw={1.6} /></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const DM_ROWS = [
  { id: 'yunou._.u', name: '정윤호', text: '새 메시지 3개+', ago: '1일', unread: true, ring: true },
  { id: 'wooyounggg__', name: '정우영', text: '야 뭐함 ㅋㅋ', ago: '3일' },
  { id: 'no1likeme8_8', name: '김홍중', text: '이거 봐 ㅋㅋㅋㅋ', ago: '5일', unread: true },
]

// DM 대화 내용 (t=시간 구분선, m=내 메시지, o=상대 메시지)
const DM_MSGS = [
  [['t', '11월 7일 오후 9:12'], ['o', '형 오늘 시간 괜찮아요?'], ['m', '응 왜'], ['o', '저녁에 밥 먹을래요'], ['o', '새로 생긴 데 있는데'], ['m', '어디'], ['o', '성수쪽이요 ㅋㅋ'], ['m', '좋아 몇시'], ['t', '11월 8일 오후 6:40'], ['o', '7시 반 어때요'], ['o', '예약해둘게요'], ['m', 'ㅇㅋ 늦지마']],
  [['t', '11월 6일 오후 2:03'], ['o', '야 뭐함 ㅋㅋ'], ['m', '그냥 누워있음'], ['o', '나가자 심심해'], ['m', '귀찮은데'], ['o', '치킨 쏜다'], ['m', '지금 나감ㅋㅋㅋ'], ['o', 'ㅋㅋㅋㅋ 빠르네']],
  [['t', '11월 4일 오후 11:21'], ['o', '이거 봐 ㅋㅋㅋㅋ'], ['o', '진짜 웃김'], ['m', '뭔데'], ['o', '릴스 보냈음'], ['m', 'ㅋㅋㅋㅋㅋ 미쳤다'], ['m', '나도 보내줄게'], ['o', 'ㅇㅇ']],
  [['t', '11월 2일 오후 8:15'], ['o', '이번 주말에 다 같이 보자'], ['m', '나 가능'], ['o', '나도 ㅇㅇ'], ['o', '장소는 내가 정할게'], ['m', '굳']],
  [['t', '10월 26일 오전 1:36'], ['m', '자냐'], ['o', '아직'], ['m', '내일 몇시에 만나'], ['o', '점심쯤?'], ['m', 'ㅇㅋ']],
]

function DmChat({ row, onBack }) {
  const [msgs, setMsgs] = useState(() => DM_MSGS[row.idx])
  const [txt, setTxt] = useState('')
  const endRef = useRef(null)
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView()
  }, [msgs])
  const send = () => {
    const v = txt.trim()
    if (!v) return
    setMsgs((p) => [...p, ['m', v]])
    setTxt('')
  }
  return (
    <div className="page sns dc">
      <div className="dc-head">
        <button className="dc-round" onClick={onBack} aria-label="뒤로"><Ico d="M15 5l-7 7 7 7" size={24} sw={2.2} /></button>
        <div className="dc-who">
          <AccountAvatar id={row.id} size={46} />
          <span><b>{row.name} <i>›</i></b><em>{row.group ? '' : row.id}</em></span>
        </div>
        <button className="dc-round" aria-label="통화"><Ico d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" size={22} sw={2} /></button>
        <button className="dc-round" aria-label="영상통화"><Ico d="M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3zM16 11l5-3v8l-5-3z" size={24} sw={2} /></button>
      </div>
      <div className="dc-body">
        {msgs.map((m, i) => {
          if (m[0] === 't') return <div key={i} className="dc-time">{m[1]}</div>
          const mine = m[0] === 'm'
          const nextSame = msgs[i + 1] && msgs[i + 1][0] === m[0]
          return (
            <div key={i} className={`dc-line ${mine ? 'me' : 'ot'} ${nextSame ? 'tight' : ''}`}>
              {!mine && <span className="dc-av">{!nextSame && <AccountAvatar id={row.id} size={32} />}</span>}
              <span className="dc-bub">{m[1]}</span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      <div className="dc-input">
        <span className="dc-cam"><Ico d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" size={22} stroke="#fff" sw={2} /></span>
        <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="메시지 보내기..." />
        <Ico d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4" size={26} sw={2} />
        <Ico d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4" size={26} sw={2} />
        <Ico d="M12 21a9 9 0 1 1 9-9l-9 9zM8.5 10h.01M14.5 10h.01M8 14c1.2 1.4 4 1.6 6 0" size={26} sw={2} />
        <Ico d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8" size={28} sw={2} />
      </div>
    </div>
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
  const [chat, setChat] = useState(null)
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

  if (chat) return <DmChat row={chat} onBack={() => setChat(null)} />
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
    const nxt = keys.find((k, j) => j > i && SNS_STORIES[k] && SNS_STORIES[k].length)
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
    <div
      className="page sns"
      onClickCapture={(e) => {
        const el = e.target.closest ? e.target.closest('[data-uid]') : null
        if (el && el.dataset.uid) {
          e.stopPropagation()
          e.preventDefault()
          setUserId(el.dataset.uid)
        }
      }}
    >
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
          <div className="dm-head">
            <span />
            <b>{ME_ID}<Ico d="M6 9l6 6 6-6" size={18} sw={2.4} /></b>
            <span className="dm-compose" aria-label="새 메시지">
              <Ico d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={26} sw={2} />
            </span>
          </div>
          <div className="scroll">
            <label className="dm-search">
              <Ico d={SEARCH} size={20} stroke="#8e8e93" sw={2.2} />
              <span>검색</span>
            </label>
            <div className="dm-notes">
              <div className="dm-note">
                <span className="dm-bubble">메모...</span>
                <AccountAvatar id={ME_ID} size={92} />
                <em>내 메모</em>
              </div>
              <div className="dm-note">
                <span className="dm-map" />
                <em>지도</em>
              </div>
            </div>
            <div className="dm-sec"><b>메시지</b><span>요청</span></div>
            {DM_ROWS.map((r, idx) => (
              <button key={idx} className="dm-row" onClick={() => setChat({ ...r, idx })}>
                <span className={`dm-ring ${r.ring ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setUserId(r.id) }}>
                  <AccountAvatar id={r.id} size={r.ring ? 66 : 64} />
                </span>
                <div className="dm-main">
                  <b className={r.unread ? 'u' : ''}>{r.name}</b>
                  <p className={r.unread ? 'u' : ''}>{r.text} · {r.ago}</p>
                </div>
                {r.unread && <i className="unread-dot" />}
              </button>
            ))}
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
            onMessage={() => {
              const idx = DM_ROWS.findIndex((r) => r.id === userId)
              if (idx < 0) return flash('이 계정에는 메시지를 보낼 수 없습니다')
              setUserId(null)
              setChat({ ...DM_ROWS[idx], idx })
            }}
          />
        </div>
      )}

      {/* 게시물 상세 */}
      {postId && postOf(postId) && (
        <div className="sns-overlay">
          <div className="sns-top det">
            <Back onClick={() => setPostId(null)} />
            <div className="det-t"><b>게시물</b><span>{postOf(postId).user}</span></div>
            <span />
          </div>
          <div className="scroll">
            <PostCard
              detail
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

      {story && <StoryViewer key="story-viewer" title={story.title} owner={story.owner} when={story.when} slides={story.slides} onClose={closeStory} onDone={finishStory} onToast={flash} />}
      {hl && <StoryViewer title={hl.title} owner={ME_ID} when={hl.date || ""} slides={hl.items} onClose={() => setHl(null)} onToast={flash} />}

      {toast && <div className="sns-toast">{toast}</div>}
    </div>
  )
}
