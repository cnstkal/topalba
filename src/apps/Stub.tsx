// 구현 전 앱 임시 화면 (다음 세션에서 교체)
export default function Stub({ close }) {
  return (
    <div className="page">
      <div className="nav"><button onClick={close}>닫기</button></div>
      <div style={{ margin: 'auto', color: '#8e8e93' }}>준비 중입니다</div>
    </div>
  )
}
