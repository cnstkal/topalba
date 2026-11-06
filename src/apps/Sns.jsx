import { useState } from 'react'
import { useGame } from '../engine/store'
import { THREAD_META, CHARACTERS } from '../data/characters'
import { Avatar } from '../components/Overlays'
import Thread from '../components/Thread'
import { fmtTime } from '../utils'

const STORIES = [
  { name: '내 스토리', me: true },
  { name: 'cafe_seoul_log' },
  { name: 'han_river_walk' },
  { name: 'coffee_day' },
  { name: 'hello_star' },
]

const Ico = ({ d, fill, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="#000" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const HEART = 'M20.800 4.600a5.500 5.500 0 0 0-7.800 0L12 5.600l-1-1a5.500 5.500 0 0 0-7.800 7.800l1 1L12 21l7.800-7.600 1-1a5.500 5.500 0 0 0 0-7.800z'
const BUBBLE = 'M21 11.500a8.400 8.400 0 0 1-12.300 7.400L3 21l1.900-5.600A8.500 8.500 0 1 1 21 11.500z'
const SEND = 'M22 2L11 13M22 2l-7 20-4-9-9-4z'

export default function Sns({ params }) {
  const { state, actions } = useGame()
  const initialDm = params?.thread && params.thread.startsWith('dm:') ? params.thread : null
  const [tab, setTab] = useState(initialDm ? 'dm' : 'feed')
  const [dmId, setDmId] = useState(initialDm)
  const [sheet, setSheet] = useState(null) // 댓글 창 대상 게시물 id
  const [draft, setDraft] = useState('')
  const [story, setStory] = useState(null)

  const post = state.posts.find((p) => p.id === sheet)
  const dmRows = Object.keys(THREAD_META).filter((id) => THREAD_META[id].app === 'dm' && (state.threads[id] || []).length > 0)
  const unreadDm = dmRows.reduce((n, id) => n + state.threads[id].filter((m) => m.unread).length, 0)
  const newsOut = !!state.flags.newsOut

  if (dmId) return <Thread id={dmId} dm onBack={() => setDmId(null)} />

  return (
    <div className="page sns">
      {tab === 'feed' && (
        <>
          <div className="sns-top">
            <span className="sns-logo">그램</span>
            <div className="sns-icons">
              <span onClick={() => setTab('notif')}>
                <Ico d={HEART} />
              </span>
              <span className="rel" onClick={() => setTab('dm')}>
                <Ico d={SEND} />
                {unreadDm > 0 && <i className="mini-badge">{unreadDm}</i>}
              </span>
            </div>
          </div>
          <div className="scroll">
            <div className="stories">
              {STORIES.map((s) => (
                <button key={s.name} className="story" onClick={() => setStory(s.name)}>
                  <div className={`ring-av ${s.me ? 'mine' : ''}`}>
                    <div className="ring-in">{s.name.slice(0, 1).toUpperCase()}</div>
                  </div>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
            {state.posts.map((p) => (
              <article key={p.id} className="post">
                <div className="post-head">
                  <div className="post-av">{p.user.slice(0, 1).toUpperCase()}</div>
                  <b>{p.user}</b>
                </div>
                <div className="post-img" style={{ background: p.tint }} onDoubleClick={() => !state.liked[p.id] && actions.like(p.id)}>
                  <span>{p.text}</span>
                </div>
                <div className="post-actions">
                  <span onClick={() => actions.like(p.id)}>
                    <Ico d={HEART} fill={state.liked[p.id] ? '#ff3040' : 'none'} />
                  </span>
                  <span onClick={() => setSheet(p.id)}>
                    <Ico d={BUBBLE} />
                  </span>
                  <span>
                    <Ico d={SEND} />
                  </span>
                </div>
                <div className="post-likes">좋아요 {(p.likes + (state.liked[p.id] ? 1 : 0)).toLocaleString()}개</div>
                <div className="post-cap">
                  <b>{p.user}</b> {p.text}
                </div>
                <button className="post-cm" onClick={() => setSheet(p.id)}>
                  댓글 {p.comments.length}개 모두 보기
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {tab === 'dm' && (
        <>
          <div className="sns-top">
            <button className="back" onClick={() => setTab('feed')}>
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L2 10l8 8" />
              </svg>
            </button>
            <b>yoonho_j</b>
            <span />
          </div>
          <div className="scroll">
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
                    <div className="msg-prev" style={{ color: unread ? '#000' : undefined }}>{last.text}</div>
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
            <button className="back" onClick={() => setTab('feed')}>
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L2 10l8 8" />
              </svg>
            </button>
            <b>알림</b>
            <span />
          </div>
          <div className="scroll">
            {state.snsNotifs.length === 0 && <div className="empty">새로운 알림이 없습니다.</div>}
            {state.snsNotifs.map((n) => (
              <div key={n.id} className="notif-row">
                <div className="post-av">{n.user.slice(0, 1).toUpperCase()}</div>
                <div>
                  <b>{n.user}</b> {n.text}
                  <div className="muted">{fmtTime(n.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'profile' && (
        <>
          <div className="sns-top">
            <b>yoonho_j</b>
            <span />
          </div>
          <div className="scroll">
            <div className="prof">
              <div className="prof-av">정</div>
              <div className="prof-stats">
                <div><b>12</b>게시물</div>
                <div><b>{newsOut ? '4,812' : '203'}</b>팔로워</div>
                <div><b>187</b>팔로잉</div>
              </div>
            </div>
            <div className="prof-bio"><b>정윤호</b><br />평범한 일상 기록</div>
            <div className="prof-btns"><span>프로필 편집</span><span>프로필 공유</span></div>
            <div className="prof-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ background: ['#f5e6d3', '#d6ecff', '#e8f5e9', '#fde7f1', '#fff4cc', '#e6e0ff'][i % 6] }} />
              ))}
            </div>
          </div>
        </>
      )}

      {(tab === 'feed' || tab === 'profile') && (
        <div className="sns-tabs">
          <span onClick={() => setTab('feed')} className={tab === 'feed' ? 'on' : ''}>
            <Ico d="M3 10.500L12 3l9 7.500V21h-6v-7H9v7H3z" fill={tab === 'feed' ? '#000' : 'none'} />
          </span>
          <span onClick={() => setTab('dm')}>
            <Ico d={SEND} />
          </span>
          <span onClick={() => setTab('notif')}>
            <Ico d={HEART} />
          </span>
          <span onClick={() => setTab('profile')} className={tab === 'profile' ? 'on' : ''}>
            <div className="tab-av" />
          </span>
        </div>
      )}

      {sheet && post && (
        <div className="sheet-wrap" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grab" />
            <div className="sheet-title">댓글</div>
            <div className="sheet-list">
              {post.comments.length === 0 && <div className="empty">첫 댓글을 남겨보세요.</div>}
              {post.comments.map((c, i) => (
                <div key={i} className="cm">
                  <div className="post-av sm">{c.user.slice(0, 1).toUpperCase()}</div>
                  <div><b>{c.user}</b> {c.text}</div>
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

      {story && (
        <div className="story-view" onClick={() => setStory(null)}>
          <div className="story-bar"><i /></div>
          <div className="story-name">{story}</div>
          <div className="story-body">{story === '내 스토리' ? '새 스토리를 추가해 보세요' : '오늘의 순간'}</div>
        </div>
      )}
    </div>
  )
}
