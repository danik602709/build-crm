import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function AdminApp({ profile }) {
  const [tab, setTab] = useState('objects');
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: o } = await supabase.from('objects').select('*');
    const { data: p } = await supabase.from('profiles').select('*');
    const { data: tsk } = await supabase.from('tasks').select('*').order('deadline', { ascending: true });
    setObjects(o || []); 
    setProfiles(p || []);
    setTasks(tsk || []);
    setLoading(false);
  }

  async function handleAddObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newObj = {
      name: fd.get('name'),
      address: fd.get('address'),
      budget: Number(fd.get('budget')),
      progress: 0,
      stage: 'Проектирование'
    };
    const { error } = await supabase.from('objects').insert([newObj]);
    if (error) alert("Ошибка: " + error.message);
    else { setShowModal(null); loadData(); }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newTask = {
      object_id: fd.get('object_id'),
      text: fd.get('text'),
      user_id: fd.get('user_id'),
      deadline: fd.get('deadline'),
      done: false
    };
    const { error } = await supabase.from('tasks').insert([newTask]);
    if (error) alert("Ошибка: " + error.message);
    else { setShowModal(null); loadData(); }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'sans-serif'}}>Загрузка Abyroi CRM...</div>;

  const inputStyle = { width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 15, fontSize: '14px' };
  const labelStyle = { display:'block', marginBottom: 5, fontSize: 12, color: C.muted };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Onest, sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700;900&display=swap" rel="stylesheet"/>
      
      {/* Sidebar */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:25, display:'flex', flexDirection:'column'}}>
        <div style={{fontSize:22, fontWeight:900, color:'#fff', marginBottom:35}}>Abyroi<span style={{color:C.accent}}>CRM</span></div>
        <nav style={{flex:1}}>
            <div onClick={() => setTab('objects')} style={{padding:'12px', cursor:'pointer', borderRadius:8, background: tab==='objects'?'rgba(249,115,22,0.1)':'transparent', color: tab==='objects'?C.accent:C.muted, marginBottom:5}}>🏗️ Объекты</div>
            <div onClick={() => setTab('tasks')} style={{padding:'12px', cursor:'pointer', borderRadius:8, background: tab==='tasks'?'rgba(249,115,22,0.1)':'transparent', color: tab==='tasks'?C.accent:C.muted, marginBottom:5}}>✅ Задачи</div>
            <div onClick={() => setTab('team')} style={{padding:'12px', cursor:'pointer', borderRadius:8, background: tab==='team'?'rgba(249,115,22,0.1)':'transparent', color: tab==='team'?C.accent:C.muted, marginBottom:5}}>👷 Команда</div>
            {profile?.role === 'admin' && (
                <div onClick={() => setTab('finance')} style={{padding:'12px', cursor:'pointer', borderRadius:8, background: tab==='finance'?'rgba(249,115,22,0.1)':'transparent', color: tab==='finance'?C.accent:C.muted}}>💰 Финансы</div>
            )}
        </nav>
        <button onClick={handleLogout} style={{background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:10, borderRadius:8, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:35}}>
            <h2 style={{margin:0, fontSize:28, fontWeight:800}}>{tab === 'objects' ? 'Объекты' : tab === 'tasks' ? 'Задачи' : tab === 'team' ? 'Команда' : 'Финансы'}</h2>
            <div style={{display:'flex', gap:10}}>
                <button onClick={() => setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, cursor:'pointer', fontWeight:700}}>+ Объект</button>
                <button onClick={() => setShowModal('task')} style={{background:C.green, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, cursor:'pointer', fontWeight:700}}>+ Задача</button>
            </div>
        </div>

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20}}>
            {objects.map(o => (
              <div key={o.id} style={{background:C.card, padding:25, borderRadius:16, border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:800, fontSize:20, marginBottom:5}}>{o.name}</div>
                <div style={{color:C.muted, fontSize:14, marginBottom:15}}>📍 {o.address}</div>
                <div style={{fontSize:15}}>Бюджет: <b>{o.budget?.toLocaleString()} ₸</b></div>
                <div style={{marginTop:15, fontSize:13, color:C.accent, fontWeight:700}}>{o.stage} — {o.progress}%</div>
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
                const isOverdue = t.deadline && new Date(t.deadline) < new Date() && !t.done;
                return (
                  <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700, fontSize:16, marginBottom:4, color: t.done ? C.muted : C.text, textDecoration: t.done?'line-through':'none'}}>{t.text}</div>
                      <div style={{fontSize:13, color:C.muted}}>
                        🏗️ {objects.find(o=>o.id===t.object_id)?.name} | 👷 {profiles.find(p=>p.id===t.user_id)?.name || 'Не назначен'}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13, fontWeight:700, color: isOverdue ? C.red : C.muted}}>
                        📅 {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Без срока'}
                      </div>
                      <div style={{fontSize:11, color: t.done ? C.green : C.accent, marginTop:4}}>
                        {t.done ? 'ВЫПОЛНЕНО' : 'В РАБОТЕ'}
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}

        {tab === 'team' && (
            <div style={{display:'grid', gap:10}}>
                {profiles.map(p => (
                    <div key={p.id} style={{background:C.card, padding:15, borderRadius:12, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{fontWeight:600}}>{p.name || 'Без имени'}</span>
                        <span style={{fontSize:11, color:C.muted, background:C.bg, padding:'4px 10px', borderRadius:5}}>{p.role?.toUpperCase()}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Modal Object */}
      {showModal === 'object' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddObject} style={{background:C.card, padding:35, borderRadius:20, width:380, border:`1px solid ${C.border}`}}>
            <h3 style={{marginTop:0, marginBottom:20}}>Новый объект</h3>
            <label style={labelStyle}>Название проекта</label>
            <input name="name" placeholder="Напр: ЖК Аккент" required style={inputStyle} />
            <label style={labelStyle}>Адрес</label>
            <input name="address" placeholder="Город, улица..." required style={inputStyle} />
            <label style={labelStyle}>Общий бюджет (₸)</label>
            <input name="budget" type="number" placeholder="0" required style={inputStyle} />
            <button type="submit" style={{width:'100%', padding:14, background:C.accent, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer'}}>Создать проект</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none', cursor:'pointer'}}>Отмена</button>
          </form>
        </div>
      )}

      {/* Modal Task */}
      {showModal === 'task' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <form onSubmit={handleAddTask} style={{background:C.card, padding:35, borderRadius:20, width:380, border:`1px solid ${C.border}`}}>
            <h3 style={{marginTop:0, marginBottom:20}}>Назначить задачу</h3>
            <label style={labelStyle}>Объект</label>
            <select name="object_id" required style={inputStyle}>
                <option value="">Выберите из списка</option>
                {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <label style={labelStyle}>Что нужно сделать?</label>
            <input name="text" placeholder="Описание задачи..." required style={inputStyle} />
            <label style={labelStyle}>Исполнитель</label>
            <select name="user_id" required style={inputStyle}>
                <option value="">Выберите сотрудника</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
            </select>
            <label style={labelStyle}>Крайний срок (Дедлайн)</label>
            <input name="deadline" type="date" required style={inputStyle} />
            <button type="submit" style={{width:'100%', padding:14, background:C.green, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer'}}>Поставить задачу</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none', cursor:'pointer'}}>Отмена</button>
          </form>
        </div>
      )}
    </div>
  );
}
