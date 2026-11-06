import { useState } from 'react'
import Back from '../components/Back'
import { DAYS } from '../utils'

// 사진은 색상 타일로 표현 (추후 실제 이미지로 교체 가능)
const TINTS = ['#f5e6d3', '#d6ecff', '#e8f5e9', '#fde7f1', '#fff4cc', '#e6e0ff', '#ffe0cc', '#d9f0f2']
const PHOTOS = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  tint: TINTS[i % TINTS.length],
  caption: ['한강 산책', '점심 메뉴', '회사 근처', '퇴근길', '카페', '주말'][i % 6],
  daysAgo: i * 2 + 1,
  fav: i % 5 === 0,
  shot: i % 7 === 0,
}))

const fmt = (n) => {
  const d = new Date(Date.now() - n * 86400000)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`
}

export default function Photos() {
  const [tab, setTab] = useState('lib')
  const [album, setAlbum] = useState(null)
  const [detail, setDetail] = useState(null)
  const [favs, setFavs] = useState({})

  const albums = [
    { id: 'recent', name: '최근 항목', list: PHOTOS },
    { id: 'fav', name: '즐겨찾는 항목', list: PHOTOS.filter((p) => p.fav || favs[p.id]) },
    { id: 'shot', name: '스크린샷', list: PHOTOS.filter((p) => p.shot) },
  ]

  if (detail !== null) {
    const p = PHOTOS.find((x) => x.id === detail)
    return (
      <div className="page">
        <div className="nav">
          <Back onClick={() => setDetail(null)}>사진</Back>
          <div className="pd-date">{fmt(p.daysAgo)}</div>
          <span style={{ width: 40 }} />
        </div>
        <div className="pd-img" style={{ background: p.tint }}>
          <span>{p.caption}</span>
        </div>
        <div className="toolbar">
          <button onClick={() => setFavs({ ...favs, [p.id]: !favs[p.id] })}>{favs[p.id] || p.fav ? '♥ 즐겨찾기 됨' : '♡ 즐겨찾기'}</button>
        </div>
      </div>
    )
  }

  const grid = (list) => (
    <div className="ph-grid">
      {list.map((p) => (
        <button key={p.id} style={{ background: p.tint }} onClick={() => setDetail(p.id)} />
      ))}
    </div>
  )

  if (album) {
    const a = albums.find((x) => x.id === album)
    return (
      <div className="page">
        <div className="nav">
          <Back onClick={() => setAlbum(null)}>앨범</Back>
        </div>
        <div className="large-title">{a.name}</div>
        <div className="scroll">{a.list.length ? grid(a.list) : <div className="empty">사진이 없습니다.</div>}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav"><span /><span className="nav-btn">선택</span></div>
      <div className="large-title">{tab === 'lib' ? '보관함' : '앨범'}</div>
      <div className="scroll">
        {tab === 'lib' ? (
          grid(PHOTOS)
        ) : (
          <div className="albums">
            {albums.map((a) => (
              <button key={a.id} onClick={() => setAlbum(a.id)}>
                <div className="album-cover" style={{ background: a.list[0]?.tint || '#eee' }} />
                <b>{a.name}</b>
                <span>{a.list.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="toolbar">
        <button className={tab === 'lib' ? 'on' : ''} onClick={() => setTab('lib')}>보관함</button>
        <button className={tab === 'album' ? 'on' : ''} onClick={() => setTab('album')}>앨범</button>
      </div>
    </div>
  )
}
