import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = { bg: '#0d1117', card: '#161c2d', border: '#2d3748', text: '#e2e8f0', abyroi: '#3b82f6', crm: '#facc15', green: '#10b981', red: '#ef4444' };

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      else setLoading(false);
    });
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: p } = await supabase.from('objects').select('*');
    const { data: t } = await supabase.from('tasks').select('*');
    setProjects(p || []);
    setTasks(t || []);
    setLoading(false);
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>ABYROI CRM...</div>;
  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Меню без лишних скриптов */}
      <aside style={{width:240, borderRight:`1px solid ${C.border}`, padding:25, background:'#090c12'}}>
        <div style={{fontSize:22, fontWeight:900, marginBottom:40}}><span style={{color:C.abyroi}}>ABYROI</span> <span style={{color:C.crm}}>CRM</span></div>
        <div onClick={()=>setTab('projects')} style={navStyle(tab==='projects')}>🏗️ Объекты</div>
        <div onClick={()=>setTab('tasks')} style={navStyle(tab==='tasks')}>✅ Задачи</div>
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:40, background:'none', border:'none', color:C.red, cursor:'pointer'}}>Выйти</button>
      </aside>

      <main style={{flex:1, padding:40, overflowY:'auto'}}>
        {tab === 'projects' ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {projects.map(p => (
              <div key={p.id} style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                <h3 style={{margin:0}}>{p.name}</h3>
                <p style={{color:C.muted, fontSize:14}}>{p.address}</p>
                <div style={{marginTop:15, display:'flex', justifyContent:'space-between'}}>
                    <span>Прибыль:</span>
                    <span style={{color:C.green, fontWeight:700}}>{(p.contract_sum - p.actual_expenses).toLocaleString()} ₸</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{background:C.card, borderRadius:15, border:`1px solid ${C.border}`}}>
            {tasks.map(t => (
              <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between'}}>
                <span>{t.text}</span>
                <span style={{color:C.crm}}>{t.deadline}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const navStyle = (active) => ({ padding:'12px 15px', cursor:'pointer', borderRadius:10, background: active ? 'rgba(59,130,246,0.1)' : 'transparent', color: active ? '#3b82f6' : '#94a3b8', marginBottom:5 });

function LoginForm({ C }) {
    return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
            if (error) alert("Ошибка");
        }} style={{background:C.card, padding:40, borderRadius:20, width:300, textAlign:'center'}}>
            <h2 style={{color:C.abyroi}}>ABYROI CRM</h2>
            <input name="email" type="email" placeholder="Email" required style={{width:'100%', padding:12, marginBottom:10, borderRadius:8}} />
            <input name="password" type="password" placeholder="Пароль" required style={{width:'100%', padding:12, marginBottom:20, borderRadius:8}} />
            <button type="submit" style={{width:'100%', padding:12, background:C.abyroi, color:'#fff', border:'none', borderRadius:8}}>Войти</button>
        </form>
    </div>;
}
