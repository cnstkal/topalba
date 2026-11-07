import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './apps/AppStore.css'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App render failed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#222', background: '#fff', minHeight: '100vh', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <h2 style={{ marginTop: 40 }}>화면을 불러오지 못했어요</h2>
          <p>오류 내용을 확인할 수 있도록 표시했어요.</p>
          <pre style={{ padding: 16, background: '#f2f2f7', borderRadius: 12, fontSize: 12 }}>{String(this.state.error?.stack || this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 18px', background: '#007aff', color: '#fff', borderRadius: 10 }}>새로고침</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
)
