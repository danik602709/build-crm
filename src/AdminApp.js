import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function AdminApp({ profile }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [profiles, setProfiles] = useState([]); // Все пользователи (сотрудники и директора)
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: o } = await supabase.from('objects').select('*');
    const { data: t } = await supabase.from('transactions').select('*');
    const { data: p } = await supabase.from('profiles').select('*');
    const { data: tsk } = await supabase.from('tasks').select('*');
    
    setObjects(o || []); 
    setTransactions(t || []);
    setProfiles(p || []);
    setTasks(tsk || []);
    setLoading(false);
  }

  // Создание объекта
  async function handleAddObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').insert([{
      name: fd.get('name'),
      address: fd.get('address'),
      budget: Number(fd.get('budget')),
      stage: 'Проектирование',
      progress: 0
    }]);
    if (!error) { setShowModal(null); loadData(); }
  }

  // Создание задачи
  async function handleAddTask(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('tasks').insert([{
      object_id: fd.get('object_id'),
      text: fd.get('text'),
      user_id: fd.get('user_id'), // Назначаем исполнителя
      done: false
    }]);
    if (!error) { setShowModal(null); loadData(); }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const NavItem = ({ id, label, icon }) => (
    <div onClick={() => setTab(id)} style={{
      padding:'12px 16px', cursor:'pointer', borderRadius:8, marginBottom:4,
      background: tab === id ? 'rgba(249,115,22,0.1)' : 'transparent',
      color: tab === id ? C.accent : C.muted,
      display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight: tab === id ? 700 : 400
    }}>
      <span>{icon}</span> {label}
    </div>
  );

  const inputStyle = { width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', marginBottom: 12 };

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Загрузка...</div>;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Onest, sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700;900&display=swap" rel="stylesheet"/>
      
      {/* Sidebar */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:24, display:'flex', flexDirection:'column'}}>
        <div style={{fontSize:22, fontWeight:900, color:'#fff', marginBottom:32}}>Build<span style={{color:C.accent}}>CRM</span></div>
        <nav style={{flex:1}}>
          <NavItem id="dashboard" label="Дашборд" icon="📊" />
          <NavItem id="objects" label="Объекты" icon="🏗️" />
          {profile?.role === 'admin' && <NavItem id="finance" label="Финансы" icon="💰" />}
          <NavItem id="tasks" label="Задачи" icon="✅" />
          <NavItem id="team" label="Команда" icon="👷" />
        </nav>
        <button onClick={handleLogout} style={{background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:10, borderRadius:8, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Main Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32}}>
          <h1 style={{fontSize:24, fontWeight:800, margin:0}}>
            {tab === 'dashboard' && 'Обзор'}
            {tab === 'objects' && 'Строительные объекты'}
            {tab === 'tasks' && 'Управление задачами'}
            {tab === 'team' && 'Сотрудники'}
            {tab === 'finance' && 'Финансы'}
          </h1>
          <div style={{display:'flex', gap:12}}>
            <button onClick={() => setShowModal('object')} style={{background:C.accent, color:'#fff', border:'none', padding:'10px 18px', borderRadius:8, cursor:'pointer', fontWeight:700}}>+ Объект</button>
            <button onClick={() => setShowModal('task')} style={{background:C.green, color:'#fff', border:'none', padding:'10px 18px', borderRadius:8, cursor:'pointer', fontWeight:700}}>+ Задача</button>
          </div>
        </div>

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {objects.map(o => (
              <div key={o.id} style={{background:C.card, padding:20, borderRadius:16, border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:800, fontSize:18, marginBottom:4}}>{o.name}</div>
                <div style={{fontSize:13, color:C.muted, marginBottom:16}}>{o.address}</div>
                <div style={{fontSize:14}}>Прогресс: <span style={{color:C.accent, fontWeight:700}}>{o.progress}%</span></div>
                <div style={{height:6, background:C.border, borderRadius:3, marginTop:8, overflow:'hidden'}}>
                  <div style={{width:`${o.progress}%`, height:'100%', background:C.accent}} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden'}}>
            {tasks.map(t => {
              const obj = objects.find(o => o.id === t.object_id);
              const worker = profiles.find(p => p.id === t.user_id);
              return (
                <div key={t.id} style={{padding:'16px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:600}}>{t.text}</div>
                    <div style={{fontSize:12, color:C.muted}}>{obj?.name} — Исполнитель: {worker?.name || 'Не назначен'}</div>
                  </div>
                  <div style={{padding:'4px 12px', borderRadius:20, fontSize:12, background: t.done ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)', color: t.done ? C.green : C.accent}}>
                    {t.done ? 'Выполнено' : 'В работе'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'team' && (
          <div style={{display:'grid', gap:10}}>
            {profiles.map(p => (
              <div key={p.id} style={{background:C.card, padding:16, borderRadius:12, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between'}}>
                <span>{p.name}</span>
                <span style={{fontSize:12, color:C.muted, textTransform:'uppercase'}}>{p.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка Объекта */}
      {showModal === 'object' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddObject} style={{background:C.card, padding:32, borderRadius:16, width:400}}>
            <h2 style={{marginTop:0}}>Новый объект</h2>
            <input name="name" placeholder="Название (например, ЖК Астана)" required style={inputStyle} />
            <input name="address" placeholder="Адрес" required style={inputStyle} />
            <input name="budget" type="number" placeholder="Бюджет (₸)" required style={inputStyle} />
            <button type="submit" style={{width:'100%', background:C.accent, color:'#fff', padding:12, border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>Создать объект</button>
            <button type="button" onClick={() => setShowModal(null)} style={{width:'100%', background:'transparent', color:C.muted, marginTop:10, border:'none', cursor:'pointer'}}>Отмена</button>
          </form>
        </div>
      )}

      {/* Модалка Задачи */}
      {showModal === 'task' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddTask} style={{background:C.card, padding:32, borderRadius:16, width:400}}>
            <h2 style={{marginTop:0}}>Назначить задачу</h2>
            <select name="object_id" required style={inputStyle}>
              <option value="">Выберите объект</option>
              {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input name="text" placeholder="Что нужно сделать?" required style={inputStyle} />
            <select name="user_id" required style={inputStyle}>
              <option value="">Выберите исполнителя</option>
              {profiles.filter(p => p.role === 'employee').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" style={{width:'100%', background:C.green, color:'#fff', padding:12, border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>Назначить</button>
            <button type="button" onClick={() => setShowModal(null)} style={{width:'100%', background:'transparent', color:C.muted, marginTop:10, border:'none', cursor:'pointer'}}>Отмена</button>
          </form>
        </div>
      )}
    </div>
  );
}
