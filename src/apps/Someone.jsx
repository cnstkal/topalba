import { useState } from 'react'
export default function Someone() {
 const [answer,setAnswer]=useState('')
 const [saved,setSaved]=useState(false)
 return <div className="page" style={{background:'#fff8f5'}}>
  <div className="nav"><b style={{color:'#e96f86'}}>썸원</b><span>♡</span></div>
  <div className="scroll" style={{padding:20}}>
   <div style={{textAlign:'center',padding:'30px 0'}}><div style={{fontSize:52}}>💗</div><h2 style={{color:'#e96f86'}}>우리의 작은 기록</h2><p style={{color:'#9b8588'}}>서로의 하루를 하나씩 모아가요</p></div>
   <div style={{background:'#fff',borderRadius:18,padding:20,boxShadow:'0 4px 18px #e9cfd455'}}>
    <small style={{color:'#e8798e'}}>TODAY'S QUESTION</small><h3>오늘 가장 기억에 남는 순간은?</h3>
    <textarea value={answer} onChange={e=>{setAnswer(e.target.value);setSaved(false)}} placeholder="오늘의 이야기를 남겨봐" style={{width:'100%',minHeight:120,boxSizing:'border-box',border:0,background:'#fff7f8',borderRadius:12,padding:12}} />
    <button onClick={()=>setSaved(true)} style={{width:'100%',marginTop:12,padding:13,border:0,borderRadius:12,background:'#f17c91',color:'#fff'}}>기록 저장</button>
    {saved&&<p style={{color:'#e8798e'}}>기록했어 ♡</p>}
   </div>
  </div>
 </div>
}