// 테트리스: 독립 페이지(public/games/tetris.html)를 앱 화면 안에 띄움
export default function Tetris() {
  return (
    <iframe
      src={`${import.meta.env.BASE_URL}games/tetris.html`}
      title="테트리스"
      style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#16161a' }}
    />
  )
}
