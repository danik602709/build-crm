import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function AdminApp({ profile }) {
  const [tab, setTab] = useState('dashboard');
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
    const { data: tsk } = await supabase.from('tasks').select('*');
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
    if (error) {
      alert("Ошибка при создании объекта: " + error.message);
    } else {
      setShowModal(null);
      loadData();
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newTask = {
      object_id: fd.get('object_id'),
      text: fd.get('text'),
      user_id: fd.get('user_id'),
      done: false
    };

    const { error } = await supabase.from('tasks').insert([newTask]);
    if (error) {
      alert("Ошибка при создании задачи: " + error.message);
    } else {
      setShowModal(null);
      loadData();
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Загрузка...</div>;

  const inputStyle = { width: '100%', padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 15 };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Sidebar */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:25}}>
        <div style={{fontSize:22, fontWeight:800, color:C.accent, marginBottom:30}}>BuildCRM</div>
        <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.text}}>🏗️ Объекты</div>
        <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.text}}>✅ Задачи</div>
        <div onClick={() => setTab('team')} style={{padding:12, cursor:'pointer', color: tab==='team'?C.accent:C.text}}>👷 Команда</div>
        <button onClick={handleLogout} style={{marginTop:20, background:'none', border:'1px solid #333', color:'#888', padding:8, borderRadius:5, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Content */}
      <div style={{flex:1, padding:40}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
            <h2>{tab === 'objects' ? 'Объекты' : tab === 'tasks' ? 'Задачи' : 'Сотрудники'}</h2>
            <div>
                <button onClick={() => setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, cursor:'pointer', marginRight:10}}>+ Объект</button>
                <button onClick={() => setShowModal('task')} style={{background:C.green, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, cursor:'pointer'}}>+ Задача</button>
            </div>
        </div>

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            {objects.map(o => (
              <div key={o.id} style={{background:C.card, padding:20, borderRadius:12, border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700, fontSize:18}}>{o.name}</div>
                <div style={{color:C.muted, fontSize:14}}>{o.address}</div>
                <div style={{marginTop:10}}>Бюджет: {o.budget?.toLocaleString()} ₸</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{background:C.card, borderRadius:12, border:`1px solid ${C.border}`}}>
            {tasks.map(t => (
              <div key={t.id} style={{padding:15, borderBottom:`1px solid ${C.border}`}}>
                <div>{t.text}</div>
                <div style={{fontSize:12, color:C.muted}}>Исполнитель: {profiles.find(p=>p.id===t.user_id)?.name || 'Не назначен'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Object */}
      {showModal === 'object' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleAddObject} style={{background:C.card, padding:30, borderRadius:15, width:350}}>
            <h3>Новый объект</h3>
            <input name="name" placeholder="Название" required style={inputStyle} />
            <input name="address" placeholder="Адрес" required style={inputStyle} />
            <input name="budget" type="number" placeholder="Бюджет" required style={inputStyle} />
            <button type="submit" style={{width:'100%', padding:12, background:C.accent, color:'#fff', border:'none', borderRadius:8}}>Создать</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
          </form>
        </div>
      )}

      {/* Modal Task */}
      {showModal === 'task' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleAddTask} style={{background:C.card, padding:30, borderRadius:15, width:350}}>
            <h3>Назначить задачу</h3>
            <select name="object_id" required style={inputStyle}>
                <option value="">Выберите объект</option>
                {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input name="text" placeholder="Что сделать?" required style={inputStyle} />
            <select name="user_id" required style={inputStyle}>
                <option value="">Выберите сотрудника</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
            </select>
            <button type="submit" style={{width:'100%', padding:12, background:C.green, color:'#fff', border:'none', borderRadius:8}}>Назначить</button>
            <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
          </form>
        </div>
      )}
    </div>
  );
}
