import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  EVENTS,
  EVENT_MAP,
  INITIAL_THREADS,
  INITIAL_NOTES,
  INITIAL_MAILS,
  INITIAL_SENT,
  INITIAL_POSTS,
  INITIAL_RECENTS,
  INITIAL_PROFILE,
  SNS_FOLLOWING,
} from '../data/story'
import { judgeEnding } from '../data/endings'
import { ME } from '../data/characters'

const KEY = 'private-save-v1'

// ── 캘린더 일정 (날짜는 'YYYY-MM-DD', 시간은 'HH:mm' 문자열) ──
const calKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// 기존 임시 일정 4건: 최초 로드 시점의 오늘을 기준으로 실제 날짜로 고정해 저장
function seedCalEvents() {
  const t = new Date()
  const at = (n) => calKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n))
  const base = { alert: '10', note: '' }
  return [
    { ...base, id: 'ev1', title: '마케팅팀 내일 회의 준비', startDate: at(0), endDate: at(0), startTime: '09:00', endTime: '10:00', allDay: true, place: '회사', note: '회의 자료 최종 확인', color: '#ff9500' },
    { ...base, id: 'ev2', title: '저녁 약속', startDate: at(0), endDate: at(0), startTime: '20:00', endTime: '21:00', allDay: false, place: '집', color: '#007aff' },
    { ...base, id: 'ev3', title: '치과 예약', startDate: at(3), endDate: at(3), startTime: '18:30', endTime: '19:30', allDay: false, place: '서울 치과', note: '정기 검진', color: '#34c759', alert: '60' },
    { ...base, id: 'ev4', title: '월간 보고', startDate: at(9), endDate: at(9), startTime: '10:00', endTime: '11:00', allDay: false, place: '회의실 B', color: '#af52de', alert: '30' },
  ]
}

function freshState() {
  return {
    unlocked: false, // 잠금 화면 해제 여부 (해제 후 스토리 시작)
    done: [],
    triggered: [],
    flags: {},
    score: {},
    threads: JSON.parse(JSON.stringify(INITIAL_THREADS)),
    picked: {},
    notifs: [],
    snsNotifs: [],
    posts: JSON.parse(JSON.stringify(INITIAL_POSTS)),
    mails: JSON.parse(JSON.stringify(INITIAL_MAILS)),
    sent: JSON.parse(JSON.stringify(INITIAL_SENT)),
    recents: JSON.parse(JSON.stringify(INITIAL_RECENTS)),
    notes: JSON.parse(JSON.stringify(INITIAL_NOTES)),
    noteFolders: [], // 사용자가 만든 메모 폴더 [{ id, name }]
    noteUi: { folder: 'all', view: 'list' }, // 메모 앱 마지막 폴더 / 보기 방식
    calEvents: seedCalEvents(), // 캘린더 일정 (기존 저장본에는 이 키가 없으므로 시드가 자동 적용됨)
    liked: {},
    saved: {}, // 저장한 게시물
    follows: { ...SNS_FOLLOWING }, // 기본 팔로우 계정
    storySeen: {}, // 열람한 스토리 계정
    profile: JSON.parse(JSON.stringify(INITIAL_PROFILE)),
    history: [],
    ringing: null,
    banner: null,
    ending: null,
    uid: 1,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const old = saved.posts || []
      // 기존 저장본에도 새 사진/위치 데이터가 반영되도록 초기 게시물은 최신 정의로 덮어쓴다 (좋아요·댓글은 유지)
      const initIds = new Set(INITIAL_POSTS.map((p) => p.id))
      const initial = INITIAL_POSTS.map((ip) => {
        const prev = old.find((p) => p.id === ip.id)
        return prev ? { ...ip, likes: prev.likes, comments: prev.comments } : ip
      })
      const extra = old.filter((p) => !initIds.has(p.id))
      const merged = { ...freshState(), ...saved, follows: { ...SNS_FOLLOWING, ...(saved.follows || {}) }, posts: [...extra, ...initial], banner: null }
      if (!Array.isArray(merged.calEvents)) merged.calEvents = seedCalEvents()
      return merged
    }
  } catch (e) {
    /* 저장 데이터 손상 시 새로 시작 */
  }
  return freshState()
}

function applyEffect(s, fx) {
  const now = Date.now()
  switch (fx.t) {
    case 'msg': {
      const list = [...(s.threads[fx.thread] || [])]
      const id = `m${s.uid++}`
      if (fx.from !== ME) {
        // 상대가 답장하면 내가 보낸 메시지는 읽음 처리
        for (let i = 0; i < list.length; i++) if (list[i].from === ME) list[i] = { ...list[i], read: true }
      }
      list.push({ id, from: fx.from, text: fx.text, ts: now, unread: fx.from !== ME, choices: fx.choices })
      s.threads = { ...s.threads, [fx.thread]: list }
      break
    }
    case 'notify':
      s.notifs = [{ id: `n${s.uid++}`, app: fx.app, title: fx.title, body: fx.body, thread: fx.thread, ts: now, read: false }, ...s.notifs]
      s.banner = s.notifs[0]
      break
    case 'post':
      s.posts = [{ ...fx.post, ts: now }, ...s.posts]
      break
    case 'snsnotif':
      s.snsNotifs = [{ id: `sn${s.uid++}`, user: fx.user, text: fx.text, ts: now }, ...s.snsNotifs]
      break
    case 'mail':
      s.mails = [{ ...fx.mail, ts: now, read: false }, ...s.mails]
      break
    case 'call':
      s.recents = [{ id: `c${s.uid++}`, from: fx.from, missed: !!fx.missed, ts: now }, ...s.recents]
      break
    case 'ring':
      s.ringing = { from: fx.from, onAccept: fx.onAccept || [], onDecline: fx.onDecline || [] }
      break
    case 'flag':
      s.flags = { ...s.flags, [fx.key]: fx.value }
      break
    case 'unlock':
      s.triggered = [...new Set([...s.triggered, ...fx.ids])]
      break
    case 'ending':
      s.ending = judgeEnding(s)
      break
    default:
      break
  }
}

function reducer(state, a) {
  switch (a.type) {
    case 'UNLOCK_PHONE':
      return { ...state, unlocked: true }
    case 'RUN': {
      const ev = EVENT_MAP[a.id]
      if (!ev || state.done.includes(a.id)) return state
      const s = { ...state, done: [...state.done, a.id] }
      ev.effects.forEach((fx) => applyEffect(s, fx))
      return s
    }
    case 'CHOOSE': {
      const list = state.threads[a.thread] || []
      const msg = list.find((m) => m.id === a.msgId)
      const choice = msg?.choices?.[a.index]
      if (!choice || state.picked[a.msgId] !== undefined) return state
      const s = { ...state, picked: { ...state.picked, [a.msgId]: a.index } }
      const mid = `m${s.uid++}`
      s.threads = {
        ...s.threads,
        [a.thread]: [...list, { id: mid, from: ME, text: choice.text || choice.label, ts: Date.now(), read: false }],
      }
      if (choice.flags) s.flags = { ...s.flags, ...choice.flags }
      if (choice.score) {
        const sc = { ...s.score }
        Object.entries(choice.score).forEach(([k, v]) => (sc[k] = (sc[k] || 0) + v))
        s.score = sc
      }
      if (choice.unlock) s.triggered = [...new Set([...s.triggered, ...choice.unlock])]
      return s
    }
    case 'OUT_READ': {
      const list = (state.threads[a.thread] || []).map((m) => (m.from === ME ? { ...m, read: true } : m))
      return { ...state, threads: { ...state.threads, [a.thread]: list } }
    }
    case 'MARK_READ': {
      const list = state.threads[a.thread]
      if (!list || !list.some((m) => m.unread)) return state
      return {
        ...state,
        threads: { ...state.threads, [a.thread]: list.map((m) => (m.unread ? { ...m, unread: false } : m)) },
        notifs: state.notifs.map((n) => (n.thread === a.thread ? { ...n, read: true } : n)),
      }
    }
    case 'MAIL_READ':
      return {
        ...state,
        mails: state.mails.map((m) => (m.id === a.id ? { ...m, read: true } : m)),
        notifs: state.notifs.map((n) => (n.app === 'mail' && !n.thread && state.mails.find((m) => m.id === a.id)?.subject === n.body ? { ...n, read: true } : n)),
      }
    case 'APP_SEEN':
      return {
        ...state,
        notifs: state.notifs.map((n) => (n.app === a.app && !n.thread ? { ...n, read: true } : n)),
        recents: a.app === 'phone' ? state.recents.map((c) => ({ ...c, seen: true })) : state.recents,
      }
    case 'DISMISS_BANNER':
      return state.banner ? { ...state, banner: null } : state
    case 'ANSWER': {
      const r = state.ringing
      if (!r) return state
      const ids = a.accepted ? r.onAccept : r.onDecline
      return {
        ...state,
        ringing: null,
        triggered: [...new Set([...state.triggered, ...ids])],
        recents: [{ id: `c${state.uid}`, from: r.from, missed: !a.accepted, ts: Date.now() }, ...state.recents],
        uid: state.uid + 1,
      }
    }
    case 'LIKE':
      return { ...state, liked: { ...state.liked, [a.id]: !state.liked[a.id] } }
    case 'SAVE':
      return { ...state, saved: { ...state.saved, [a.id]: !state.saved[a.id] } }
    case 'FOLLOW':
      return { ...state, follows: { ...state.follows, [a.id]: !state.follows[a.id] } }
    case 'STORY_SEEN':
      return { ...state, storySeen: { ...state.storySeen, [a.id]: true } }
    case 'PROFILE_SAVE':
      return { ...state, profile: { ...state.profile, ...a.profile } }
    case 'COMMENT': {
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === a.id ? { ...p, comments: [...p.comments, { user: 'yoonho_j', text: a.text }] } : p)),
      }
    }
    case 'HISTORY':
      return { ...state, history: [a.q, ...state.history.filter((h) => h !== a.q)].slice(0, 8) }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'NOTE_SAVE': {
      const exists = state.notes.some((n) => n.id === a.note.id)
      const notes = exists ? state.notes.map((n) => (n.id === a.note.id ? { ...n, ...a.note, ts: Date.now() } : n)) : [{ ...a.note, ts: Date.now() }, ...state.notes]
      return { ...state, notes }
    }
    // 삭제는 '최근 삭제된 항목'으로 이동 (복구 가능)
    case 'NOTE_DELETE':
      return { ...state, notes: state.notes.map((n) => (n.id === a.id ? { ...n, deleted: true, delTs: Date.now() } : n)) }
    case 'NOTE_RESTORE':
      return { ...state, notes: state.notes.map((n) => (n.id === a.id ? { ...n, deleted: false, delTs: undefined } : n)) }
    case 'NOTE_PURGE':
      return { ...state, notes: state.notes.filter((n) => n.id !== a.id) }
    case 'NOTE_EMPTY_TRASH':
      return { ...state, notes: state.notes.filter((n) => !n.deleted) }
    case 'NOTE_PIN':
      return { ...state, notes: state.notes.map((n) => (n.id === a.id ? { ...n, pinned: !n.pinned } : n)) }
    case 'NOTE_MOVE':
      return { ...state, notes: state.notes.map((n) => (n.id === a.id ? { ...n, folder: a.folder } : n)) }
    case 'FOLDER_ADD':
      return { ...state, noteFolders: [...(state.noteFolders || []), { id: a.id, name: a.name }] }
    case 'FOLDER_RENAME':
      return { ...state, noteFolders: (state.noteFolders || []).map((f) => (f.id === a.id ? { ...f, name: a.name } : f)) }
    // 폴더 삭제 시 안의 메모는 iCloud 메모로 이동
    case 'FOLDER_DELETE':
      return {
        ...state,
        noteFolders: (state.noteFolders || []).filter((f) => f.id !== a.id),
        notes: state.notes.map((n) => (n.folder === a.id ? { ...n, folder: 'icloud' } : n)),
        noteUi: state.noteUi?.folder === a.id ? { ...state.noteUi, folder: 'all' } : state.noteUi,
      }
    case 'CAL_SAVE': {
      const list = Array.isArray(state.calEvents) ? state.calEvents : []
      const exists = list.some((e) => e.id === a.event.id)
      return { ...state, calEvents: exists ? list.map((e) => (e.id === a.event.id ? { ...e, ...a.event } : e)) : [...list, a.event] }
    }
    case 'CAL_DELETE':
      return { ...state, calEvents: (state.calEvents || []).filter((e) => e.id !== a.id) }
    case 'NOTE_UI':
      return { ...state, noteUi: { ...(state.noteUi || {}), ...a.ui } }
    default:
      return state
  }
}

function eligible(ev, s) {
  if (ev.trigger === 'unlock' && !s.triggered.includes(ev.id)) return false
  return (ev.after || []).every((id) => s.done.includes(id))
}

const Ctx = createContext(null)
export const useGame = () => useContext(Ctx)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const scheduled = useRef(new Set())

  // 저장 (새로고침 후에도 진행 상황 유지)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, banner: null }))
    } catch (e) {
      /* 저장 공간 부족 등은 무시 */
    }
  }, [state])

  // 이벤트 스케줄러
  useEffect(() => {
    if (!state.unlocked) return
    EVENTS.forEach((ev) => {
      if (state.done.includes(ev.id) || scheduled.current.has(ev.id) || !eligible(ev, state)) return
      scheduled.current.add(ev.id)
      setTimeout(() => dispatch({ type: 'RUN', id: ev.id }), ev.delay ?? 0)
    })
  }, [state.unlocked, state.done, state.triggered])

  const actions = useMemo(
    () => ({
      unlockPhone: () => dispatch({ type: 'UNLOCK_PHONE' }),
      choose: (thread, msgId, index) => {
        dispatch({ type: 'CHOOSE', thread, msgId, index })
        setTimeout(() => dispatch({ type: 'OUT_READ', thread }), 1800)
      },
      markRead: (thread) => dispatch({ type: 'MARK_READ', thread }),
      mailRead: (id) => dispatch({ type: 'MAIL_READ', id }),
      appSeen: (app) => dispatch({ type: 'APP_SEEN', app }),
      dismissBanner: () => dispatch({ type: 'DISMISS_BANNER' }),
      answer: (accepted) => dispatch({ type: 'ANSWER', accepted }),
      like: (id) => dispatch({ type: 'LIKE', id }),
      save: (id) => dispatch({ type: 'SAVE', id }),
      follow: (id) => dispatch({ type: 'FOLLOW', id }),
      storySeen: (id) => dispatch({ type: 'STORY_SEEN', id }),
      saveProfile: (profile) => dispatch({ type: 'PROFILE_SAVE', profile }),
      comment: (id, text) => dispatch({ type: 'COMMENT', id, text }),
      addHistory: (q) => dispatch({ type: 'HISTORY', q }),
      clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
      saveNote: (note) => dispatch({ type: 'NOTE_SAVE', note }),
      deleteNote: (id) => dispatch({ type: 'NOTE_DELETE', id }),
      restoreNote: (id) => dispatch({ type: 'NOTE_RESTORE', id }),
      purgeNote: (id) => dispatch({ type: 'NOTE_PURGE', id }),
      emptyTrash: () => dispatch({ type: 'NOTE_EMPTY_TRASH' }),
      pinNote: (id) => dispatch({ type: 'NOTE_PIN', id }),
      moveNote: (id, folder) => dispatch({ type: 'NOTE_MOVE', id, folder }),
      addFolder: (name) => dispatch({ type: 'FOLDER_ADD', id: `nf${Date.now()}`, name }),
      renameFolder: (id, name) => dispatch({ type: 'FOLDER_RENAME', id, name }),
      deleteFolder: (id) => dispatch({ type: 'FOLDER_DELETE', id }),
      noteUi: (ui) => dispatch({ type: 'NOTE_UI', ui }),
      saveCalEvent: (event) => dispatch({ type: 'CAL_SAVE', event }),
      deleteCalEvent: (id) => dispatch({ type: 'CAL_DELETE', id }),
      reset: () => {
        try {
          localStorage.removeItem(KEY)
        } catch (e) {
          /* noop */
        }
        window.location.reload()
      },
    }),
    [],
  )

  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>
}

// 앱 아이콘 배지: 앱별 읽지 않은 항목 수
export function unreadCount(state, app) {
  if (app === 'messages')
    return Object.entries(state.threads).filter(([id]) => id.startsWith('msg:')).reduce((n, [, l]) => n + l.filter((m) => m.unread).length, 0)
  if (app === 'sns')
    return Object.entries(state.threads).filter(([id]) => id.startsWith('dm:')).reduce((n, [, l]) => n + l.filter((m) => m.unread).length, 0)
  if (app === 'mail') return state.mails.filter((m) => !m.read).length
  if (app === 'phone') return state.recents.filter((c) => c.missed && !c.seen).length
  return 0
}
