export default function Weather({ close }) {
  return <div className="page" style={{background:'linear-gradient(#58b8f7,#dcefff)',color:'#fff'}}>
    <div className="nav"><button onClick={close}>완료</button><span>날씨</span></div>
    <div style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:72}}>☀️</div><div style={{fontSize:68,fontWeight:200}}>18°</div><div style={{fontSize:20}}>인천 · 맑음</div><p>최고 21° · 최저 12°</p></div>
    <div style={{margin:14,padding:20,borderRadius:18,background:'#ffffff33'}}><b>시간별 날씨</b>{['지금　☀️　18°','오후 1시　☀️　19°','오후 2시　🌤️　20°','오후 3시　🌤️　21°'].map(x=><p key={x}>{x}</p>)}</div>
    <div style={{margin:14,padding:20,borderRadius:18,background:'#ffffff33'}}><b>주간 예보</b>{['오늘　맑음　21° / 12°','일요일　구름 조금　20° / 11°','월요일　흐림　18° / 10°','화요일　맑음　19° / 11°'].map(x=><p key={x}>{x}</p>)}</div>
  </div>
}