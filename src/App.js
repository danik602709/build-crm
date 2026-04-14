import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [objects, setObjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchInitialData(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchInitialData(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchInitialData(uid) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(p);
    const { data: o } = await supabase.from('objects').select('*');
    const { data: tsk } = await supabase.from('tasks').select('*').order('deadline', { ascending: true });
    const { data: allP } = await supabase.from('profiles').select('*');
    setObjects(o || []);
    setTasks(tsk || []);
    setProfiles(allP || []);
    setLoading(false);
  }

  async function handleUpdateTask(e) {
    e.preventDefault();
    if (profile.role !== 'admin') return;
    const fd = new FormData(e.target);
    const { error } = await supabase.from('tasks').update({
      text: fd.get('text'),
      user_id: fd.get('user_id'),
      deadline: fd.get('deadline'),
      done: fd.get('done') === 'true'
    }).eq('id', editingTask.id);
    if (error) alert(error.message); else { setEditingTask(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Abyroi CRM...</div>;

  if (!session) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
            if (error) alert(error.message);
        }} style={{ background: C.card, padding: 40, borderRadius: 20, width: 320, border: `1px solid ${C.border}` }}>
          <h1 style={{ color: '#fff', fontSize: 24, textAlign: 'center' }}>Abyroi CRM</h1>
          <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginTop: 20 }} />
          <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginTop: 10 }} />
          <button type="submit" style={{ width: '100%', padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, marginTop: 20 }}>Войти</button>
        </form>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const totalBudget = objects.reduce((sum, o) => sum + (Number(o.budget_income) || 0), 0);
  const totalExpenses = objects.reduce((sum, o) => sum + (Number(o.actual_expenses) || 0), 0);
  const completedTasks = tasks.filter(t => t.done).length;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Sidebar */}
      <div style={{width:240, borderRight:`1px solid ${C.border}`, padding:25}}>
        <h2 style={{color:C.accent}}>Abyroi CRM</h2>
        <div onClick={() => setTab('dashboard')} style={{padding:12, cursor:'pointer', color: tab==='dashboard'?C.accent:C.muted}}>📊 Дашборд</div>
        <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.muted}}>🏗️ Объекты</div>
        <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.muted}}>✅ Задачи</div>
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:40, background:'none', color:C.red, border:'none', cursor:'pointer'}}>Выйти</button>
      </div>

      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        {tab === 'dashboard' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:40}}>
              <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted, fontSize:14}}>Объектов в работе</div>
                <div style={{fontSize:32, fontWeight:800}}>{objects.length}</div>
              </div>
              <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted, fontSize:14}}>Задач выполнено</div>
                <div style={{fontSize:32, fontWeight:800, color:C.green}}>{completedTasks} / {tasks.length}</div>
              </div>
              {isAdmin && (
                <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
                  <div style={{color:C.muted, fontSize:14}}>Текущая маржа (прогноз)</div>
                  <div style={{fontSize:24, fontWeight:800, color:C.accent}}>{(totalBudget - totalExpenses).toLocaleString()} ₸</div>
                </div>
              )}
            </div>
            <h3>Объекты детально</h3>
            <div style={{display:'grid', gap:15}}>
              {objects.map(o => (
                <div key={o.id} style={{background:C.card, padding:20, borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{o.name}</div>
                    <div style={{fontSize:12, color:C.muted}}>{o.address}</div>
                  </div>
                  {isAdmin && <div style={{fontWeight:700}}>{o.actual_expenses?.toLocaleString()} / {o.budget_income?.toLocaleString()} ₸</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div>
            <h3>Все задачи</h3>
            <div style={{background:C.card, borderRadius:12, border:`1px solid ${C.border}`}}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => isAdmin && setEditingTask(t)} style={{padding:15, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', cursor:isAdmin?'pointer':'default'}}>
                  <div>
                    <div style={{fontWeight:600}}>{t.text} {isAdmin && '✏️'}</div>
                    <div style={{fontSize:12, color:C.muted}}>{objects.find(o=>o.id===t.object_id)?.name} | Исполнитель: {profiles.find(p=>p.id===t.user_id)?.name}</div>
                  </div>
                  <div style={{color: t.done ? C.green : C.red}}>{t.deadline ? `До ${t.deadline}` : 'Нет срока'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Форма редактирования задачи (только для Админа) */}
        {editingTask && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200}}>
            <form onSubmit={handleUpdateTask} style={{background:C.card, padding:30, borderRadius:15, width:350}}>
              <h3>Редактировать задачу</h3>
              <input name="text" defaultValue={editingTask.text} style={{width:'100%', padding:10, marginBottom:10, background:C.bg, color:'#fff'}} />
              <select name="user_id" defaultValue={editingTask.user_id} style={{width:'100%', padding:10, marginBottom:10, background:C.bg, color:'#fff'}}>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input name="deadline" type="date" defaultValue={editingTask.deadline} style={{width:'100%', padding:10, marginBottom:10, background:C.bg, color:'#fff'}} />
              <select name="done" defaultValue={editingTask.done.toString()} style={{width:'100%', padding:10, marginBottom:20, background:C.bg, color:'#fff'}}>
                <option value="false">В работе</option>
                <option value="true">Выполнено</option>
              </select>
              <button type="submit" style={{width:'100%', padding:12, background:C.accent, color:'#fff', border:'none', borderRadius:8}}>Сохранить изменения</button>
              <button onClick={()=>setEditingTask(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
