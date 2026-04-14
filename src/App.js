import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('objects');
  const [objects, setObjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(null);

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

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'),
      password: fd.get('password'),
    });
    if (error) alert("Ошибка: " + error.message);
  }

  async function handleAddObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').insert([{
      name: fd.get('name'), address: fd.get('address'), budget: Number(fd.get('budget')), progress: 0
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Загрузка Abyroi CRM...</div>;

  // ЭКРАН ВХОДА
  if (!session) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: C.card, padding: 40, borderRadius: 20, width: 320, border: `1px solid ${C.border}` }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, textAlign: 'center', margin: '0 0 5px 0' }}>Abyroi<span style={{ color: C.accent }}>CRM</span></h1>
          <p style={{ color: C.muted, textAlign: 'center', marginBottom: 30, fontSize: 14 }}>Система управления строительством</p>
          <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 15, boxSizing: 'border-box' }} />
          <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 15, boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Войти</button>
        </form>
      </div>
    );
  }

  // ГЛАВНЫЙ ИНТЕРФЕЙС
  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:25}}>
        <div style={{fontSize:22, fontWeight:900, color:'#fff', marginBottom:35}}>Abyroi<span style={{color:C.accent}}>CRM</span></div>
        <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.muted}}>🏗️ Объекты</div>
        <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.muted}}>✅ Задачи</div>
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:20, background:'none', border:`1px solid ${C.border}`, color:C.muted, padding:8, borderRadius:5, cursor:'pointer', width:'100%'}}>Выйти</button>
      </div>

      <div style={{flex:1, padding:40}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
          <h2>{tab === 'objects' ? 'Объекты' : 'Задачи'}</h2>
          <button onClick={() => setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, cursor:'pointer'}}>+ Добавить</button>
        </div>

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            {objects.map(o => (
              <div key={o.id} style={{background:C.card, padding:20, borderRadius:12, border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700, fontSize:18}}>{o.name}</div>
                <div style={{color:C.muted}}>{o.address}</div>
                <div style={{marginTop:10
