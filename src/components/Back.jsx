export default function Back({ onClick, children }) {
  return (
    <button className="back txt" onClick={onClick}>
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L2 10l8 8" />
      </svg>
      {children}
    </button>
  )
}
