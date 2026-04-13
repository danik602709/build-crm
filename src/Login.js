import { useState } from 'react';
import { supabase } from './supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Неверный email или пароль');
    setLoading(false);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0d1117',fontFamily:'Onest,sans-serif'}}>
        <div style={{background:'#161c2a',border:'1px solid #1e2840',borderRadius:16,padding:40,width:360,maxWidth:'90vw'}}>
          <div style={{fontSize:24,fontWeight:900,color:'#fff',marginBottom:4}}>Build<span style={{color:'#f97316'}}>CRM</span></div>
          <div style={{fontSize:13,color:'#5a6685',marginBottom:32}}>Строительный учёт</div>
          {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 14px',color:'#ef4444',fontSize:13,marginBottom:16}}>{error}</div>}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:'#5a6685',marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'0.5px'}}>Email</label>
            <input style={{background:'#0d1117',border:'1px solid #1e2840',borderRadius:8,padding:'10px 14px',color:'#dde3f0',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box'}}
              type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:11,color:'#5a6685',marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'0.5px'}}>Пароль</label>
            <input style={{background:'#0d1117',border:'1px solid #1e2840',borderRadius:8,padding:'10px 14px',color:'#dde3f0',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box'}}
              type="password" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          <button style={{background:'#f97316',color:'#fff',border:'none',borderRadius:8,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}
            onClick={handleLogin} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    </>
  );
}
