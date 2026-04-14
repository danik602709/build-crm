import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Цвета по вашему запросу и палитра системы
const C = {
  bg:'#0d1117', 
  card:'#161c2d', 
  border:'#2d3748', 
  text:'#e2e8f0', 
  muted:'#94a3b8', 
  abyroi:'#3b82f6', // Синий
  crm:'#facc15',   // Желтый
  green:'#10b981', 
  red:'#ef4444'
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [objects, setObjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [finances, setFinances] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [editItem, setEditItem] = useState(null);

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
    const { data: fin } = await supabase.from('finances').select('*').order('created_at', { ascending: false });
    const { data: allP } = await supabase.from('profiles').select('*');
    setObjects(o || []);
    setTasks(tsk || []);
    setFinances(fin || []);
    setProfiles(allP || []);
    setLoading(false);
  }

  const isAdmin = profile?.role === 'admin';

  // Функции обновления (Редактирование)
  async function handleUpdateObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').update({
      name: fd.get('name'), 
      address: fd.get('address'), 
      budget_income: Number(fd.get('budget'))
    }).eq('id', editItem.id);
    if (error) alert(error.message); else { setEditItem(null); fetchInitialData(session.user.id); }
  }

  async function handleUpdateTaskStatus(id, newStatus) {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (!error) fetchInitialData(session.user.id);
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Загрузка системы...</div>;
  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Inter, sans-serif'}}>
      
      {/* Sidebar */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:25, display:'flex', flexDirection:'column', background:'#090c12'}}>
        <div style={{fontSize:24, fontWeight:900, marginBottom:40, letterSpacing:'-1px'}}>
          <span style={{color:C.abyroi}}>ABYROI</span> <span style={{color:C.crm}}>CRM</span>
        </div>
        
        <nav style={{flex:1}}>
          <NavItem active={tab==='dashboard'} label="Аналитика" icon="📊" onClick={()=>setTab('dashboard')} />
          <NavItem active={tab==='objects'} label="Объекты" icon="🏗️" onClick={()=>setTab('objects')} />
          <NavItem active={tab==='tasks'} label="Задачи" icon="✅" onClick={()=>setTab('tasks')} />
          {isAdmin && <NavItem active={tab==='finance'} label="Финансы" icon="💰" onClick={()=>setTab('finance')} />}
        </nav>

        <button onClick={() => supabase.auth.signOut()} style={{padding:12, background:'transparent', border:`1px solid ${C.border}`, color:C.red, borderRadius:10, cursor:'pointer', fontWeight:600}}>Выход</button>
      </div>

      {/* Main Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
          <h1 style={{margin:0, fontSize:28}}>{tab==='dashboard'?'Обзор бизнеса':tab==='objects'?'Управление объектами':tab==='tasks'?'Контроль задач':'Финансовый поток'}</h1>
          {isAdmin && (
            <div style={{display:'flex', gap:10}}>
              {tab==='objects' && <button onClick={()=>setShowModal('obj')} style={btnStyle(C.abyroi)}>+ Добавить объект</button>}
              {tab==='tasks' && <button onClick={()=>setShowModal('task')} style={btnStyle(C.green)}>+ Новая задача</button>}
              {tab==='finance' && <button onClick={()=>setShowModal('fin')} style={btnStyle(C.crm, '#000')}>+ Операция</button>}
            </div>
          )}
        </header>

        {/* Динамические вкладки */}
        {tab === 'dashboard' && <DashboardView objects={objects} finances={finances} tasks={tasks} isAdmin={isAdmin} C={C} />}
        
        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20}}>
            {objects.map(o => (
              <ObjectCard key={o.id} obj={o} isAdmin={isAdmin} onEdit={()=>setEditItem({type:'obj', ...o})} C={C} />
            ))}
          </div>
        )}

        {tab === 'tasks' && <TasksList tasks={tasks} objects={objects} profiles={profiles} onStatusChange={handleUpdateTaskStatus} C={C} />}
        
        {tab === 'finance' && <FinanceTable finances={finances} objects={objects} C={C} />}
      </div>

      {/* Modals */}
      {editItem?.type === 'obj' && <ModalEditObject item={editItem} onSave={handleUpdateObject} onClose={()=>setEditItem(null)} C={C} />}
      {/* Тут можно добавить остальные модалки добавления */}
    </div>
  );
}

// Вспомогательные компоненты для структуры
function NavItem({ active, label, icon, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding:'14px 18px', cursor:'pointer', borderRadius:12, marginBottom:8,
      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
      color: active ? '#fff' : '#94a3b8',
      fontWeight: active ? 700 : 500,
      transition: '0.2s'
    }}>
      <span style={{marginRight:12}}>{icon}</span> {label}
    </div>
  );
}

function ObjectCard({ obj, isAdmin, onEdit, C }) {
  return (
    <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`, position:'relative'}}>
      <div style={{fontSize:20, fontWeight:800, marginBottom:8}}>{obj.name}</div>
      <div style={{color:C.muted, fontSize:14, marginBottom:20}}>📍 {obj.address}</div>
      <div style={{display:'flex', justifyContent:'space-between', borderTop:`1px solid ${C.border}`, paddingTop:15}}>
        <span style={{color:C.muted, fontSize:12}}>Бюджет:</span>
        <span style={{fontWeight:700, color:C.green}}>{obj.budget_income?.toLocaleString()} ₸</span>
      </div>
      {isAdmin && <button onClick={onEdit} style={{marginTop:15, width:'100%', background:'transparent', border:`1px solid ${C.border}`, color:C.abyroi, padding:8, borderRadius:8, cursor:'pointer'}}>Редактировать</button>}
    </div>
  );
}

function TasksList({ tasks, objects, profiles, onStatusChange, C }) {
  return (
    <div style={{background:C.card, borderRadius:20, border:`1px solid ${C.border}`, overflow:'hidden'}}>
      {tasks.map(t => (
        <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700, fontSize:16}}>{t.text}</div>
            <div style={{fontSize:12, color:C.muted, marginTop:4}}>
              🏗️ {objects.find(o=>o.id===t.object_id)?.name} | 👷 {profiles.find(p=>p.id===t.user_id)?.name}
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:15}}>
             <select 
              value={t.status || 'новое'} 
              onChange={(e) => onStatusChange(t.id, e.target.value)}
              style={{background:C.bg, color:'#fff', border:`1px solid ${C.border}`, padding:5, borderRadius:6}}
             >
                <option value="новое">Новое</option>
                <option value="в работе">В работе</option>
                <option value="завершено">Завершено</option>
             </select>
             <div style={{color:C.crm, fontWeight:700, minWidth:100}}>📅 {t.deadline}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardView({ objects, finances, tasks, isAdmin, C }) {
  const inc = finances.filter(f=>f.type==='income').reduce((a,b)=>a+Number(b.amount),0);
  const exp = finances.filter(f=>f.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:25}}>
      <StatCard title="ОБЪЕКТЫ" val={objects.length} color={C.abyroi} C={C} />
      <StatCard title="ЗАДАЧИ" val={tasks.filter(t=>t.status!=='завершено').length} color={C.crm} C={C} />
      {isAdmin && <StatCard title="ПРИБЫЛЬ" val={`${(inc-exp).toLocaleString()} ₸`} color={C.green} C={C} />}
    </div>
  );
}

function StatCard({ title, val, color, C }) {
  return (
    <div style={{background:C.card, padding:30, borderRadius:24, border:`1px solid ${C.border}`, borderTop:`4px solid ${color}`}}>
      <div style={{color:C.muted, fontSize:12, fontWeight:800, marginBottom:10}}>{title}</div>
      <div style={{fontSize:32, fontWeight:900}}>{val}</div>
    </div>
  );
}

function FinanceTable({ finances, objects, C }) {
  return (
    <table style={{width:'100%', borderCollapse:'collapse', background:C.card, borderRadius:20, overflow:'hidden'}}>
      <thead style={{background:'#1a202e', color:C.muted}}>
        <tr><th style={{padding:20, textAlign:'left'}}>ОБЪЕКТ</th><th style={{textAlign:'left'}}>ОПЕРАЦИЯ</th><th style={{textAlign:'left'}}>СУММА</th></tr>
      </thead>
      <tbody>
        {finances.map(f => (
          <tr key={f.id} style={{borderBottom:`1px solid ${C.border}`}}>
            <td style={{padding:20}}>{objects.find(o=>o.id===f.object_id)?.name}</td>
            <td>{f.title}</td>
            <td style={{fontWeight:800, color: f.type==='income'?C.green:C.red}}>
              {f.type==='income'?'+':'-'} {f.amount?.toLocaleString()} ₸
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ModalEditObject({ item, onSave, onClose, C }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
      <form onSubmit={onSave} style={{background:C.card, padding:35, borderRadius:25, width:400}}>
        <h3 style={{marginTop:0}}>Редактировать данные</h3>
        <input name="name" defaultValue={item.name} placeholder="Название" required style={inputStyle(C)} />
        <input name="address" defaultValue={item.address} placeholder="Адрес" required style={inputStyle(C)} />
        <input name="budget" type="number" defaultValue={item.budget_income} placeholder="Бюджет" required style={inputStyle(C)} />
        <button type="submit" style={{width:'100%', padding:14, background:C.abyroi, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer'}}>Сохранить изменения</button>
        <button onClick={onClose} type="button" style={{width:'100%', marginTop:12, background:'none', color:C.muted, border:'none', cursor:'pointer'}}>Отмена</button>
      </form>
    </div>
  );
}

function LoginForm({ C }) {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
          if (error) alert("Ошибка входа");
      }} style={{ background: C.card, padding: 45, borderRadius: 30, width: 340, border: `1px solid ${C.border}` }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}><span style={{color:C.abyroi}}>ABYROI</span> <span style={{color:C.crm}}>CRM</span></h2>
        <input name="email" type="email" placeholder="Email" required style={inputStyle(C)} />
        <input name="password" type="password" placeholder="Пароль" required style={inputStyle(C)} />
        <button type="submit" style={{ width: '100%', padding: 15, background: C.abyroi, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor:'pointer' }}>Войти</button>
      </form>
    </div>
  );
}

// Styles
const btnStyle = (bg, col='#fff') => ({ background:bg, border:'none', padding:'10px 20px', color:col, borderRadius:10, fontWeight:700, cursor:'pointer' });
const inputStyle = (C) => ({ width: '100%', padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, color: '#fff', marginBottom: 15, boxSizing:'border-box' });
