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

  // Логика создания и редактирования
  async function handleAddObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').insert([{
      name: fd.get('name'), address: fd.get('address'), 
      budget_income: Number(fd.get('budget')), actual_expenses: 0
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('tasks').insert([{
      object_id: fd.get('object_id'), text: fd.get('text'), 
      user_id: fd.get('user_id'), deadline: fd.get('deadline'), done: false
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Abyroi CRM...</div>;

  if (!session) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
            if (error) alert("Ошибка входа");
        }} style={{ background: C.card, padding: 40, borderRadius: 20, width: 320, border: `1px solid ${C.border}` }}>
          <h1 style={{ color: '#fff', textAlign: 'center' }}>Abyroi CRM</h1>
          <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginTop: 20 }} />
          <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginTop: 10 }} />
          <button type="submit" style={{ width: '100%', padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, marginTop: 20 }}>Войти</button>
        </form>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

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

      {/* Main Area */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
            <h2 style={{margin:0}}>{tab === 'dashboard' ? 'Обзор' : tab === 'objects' ? 'Объекты' : 'Задачи'}</h2>
            <div style={{display:'flex', gap:10}}>
                <button onClick={() => setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700, cursor:'pointer'}}>+ Объект</button>
                <button onClick={() => setShowModal('task')} style={{background:C.green, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700, cursor:'pointer'}}>+ Задача</button>
            </div>
        </div>

        {tab === 'dashboard' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20}}>
            <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted}}>Всего объектов</div>
                <div style={{fontSize:32, fontWeight:900}}>{objects.length}</div>
            </div>
            <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted}}>Задач в работе</div>
                <div style={{fontSize:32, fontWeight:900, color:C.accent}}>{tasks.filter(t=>!t.done).length}</div>
            </div>
            {isAdmin && (
                <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                    <div style={{color:C.muted}}>Бюджет (доход)</div>
                    <div style={{fontSize:32, fontWeight:900, color:C.green}}>{objects.reduce((a,b)=>a+(b.budget_income||0),0).toLocaleString()} ₸</div>
                </div>
            )}
          </div>
        )}

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {objects.map(o => (
              <div key={o.id} style={{background:C.card, padding:25, borderRadius:16, border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:800, fontSize:20}}>{o.name}</div>
                <div style={{color:C.muted, fontSize:14, marginBottom:15}}>📍 {o.address}</div>
                <div style={{fontSize:14}}>План дохода: <b>{o.budget_income?.toLocaleString()} ₸</b></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden'}}>
            {tasks.map(t => (
              <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <div style={{fontWeight:700}}>{t.text}</div>
                    <div style={{fontSize:12, color:C.muted}}>
                        {objects.find(o=>o.id===t.object_id)?.name} | 👷 {profiles.find(p=>p.id===t.user_id)?.name}
                    </div>
                </div>
                <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13, fontWeight:700, color: new Date(t.deadline) < new Date() && !t.done ? C.red : C.accent}}>
                        📅 {t.deadline || 'Срок не задан'}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалки */}
      {showModal === 'object' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddObject} style={{background:C.card, padding:30, borderRadius:20, width:380}}>
            <h3>Новый проект</h3>
            <input name="name" placeholder="Название объекта" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}} />
            <input name="address" placeholder="Адрес (город, улица)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}} />
            <input name="budget" type="number" placeholder="Бюджет дохода (₸)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:20}} />
            <button type="submit" style={{width:'100%', padding:14, background:C.accent, color:'#fff', border:'none', borderRadius:10, fontWeight:700}}>Создать объект</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
          </form>
        </div>
      )}

      {showModal === 'task' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddTask} style={{background:C.card, padding:30, borderRadius:20, width:380}}>
            <h3>Назначить задачу</h3>
            <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}}>
                <option value="">Выберите объект</option>
                {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input name="text" placeholder="Что нужно сделать?" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}} />
            <select name="user_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}}>
                <option value="">Выберите исполнителя</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="deadline" type="date" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:20}} />
            <button type="submit" style={{width:'100%', padding:14, background:C.green, color:'#fff', border:'none', borderRadius:10, fontWeight:700}}>Поставить задачу</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
          </form>
        </div>
      )}
    </div>
  );
}
