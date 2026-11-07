import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Back from '../components/Back'
import { useGame } from '../engine/store'

/* ───────── 유틸 ───────── */
const DEFAULT_FOLDERS = [
  { id: 'all', name: '전체 메모' },
  { id: 'icloud', name: 'iCloud 메모' },
  { id: 'trash', name: '최근 삭제된 항목' },
]
const TAG_RE = /(?<![\p{L}\p{N}_#])#[\p{L}\p{N}_]+/gu
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const bodyToHtml = (n) => n.html ?? ((n.body || '').split('\n').map((l) => `<div>${esc(l) || '<br>'}</div>`).join('') || '<div><br></div>')
const htmlToText = (html) => {
  const doc = new DOMParser().parseFromString(
    html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|h[1-6]|li|tr)>/gi, '\n').replace(/<\/(td|th)>/gi, ' '),
    'text/html',
  )
  return (doc.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim()
}
const tagsOf = (text) => [...new Set((text.match(TAG_RE) || []).map((t) => t.toLowerCase()))]
const noteFolder = (n) => n.folder || 'icloud'

const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
const diffDays = (ts) => Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000)
const timeStr = (ts) => new Date(ts).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
const dateStr = (ts) => {
  const df = diffDays(ts)
  if (df <= 0) return timeStr(ts)
  if (df === 1) return '어제'
  const d = new Date(ts)
  if (df < 7) return `${'일월화수목금토'[d.getDay()]}요일`
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}
const fullDate = (ts) => { const d = new Date(ts); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${timeStr(ts)}` }
const groupLabel = (ts) => {
  const df = diffDays(ts)
  if (df <= 0) return '오늘'
  if (df === 1) return '어제'
  if (df <= 7) return '지난 7일'
  if (df <= 30) return '지난 30일'
  const d = new Date(ts)
  return d.getFullYear() === new Date().getFullYear() ? `${d.getMonth() + 1}월` : `${d.getFullYear()}년`
}
const bodyLines = (n) => (n.body || '').split('\n').map((l) => l.trim()).filter((l) => l && l !== n.title)
const previewOf = (n) => bodyLines(n)[0] || (n.html && /<img/.test(n.html) ? '사진' : '추가 텍스트 없음')

function useKeyboard() {
  const [kb, setKb] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || window.innerWidth > 500) return undefined
    const h = () => setKb(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    vv.addEventListener('resize', h)
    vv.addEventListener('scroll', h)
    h()
    return () => { vv.removeEventListener('resize', h); vv.removeEventListener('scroll', h) }
  }, [])
  return kb
}

/* ───────── 아이콘 ───────── */
const PATHS = {
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M21 21l-4.5-4.5'],
  compose: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  more: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8 12h.01M12 12h.01M16 12h.01'],
  undo: ['M9 14L4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  redo: ['M15 14l5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
  checklist: ['M9 6h11M9 12h11M9 18h11', 'M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17'],
  table: ['M3 5h18v14H3z', 'M3 10h18M3 15h18M9 5v14M15 5v14'],
  attach: ['M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9'],
  folderplus: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M12 10.5v5M9.5 13h5'],
  trash: ['M4 7h16M10 11v6M14 11v6', 'M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3'],
  pin: ['M12 16v6', 'M9 3h6l-1 6 3 3v2H7v-2l3-3z'],
  share: ['M12 3v12M8 7l4-4 4 4', 'M5 11v9h14v-9'],
  grid: ['M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  list: ['M4 6h16M4 12h16M4 18h16'],
  chev: ['M9 5l7 7-7 7'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  photo: ['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6'],
  hr: ['M3 12h18'],
  cal: ['M3 5h18v16H3z', 'M3 10h18M8 3v4M16 3v4'],
  hash: ['M5 9h14M5 15h14M10 4L8 20M16 4l-2 16'],
  move: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 13h6M13 11l2 2-2 2'],
  restore: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
}
const Ic = ({ n, size = 22, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[n].map((d, i) => <path key={i} d={d} />)}
  </svg>
)
const FolderIc = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#ffc800" />
  </svg>
)

/* ───────── 공용 오버레이 ───────── */
function Menu({ items, onClose }) {
  return (
    <div className="na-scrim clear" onClick={onClose}>
      <div className="na-menu" onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => (
          <button key={i} className={it.danger ? 'danger' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => { onClose(); it.run() }}>
            <span>{it.label}</span>
            {it.check ? <Ic n="check" size={18} sw={2.4} /> : it.icon ? <Ic n={it.icon} size={20} /> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

function Sheet({ title, items, onClose }) {
  return (
    <div className="na-scrim" onClick={onClose}>
      <div className="na-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="na-sheet-box">
          {title && <div className="na-sheet-t">{title}</div>}
          {items.map((it, i) => (
            <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { onClose(); it.run() }}>{it.label}</button>
          ))}
        </div>
        <button className="na-sheet-cancel" onClick={onClose}>취소</button>
      </div>
    </div>
  )
}

function NameDialog({ title, initial = '', onSave, onClose }) {
  const [v, setV] = useState(initial)
  const ok = v.trim().length > 0
  return (
    <div className="na-scrim center" onClick={onClose}>
      <div className="na-dialog" onClick={(e) => e.stopPropagation()}>
        <b>{title}</b>
        <input autoFocus value={v} maxLength={30} placeholder="이름" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ok) { onSave(v.trim()); onClose() } }} />
        <div>
          <button onClick={onClose}>취소</button>
          <button className="pri" disabled={!ok} onClick={() => { onSave(v.trim()); onClose() }}>저장</button>
        </div>
      </div>
    </div>
  )
}

/* ───────── 본문 편집기 ───────── */
const topBlock = (node, root) => {
  while (node && node.parentNode !== root) node = node.parentNode
  return node && node.nodeType === 1 ? node : null
}
const placeCaret = (node, atStart = true) => {
  const r = document.createRange()
  r.selectNodeContents(node)
  r.collapse(atStart)
  const s = window.getSelection()
  s.removeAllRanges()
  s.addRange(r)
}
// #태그를 노란 강조로 표시 (편집 중이 아닐 때만 실행)
function decorateTags(root) {
  root.querySelectorAll('span.tag').forEach((s) => s.replaceWith(document.createTextNode(s.textContent)))
  root.normalize()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((tn) => {
    const text = tn.nodeValue
    TAG_RE.lastIndex = 0
    if (!TAG_RE.test(text)) return
    TAG_RE.lastIndex = 0
    const frag = document.createDocumentFragment()
    let last = 0
    let m
    while ((m = TAG_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
      const sp = document.createElement('span')
      sp.className = 'tag'
      sp.textContent = m[0]
      frag.appendChild(sp)
      last = m.index + m[0].length
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
    tn.replaceWith(frag)
  })
}

function Editor({ note, folderName, onClose, onToast }) {
  const { state, actions } = useGame()
  const kb = useKeyboard()
  const stored = state.notes.find((n) => n.id === note.id)
  const cur = stored || note
  const bodyRef = useRef(null)
  const titleRef = useRef(null)
  const fileRef = useRef(null)
  const rangeRef = useRef(null)
  const folderRef = useRef(note.folder || 'icloud')
  const saved = useRef(null)
  const timer = useRef(0)
  const snapTimer = useRef(0)
  const hist = useRef({ stack: [], i: 0 })
  const [panel, setPanel] = useState(null) // fmt | attach | table | more | move
  const [fmt, setFmt] = useState({})
  const [hs, setHs] = useState({ u: false, r: false })
  const [pickMove, setPickMove] = useState(false)

  /* 초기 내용 */
  useLayoutEffect(() => {
    const el = bodyRef.current
    el.innerHTML = bodyToHtml(note)
    decorateTags(el)
    try { document.execCommand('defaultParagraphSeparator', false, 'div') } catch (e) { /* noop */ }
    saved.current = { title: note.title || '', html: el.innerHTML }
    hist.current = { stack: [el.innerHTML], i: 0 }
    if (!note.title && !note.body && !note.html) titleRef.current.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncHs = () => setHs({ u: hist.current.i > 0, r: hist.current.i < hist.current.stack.length - 1 })

  /* 저장 */
  const commitWith = useCallback((bodyEl, titleEl) => {
    if (!bodyEl || !titleEl) return
    const html = bodyEl.innerHTML
    const title = titleEl.value
    if (saved.current && html === saved.current.html && title === saved.current.title) return
    const text = htmlToText(html)
    const hasMedia = /<img|<table|<hr/.test(html)
    if (!title.trim() && !text && !hasMedia) return
    actions.saveNote({
      id: note.id,
      title: title.trim() || text.split('\n')[0].slice(0, 20),
      body: text,
      html,
      folder: folderRef.current,
      ...(note.cts ? { cts: note.cts } : {}),
    })
    saved.current = { title, html }
  }, [actions, note.id, note.cts])
  const commit = () => commitWith(bodyRef.current, titleRef.current)
  const schedule = () => { clearTimeout(timer.current); timer.current = setTimeout(commit, 300) }

  useEffect(() => {
    const b = bodyRef.current
    const t = titleRef.current
    return () => { clearTimeout(timer.current); clearTimeout(snapTimer.current); commitWith(b, t) }
  }, [commitWith])

  /* 실행 취소 / 다시 실행 (본문) */
  const snap = (now) => {
    const run = () => {
      const h = hist.current
      const html = bodyRef.current.innerHTML
      if (html === h.stack[h.i]) return
      h.stack = h.stack.slice(0, h.i + 1)
      h.stack.push(html)
      if (h.stack.length > 100) h.stack.shift()
      h.i = h.stack.length - 1
      syncHs()
    }
    clearTimeout(snapTimer.current)
    if (now) run()
    else snapTimer.current = setTimeout(run, 350)
    schedule()
  }
  const flushSnap = () => { clearTimeout(snapTimer.current); snap(true) }
  const travel = (dir) => {
    flushSnap()
    const h = hist.current
    const ni = h.i + dir
    if (ni < 0 || ni >= h.stack.length) return
    h.i = ni
    bodyRef.current.innerHTML = h.stack[ni]
    bodyRef.current.focus()
    placeCaret(bodyRef.current, false)
    syncHs()
    schedule()
  }

  /* 선택 영역 추적 */
  const readFmt = () => {
    const root = bodyRef.current
    const s = window.getSelection()
    if (!root || !s.rangeCount || !root.contains(s.anchorNode)) return
    const blk = topBlock(s.anchorNode, root)
    const q = (c) => { try { return document.queryCommandState(c) } catch (e) { return false } }
    setFmt({
      b: q('bold'), i: q('italic'), u: q('underline'), s: q('strikeThrough'),
      ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      block: blk ? (blk.classList.contains('cl') ? 'cl' : blk.tagName.toLowerCase()) : 'div',
      cell: !!(s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement)?.closest('td,th'),
    })
  }
  useEffect(() => {
    const h = () => {
      const s = window.getSelection()
      if (!s.rangeCount) return
      const r = s.getRangeAt(0)
      if (bodyRef.current && bodyRef.current.contains(r.commonAncestorContainer)) {
        rangeRef.current = r.cloneRange()
        readFmt()
      }
    }
    document.addEventListener('selectionchange', h)
    return () => document.removeEventListener('selectionchange', h)
  }, [])

  const restore = () => {
    const el = bodyRef.current
    el.focus()
    const s = window.getSelection()
    if (rangeRef.current && el.contains(rangeRef.current.commonAncestorContainer)) {
      s.removeAllRanges()
      s.addRange(rangeRef.current)
    } else if (!s.rangeCount || !el.contains(s.anchorNode)) placeCaret(el, false)
  }
  const curBlock = () => {
    const s = window.getSelection()
    return s.rangeCount ? topBlock(s.anchorNode, bodyRef.current) : null
  }
  const exec = (cmd, val) => {
    restore()
    document.execCommand(cmd, false, val)
    readFmt()
    snap(true)
  }

  /* 체크리스트 */
  const toCl = (el) => {
    const d = document.createElement('div')
    d.className = 'cl'
    d.setAttribute('data-c', '0')
    d.innerHTML = el.innerHTML || '<br>'
    return d
  }
  const toggleChecklist = () => {
    restore()
    const blk = curBlock()
    if (!blk || blk.tagName === 'TABLE') return
    if (blk.classList.contains('cl')) {
      blk.removeAttribute('class')
      blk.removeAttribute('data-c')
    } else if (blk.tagName === 'UL' || blk.tagName === 'OL') {
      const items = [...blk.children].map((li) => toCl(li))
      blk.replaceWith(...items)
      placeCaret(items[items.length - 1], false)
    } else {
      const d = toCl(blk)
      blk.replaceWith(d)
      placeCaret(d, false)
    }
    readFmt()
    snap(true)
  }

  /* 글꼴 스타일 */
  const setBlock = (tag) => {
    restore()
    const blk = curBlock()
    if (blk && blk.classList.contains('cl')) { blk.removeAttribute('class'); blk.removeAttribute('data-c') }
    document.execCommand('formatBlock', false, `<${fmt.block === tag ? 'div' : tag}>`)
    readFmt()
    snap(true)
  }

  /* 표 */
  const makeCell = () => { const c = document.createElement('td'); c.innerHTML = '<br>'; return c }
  const insertNodes = (nodes, focusNode) => {
    restore()
    const root = bodyRef.current
    const blk = curBlock()
    const trail = document.createElement('div')
    trail.innerHTML = '<br>'
    const all = [...nodes, trail]
    const empty = blk && blk.tagName === 'DIV' && !blk.classList.contains('cl') && !blk.textContent && !blk.querySelector('img,hr,table')
    if (!blk) all.forEach((n) => root.appendChild(n))
    else if (empty) blk.replaceWith(...all)
    else blk.after(...all)
    placeCaret(focusNode || trail)
    readFmt()
    snap(true)
  }
  const insertTable = () => {
    const t = document.createElement('table')
    t.className = 'nt'
    const tb = document.createElement('tbody')
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr')
      tr.append(makeCell(), makeCell())
      tb.appendChild(tr)
    }
    t.appendChild(tb)
    insertNodes([t], t.querySelector('td'))
  }
  const tableOp = (op) => {
    restore()
    const s = window.getSelection()
    const el = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement
    const td = el?.closest('td,th')
    if (!td) return
    const tr = td.parentElement
    const table = td.closest('table')
    const idx = td.cellIndex
    const rows = [...table.rows]
    if (op === 'addRow') { const nr = document.createElement('tr'); [...tr.cells].forEach(() => nr.appendChild(makeCell())); tr.after(nr); placeCaret(nr.cells[0]) }
    if (op === 'addCol') rows.forEach((r) => r.cells[idx].after(makeCell()))
    if (op === 'delRow') { if (rows.length <= 1) table.remove(); else { tr.remove(); placeCaret(rows[Math.max(0, rows.indexOf(tr) - 1)] === tr ? rows[1].cells[0] : rows[Math.max(0, rows.indexOf(tr) - 1)].cells[0]) } }
    if (op === 'delCol') { if (tr.cells.length <= 1) table.remove(); else rows.forEach((r) => r.cells[idx].remove()) }
    if (op === 'delTable') table.remove()
    if (!bodyRef.current.querySelector('div,h1,h2,h3,p,ul,ol')) bodyRef.current.innerHTML = '<div><br></div>'
    readFmt()
    snap(true)
  }

  /* 첨부 / 추가 */
  const addPhoto = (file) => {
    if (!file) return
    const rd = new FileReader()
    rd.onload = () => {
      const img = new Image()
      img.onload = () => {
        const sc = Math.min(1, 720 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * sc)
        c.height = Math.round(img.height * sc)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        const el = document.createElement('div')
        const im = document.createElement('img')
        im.src = c.toDataURL('image/jpeg', 0.72)
        im.alt = '첨부 사진'
        el.appendChild(im)
        insertNodes([el])
      }
      img.src = rd.result
    }
    rd.readAsDataURL(file)
  }
  const addHr = () => insertNodes([document.createElement('hr')])
  const addDate = () => { restore(); document.execCommand('insertText', false, fullDate(Date.now())); snap(true) }
  const addHash = () => { restore(); document.execCommand('insertText', false, '#'); snap(true) }

  /* 키 입력 */
  const onKeyDown = (e) => {
    const root = bodyRef.current
    const s = window.getSelection()
    if (!s.rangeCount) return
    const r = s.getRangeAt(0)
    const el = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement
    if (e.key === 'Tab') {
      const td = el?.closest('td,th')
      if (td) {
        e.preventDefault()
        const cells = [...td.closest('table').querySelectorAll('td,th')]
        const next = cells[cells.indexOf(td) + (e.shiftKey ? -1 : 1)]
        if (next) placeCaret(next)
        else if (!e.shiftKey) tableOp('addRow')
      }
      return
    }
    const blk = topBlock(r.startContainer, root)
    if (!blk || !blk.classList.contains('cl') || !r.collapsed) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!blk.textContent.trim()) {
        blk.removeAttribute('class')
        blk.removeAttribute('data-c')
        snap(true)
        return
      }
      const tail = r.cloneRange()
      tail.selectNodeContents(blk)
      tail.setStart(r.endContainer, r.endOffset)
      const frag = tail.extractContents()
      const nb = document.createElement('div')
      nb.className = 'cl'
      nb.setAttribute('data-c', '0')
      nb.appendChild(frag)
      if (!nb.textContent) nb.innerHTML = '<br>'
      if (!blk.firstChild || !blk.textContent) blk.innerHTML = '<br>'
      blk.after(nb)
      placeCaret(nb)
      snap(true)
    } else if (e.key === 'Backspace') {
      const pre = r.cloneRange()
      pre.selectNodeContents(blk)
      pre.setEnd(r.startContainer, r.startOffset)
      if (pre.toString() !== '') return
      e.preventDefault()
      const prev = blk.previousElementSibling
      if (!blk.textContent.trim() && prev) {
        blk.remove()
        placeCaret(prev, false)
      } else {
        blk.removeAttribute('class')
        blk.removeAttribute('data-c')
      }
      snap(true)
    }
  }
  const onClick = (e) => {
    const cl = e.target.closest?.('.cl')
    if (cl && bodyRef.current.contains(cl)) {
      const rect = cl.getBoundingClientRect()
      if (e.clientX - rect.left < 30) {
        cl.setAttribute('data-c', cl.getAttribute('data-c') === '1' ? '0' : '1')
        snap(true)
      }
    }
  }
  const onInput = () => {
    const root = bodyRef.current
    if (!root.innerHTML || root.innerHTML === '<br>') root.innerHTML = '<div><br></div>'
    else if (root.firstChild && root.firstChild.nodeType === 3) document.execCommand('formatBlock', false, '<div>')
    snap(false)
  }
  const onPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }
  const onBlur = () => {
    setTimeout(() => {
      const a = document.activeElement
      if (bodyRef.current && a !== bodyRef.current && !bodyRef.current.contains(a)) {
        decorateTags(bodyRef.current)
        schedule()
      }
    }, 0)
  }

  /* 더보기 메뉴 */
  const ensureSaved = () => { clearTimeout(timer.current); commit() }
  const share = async () => {
    const text = `${titleRef.current.value || cur.title}\n${htmlToText(bodyRef.current.innerHTML)}`
    try {
      if (navigator.share) await navigator.share({ title: cur.title, text })
      else { await navigator.clipboard.writeText(text); onToast('메모 내용을 복사했습니다') }
    } catch (e) { /* 공유 취소 */ }
  }
  const text = htmlToText(bodyRef.current?.innerHTML || '')
  const tags = tagsOf(`${titleRef.current?.value || ''}\n${text}`)
  const isTrash = !!cur.deleted
  const moveTargets = [{ id: 'icloud', name: 'iCloud 메모' }, ...(state.noteFolders || [])]

  const close = () => {
    clearTimeout(timer.current)
    commit()
    const b = bodyRef.current
    const empty = !titleRef.current.value.trim() && !htmlToText(b.innerHTML) && !/<img|<table|<hr/.test(b.innerHTML)
    if (empty && state.notes.some((n) => n.id === note.id)) actions.purgeNote(note.id)
    onClose()
  }

  const bar = (cls, fn, icon, label, on) => (
    <button className={`${on ? 'on' : ''} ${cls || ''}`} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={fn}>{icon}</button>
  )

  return (
    <div className={`page note-app na-edit${kb ? ' kb' : ''}`} style={{ paddingBottom: kb }}>
      <div className="nav">
        <Back onClick={close}>{folderName}</Back>
        <span className="na-nav-r">
          <button aria-label="실행 취소" disabled={!hs.u} onMouseDown={(e) => e.preventDefault()} onClick={() => travel(-1)}><Ic n="undo" /></button>
          <button aria-label="더보기" onClick={() => setPanel(panel === 'more' ? null : 'more')}><Ic n="more" /></button>
        </span>
      </div>

      <div className="ne-scroll" onClick={(e) => { if (e.target === e.currentTarget) { restore(); placeCaret(bodyRef.current, false) } }}>
        <div className="ne-date">{fullDate(cur.cts || cur.ts || Date.now())}</div>
        <input
          ref={titleRef}
          className="ne-title"
          defaultValue={note.title || ''}
          placeholder="제목"
          readOnly={isTrash}
          onChange={schedule}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); restore(); placeCaret(bodyRef.current.firstChild || bodyRef.current) } }}
          onFocus={() => setPanel(null)}
        />
        <div
          ref={bodyRef}
          className="ne-body"
          contentEditable={!isTrash}
          suppressContentEditableWarning
          spellCheck={false}
          data-ph="내용을 입력하세요"
          onInput={onInput}
          onKeyDown={onKeyDown}
          onClick={onClick}
          onPaste={onPaste}
          onBlur={onBlur}
          onFocus={() => setPanel((p) => (p === 'more' ? null : p))}
        />
        {tags.length > 0 && <div className="ne-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>}
      </div>

      {panel === 'more' && (
        <Menu
          onClose={() => setPanel(null)}
          items={[
            { label: cur.pinned ? '고정 해제' : '메모 고정', icon: 'pin', run: () => { ensureSaved(); actions.pinNote(note.id) } },
            { label: '폴더로 이동', icon: 'move', run: () => { ensureSaved(); setPickMove(true) } },
            { label: '공유', icon: 'share', run: share },
            ...(isTrash
              ? [{ label: '복구', icon: 'restore', run: () => { actions.restoreNote(note.id); onClose() } }, { label: '영구 삭제', icon: 'trash', danger: true, run: () => { actions.purgeNote(note.id); onClose() } }]
              : [{ label: '삭제', icon: 'trash', danger: true, run: () => { ensureSaved(); actions.deleteNote(note.id); onClose() } }]),
          ]}
        />
      )}
      {pickMove && (
        <Sheet
          title="폴더로 이동"
          onClose={() => setPickMove(false)}
          items={moveTargets.map((f) => ({ label: f.name, run: () => { actions.moveNote(note.id, f.id); folderRef.current = f.id; onToast(`‘${f.name}’(으)로 이동했습니다`) } }))}
        />
      )}

      {!isTrash && (panel === 'fmt' || panel === 'attach' || panel === 'table') && (
        <div className="na-pop" onMouseDown={(e) => e.preventDefault()}>
          {panel === 'fmt' && (
            <>
              <div className="na-pop-row styles">
                <button className={fmt.block === 'h1' ? 'on' : ''} onClick={() => setBlock('h1')}><b style={{ fontSize: 19 }}>제목</b></button>
                <button className={fmt.block === 'h2' ? 'on' : ''} onClick={() => setBlock('h2')}><b style={{ fontSize: 16 }}>소제목</b></button>
                <button className={!['h1', 'h2', 'cl'].includes(fmt.block) ? 'on' : ''} onClick={() => setBlock('div')}><span style={{ fontSize: 15 }}>본문</span></button>
              </div>
              <div className="na-pop-row">
                <button className={fmt.b ? 'on' : ''} aria-label="굵게" onClick={() => exec('bold')}><b>B</b></button>
                <button className={fmt.i ? 'on' : ''} aria-label="기울임" onClick={() => exec('italic')}><i>I</i></button>
                <button className={fmt.u ? 'on' : ''} aria-label="밑줄" onClick={() => exec('underline')}><u>U</u></button>
                <button className={fmt.s ? 'on' : ''} aria-label="취소선" onClick={() => exec('strikeThrough')}><s>S</s></button>
              </div>
              <div className="na-pop-row">
                <button className={fmt.ul ? 'on' : ''} onClick={() => exec('insertUnorderedList')}>• 글머리 기호</button>
                <button className={fmt.ol ? 'on' : ''} onClick={() => exec('insertOrderedList')}>1. 번호 목록</button>
              </div>
            </>
          )}
          {panel === 'attach' && (
            <div className="na-pop-list">
              <button onClick={() => { setPanel(null); fileRef.current.click() }}><Ic n="photo" size={20} />사진 첨부</button>
              <button onClick={() => { setPanel(null); addDate() }}><Ic n="cal" size={20} />현재 날짜·시간 삽입</button>
              <button onClick={() => { setPanel(null); addHr() }}><Ic n="hr" size={20} />구분선 삽입</button>
              <button onClick={() => { setPanel(null); addHash() }}><Ic n="hash" size={20} />해시태그 입력</button>
            </div>
          )}
          {panel === 'table' && (
            <div className="na-pop-list">
              {fmt.cell ? (
                <>
                  <button onClick={() => tableOp('addRow')}>행 추가</button>
                  <button onClick={() => tableOp('addCol')}>열 추가</button>
                  <button onClick={() => tableOp('delRow')}>행 삭제</button>
                  <button onClick={() => tableOp('delCol')}>열 삭제</button>
                  <button className="danger" onClick={() => { tableOp('delTable'); setPanel(null) }}>표 삭제</button>
                </>
              ) : (
                <button onClick={() => { setPanel(null); insertTable() }}><Ic n="table" size={20} />표 삽입 (2열 × 3행)</button>
              )}
            </div>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { addPhoto(e.target.files[0]); e.target.value = '' }} />

      {/* 하단 편집 도구 모음 제거 */}
    </div>
  )
}

/* ───────── 메모 앱 ───────── */
export default function Notes() {
  const { state, actions } = useGame()
  const kb = useKeyboard()
  const ui = state.noteUi || { folder: 'all', view: 'list' }
  const userFolders = state.noteFolders || []
  const folderId = DEFAULT_FOLDERS.some((f) => f.id === ui.folder) || userFolders.some((f) => f.id === ui.folder) ? ui.folder : 'all'
  const view = ui.view === 'gallery' ? 'gallery' : 'list'

  const [screen, setScreen] = useState('list') // folders | list
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [sel, setSel] = useState([])
  const [fEdit, setFEdit] = useState(false)
  const [menu, setMenu] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  const toastT = useRef(0)
  const say = (m) => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 1800) }

  const live = state.notes.filter((n) => !n.deleted)
  const trash = state.notes.filter((n) => n.deleted)
  const countOf = (id) => (id === 'all' ? live.length : id === 'trash' ? trash.length : live.filter((n) => noteFolder(n) === id).length)
  const nameOf = (id) => DEFAULT_FOLDERS.find((f) => f.id === id)?.name || userFolders.find((f) => f.id === id)?.name || '메모'
  const inFolder = (id) => (id === 'all' ? live : id === 'trash' ? trash : live.filter((n) => noteFolder(n) === id))

  const tagCounts = useMemo(() => {
    const m = new Map()
    live.forEach((n) => tagsOf(`${n.title}\n${n.body}`).forEach((t) => m.set(t, (m.get(t) || 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [state.notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let list = inFolder(folderId)
    if (kw) list = list.filter((n) => `${n.title}\n${n.body}`.toLowerCase().includes(kw))
    return [...list].sort((a, b) => b.ts - a.ts)
  }, [state.notes, folderId, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(() => {
    if (q.trim() || folderId === 'trash') return [{ label: q.trim() ? `검색 결과 ${items.length}개` : null, list: items }]
    const out = []
    const pinned = items.filter((n) => n.pinned)
    if (pinned.length) out.push({ label: '고정됨', pin: true, list: pinned })
    items.filter((n) => !n.pinned).forEach((n) => {
      const l = groupLabel(n.ts)
      const last = out[out.length - 1]
      if (last && last.label === l && !last.pin) last.list.push(n)
      else out.push({ label: l, list: [n] })
    })
    return out
  }, [items, q, folderId])

  const openFolder = (id) => { actions.noteUi({ folder: id }); setQ(''); setEditMode(false); setSel([]); setScreen('list') }
  const goFolders = () => { setQ(''); setEditMode(false); setSel([]); setScreen('folders') }
  const startNew = () => {
    const f = userFolders.some((x) => x.id === folderId) ? folderId : 'icloud'
    setEdit({ id: `nn${Date.now()}`, title: '', body: '', folder: f, cts: Date.now() })
  }
  const openNote = (n) => {
    if (editMode) return setSel((s) => (s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id]))
    if (n.deleted) {
      return setSheet({ title: n.title, items: [
        { label: '복구', run: () => actions.restoreNote(n.id) },
        { label: '영구 삭제', danger: true, run: () => actions.purgeNote(n.id) },
      ] })
    }
    setEdit(n)
  }
  const doneEdit = () => { setEditMode(false); setSel([]) }

  /* 편집 화면 */
  if (edit) {
    return (
      <>
        <Editor key={edit.id} note={edit} folderName={folderId === 'all' || folderId === 'icloud' ? '메모' : nameOf(folderId)} onClose={() => setEdit(null)} onToast={say} />
        {toast && <div className="na-toast">{toast}</div>}
      </>
    )
  }

  /* 폴더 화면 */
  if (screen === 'folders') {
    const row = (f, user) => (
      <div key={f.id} className="nf-row">
        {fEdit && user && <button className="nf-minus" aria-label="폴더 삭제" onClick={() => setSheet({ title: `‘${f.name}’ 폴더를 삭제할까요? 안의 메모 ${countOf(f.id)}개는 iCloud 메모로 이동합니다.`, items: [{ label: '폴더 삭제', danger: true, run: () => actions.deleteFolder(f.id) }] })}>−</button>}
        <button className="nf-main" onClick={() => (fEdit && user ? setDialog({ title: '폴더 이름 변경', initial: f.name, onSave: (v) => actions.renameFolder(f.id, v) }) : fEdit ? null : openFolder(f.id))}>
          <FolderIc />
          <span className="nf-name">{f.name}</span>
          <span className="nf-count">{countOf(f.id)}</span>
          {!fEdit && <span className="nf-chev"><Ic n="chev" size={14} sw={2.4} /></span>}
        </button>
      </div>
    )
    return (
      <div className={`page note-app${kb ? ' kb' : ''}`} style={{ paddingBottom: kb }}>
        <div className="nav"><span /><button className="nav-btn" onClick={() => setFEdit(!fEdit)}>{fEdit ? '완료' : '편집'}</button></div>
        <div className="large-title">폴더</div>
        <div className="scroll">
          <div className="na-cap">iCloud</div>
          <div className="na-group">{DEFAULT_FOLDERS.map((f) => row(f, false))}</div>
          <div className="na-cap">내 폴더</div>
          <div className="na-group">
            {userFolders.length === 0 && <div className="nf-empty">아직 만든 폴더가 없습니다</div>}
            {userFolders.map((f) => row(f, true))}
          </div>
          {tagCounts.length > 0 && (
            <>
              <div className="na-cap">태그</div>
              <div className="nf-tags">
                {tagCounts.map(([t, c]) => (
                  <button key={t} onClick={() => { actions.noteUi({ folder: 'all' }); setQ(t); setScreen('list') }}>{t}<em>{c}</em></button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="na-bar">
          <button className="na-newf" onClick={() => setDialog({ title: '새 폴더', initial: '', onSave: (v) => actions.addFolder(v) })}><Ic n="folderplus" /><span>새 폴더</span></button>
          <button aria-label="새 메모" onClick={startNew}><Ic n="compose" /></button>
        </div>
        {sheet && <Sheet {...sheet} onClose={() => setSheet(null)} />}
        {dialog && <NameDialog {...dialog} onClose={() => setDialog(null)} />}
      </div>
    )
  }

  /* 목록 화면 */
  const isTrash = folderId === 'trash'
  const selNotes = state.notes.filter((n) => sel.includes(n.id))
  const moveTargets = [{ id: 'icloud', name: 'iCloud 메모' }, ...userFolders]
  const renderRow = (n) => (
    <button key={n.id} className={`nr${editMode ? ' selecting' : ''}`} onClick={() => openNote(n)}>
      {editMode && <i className={`nr-sel${sel.includes(n.id) ? ' on' : ''}`}>{sel.includes(n.id) && <Ic n="check" size={14} sw={3} />}</i>}
      <span className="nr-body">
        <b className="nr-t">{n.title || '새로운 메모'}</b>
        <span className="nr-s"><em>{dateStr(n.ts)}</em><span>{previewOf(n)}</span></span>
        {folderId === 'all' && !q && <span className="nr-f"><FolderIc size={13} />{nameOf(noteFolder(n))}</span>}
      </span>
    </button>
  )
  const renderCard = (n) => (
    <button key={n.id} className="ng-item" onClick={() => openNote(n)}>
      <span className="ng-card">
        {editMode && <i className={`nr-sel${sel.includes(n.id) ? ' on' : ''}`}>{sel.includes(n.id) && <Ic n="check" size={14} sw={3} />}</i>}
        {bodyLines(n).slice(0, 7).join('\n') || (/<img/.test(n.html || '') ? '사진' : '')}
      </span>
      <b>{n.title || '새로운 메모'}</b>
      <em>{dateStr(n.ts)}</em>
    </button>
  )

  return (
    <div className={`page note-app${kb ? ' kb' : ''}`} style={{ paddingBottom: kb }}>
      <div className="nav">
        <Back onClick={goFolders}>폴더</Back>
        <span className="na-nav-r">
          <button className="txt" onClick={() => (editMode ? doneEdit() : setEditMode(true))}>{editMode ? '완료' : '편집'}</button>
          <button aria-label="더보기" onClick={() => setMenu(true)}><Ic n="more" /></button>
        </span>
      </div>
      <div className="large-title">{folderId === 'all' ? '메모' : nameOf(folderId)}</div>
      <label className="na-search">
        <Ic n="search" size={16} sw={2.2} />
        <input value={q} placeholder="검색" onChange={(e) => setQ(e.target.value)} />
        {q && <button aria-label="검색어 지우기" onClick={(e) => { e.preventDefault(); setQ('') }}>×</button>}
      </label>

      <div className="scroll">
        {items.length === 0 && <div className="empty">{q ? '검색 결과가 없습니다' : isTrash ? '삭제된 메모가 없습니다' : '메모가 없습니다'}</div>}
        {sections.map((s, i) => s.list.length > 0 && (
          <div key={`${s.label}-${i}`}>
            {s.label && <div className="na-sec">{s.pin && <Ic n="pin" size={15} sw={2} />}{s.label}</div>}
            {view === 'gallery' ? <div className="ng">{s.list.map(renderCard)}</div> : <div className="na-group">{s.list.map(renderRow)}</div>}
          </div>
        ))}
      </div>

      {editMode ? (
        <div className="na-bar edit">
          {isTrash ? (
            <>
              <button disabled={!sel.length} onClick={() => { sel.forEach((id) => actions.restoreNote(id)); doneEdit() }}>복구</button>
              <button className="danger" disabled={!sel.length} onClick={() => setSheet({ title: `메모 ${sel.length}개를 영구 삭제할까요?`, items: [{ label: '영구 삭제', danger: true, run: () => { sel.forEach((id) => actions.purgeNote(id)); doneEdit() } }] })}>삭제</button>
            </>
          ) : (
            <>
              <button disabled={!sel.length} onClick={() => setSheet({ title: '폴더로 이동', items: moveTargets.map((f) => ({ label: f.name, run: () => { sel.forEach((id) => actions.moveNote(id, f.id)); doneEdit() } })) })}>이동</button>
              <button disabled={!sel.length} onClick={() => { const all = selNotes.every((n) => n.pinned); selNotes.forEach((n) => { if (!!n.pinned === all) actions.pinNote(n.id) }); doneEdit() }}>{selNotes.length && selNotes.every((n) => n.pinned) ? '고정 해제' : '고정'}</button>
              <button className="danger" disabled={!sel.length} onClick={() => { sel.forEach((id) => actions.deleteNote(id)); doneEdit() }}>삭제</button>
            </>
          )}
        </div>
      ) : (
        <div className="na-bar">
          <span />
          <span className="na-count">{items.length}개의 메모</span>
          {isTrash ? <span /> : <button aria-label="새 메모" onClick={startNew}><Ic n="compose" /></button>}
        </div>
      )}

      {menu && (
        <Menu
          onClose={() => setMenu(false)}
          items={[
            { label: '목록으로 보기', icon: 'list', check: view === 'list', run: () => actions.noteUi({ view: 'list' }) },
            { label: '갤러리로 보기', icon: 'grid', check: view === 'gallery', run: () => actions.noteUi({ view: 'gallery' }) },
            { label: '메모 선택', run: () => setEditMode(true) },
            ...(isTrash && trash.length ? [{ label: '모두 삭제', danger: true, run: () => setSheet({ title: '최근 삭제된 메모를 모두 영구 삭제할까요?', items: [{ label: '모두 삭제', danger: true, run: () => actions.emptyTrash() }] }) }] : []),
          ]}
        />
      )}
      {sheet && <Sheet {...sheet} onClose={() => setSheet(null)} />}
      {toast && <div className="na-toast">{toast}</div>}
    </div>
  )
}
