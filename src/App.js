import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444',blue:'#3b82f6'};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [objects, setObjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [costs, setCosts] = useState([]);
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
    const { data: cst } = await supabase.from('costs').select('*').order('created_at', { ascending: false });
    const { data: allP } = await supabase.from('profiles').select('*');
    setObjects(o || []);
    setTasks(tsk || []);
    setCosts(cst || []);
    setProfiles(allP || []);
    setLoading(false);
  }

  const isAdmin = profile?.role === 'admin';

  async function handleAddCost(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('costs').insert([{
      object_id: fd.get('object_id'), title: fd.get('title'), amount: Number(fd.get('amount')), category: fd.get('category')
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  async function handleUpdateObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').update({
      name: fd.get('name'), address: fd.get('address'), budget_income: Number(fd.get('budget'))
    }).eq('id', editItem.id);
    if (error) alert(error.message); else { setEditItem(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'sans-serif'}}>Загрузка Abyroi CRM...</div>;

  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Onest, sans-serif'}}>
      {/* Sidebar */}
      <div style={{width:250, borderRight:`1px solid ${C.border}`, padding:25}}>
        <h2 style={{color:C.accent, marginBottom:30}}>Abyroi CRM</h2>
        <div onClick={() => setTab('dashboard')} style={{padding:12, cursor:'pointer', color: tab==='dashboard'?C.accent:C.muted}}>📊 Дашборд</div>
        <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.muted}}>🏗️ Объекты</div>
        <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.muted}}>✅ Задачи</div>
        {isAdmin && <div onClick={() => setTab('finance')} style={{padding:12, cursor:'pointer', color: tab==='finance'?C.accent:C.muted}}>💰 Финансы</div>}
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:40, background:'none', border:'none', color:C.red, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        {tab === 'dashboard' && <Dashboard isAdmin={isAdmin} objects={objects} tasks={tasks} costs={costs} C={C} />}
        
        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20}}>
            {objects.map(o => (
              <div key={o.id} onClick={() => isAdmin && setEditItem({type:'obj', ...o})} style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`, cursor:isAdmin?'pointer':'default'}}>
                <div style={{fontWeight:800, fontSize:18}}>{o.name} {isAdmin && '✏️'}</div>
                <div style={{fontSize:13, color:C.muted}}>{o.address}</div>
                {isAdmin && <div style={{marginTop:10, color:C.green, fontWeight:700}}>{o.budget_income?.toLocaleString()} ₸</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'finance' && <FinanceTable objects={objects} costs={costs} C={C} setShowModal={setShowModal} />}
      </div>

      {/* Модалки */}
      {showModal === 'cost' && <CostModal objects={objects} handleAddCost={handleAddCost} setShowModal={setShowModal} C={C} />}
      {editItem?.type === 'obj' && <EditObjectModal editItem={editItem} handleUpdateObject={handleUpdateObject} setEditItem={setEditItem} C={C} />}
    </div>
  );
}

// --- Мини-компоненты для порядка ---

function Dashboard({ isAdmin, objects, tasks, costs, C }) {
  const totalIncome = objects.reduce((a,b) => a + (Number(b.budget_income)||0), 0);
  const totalCosts = costs.reduce((a,b) => a + (Number(b.amount)||0), 0);
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, marginBottom:30}}>
        <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12, color:C.muted}}>ОБЪЕКТОВ</div>
          <div style={{fontSize:28, fontWeight:900}}>{objects.length}</div>
        </div>
        <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12, color:C.muted}}>ЗАДАЧ В РАБОТЕ</div>
          <div style={{fontSize:28, fontWeight:900, color:C.accent}}>{tasks.filter(t=>!t.done).length}</div>
        </div>
        {isAdmin && (
          <div style={{background:C.card, padding:20, borderRadius:15, border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12, color:C.muted}}>ПРИБЫЛЬ (ПРОГНОЗ)</div>
            <div style={{fontSize:28, fontWeight:900, color:C.green}}>{(totalIncome - totalCosts).toLocaleString()} ₸</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceTable({ objects, costs, C, setShowModal }) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
        <h3>Расходы и Материалы</h3>
        <button onClick={() => setShowModal('cost')} style={{background:C.blue, color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontWeight:700}}>+ Добавить расход</button>
      </div>
      <table style={{width:'100%', borderCollapse:'collapse', background:C.card, borderRadius:12, overflow:'hidden'}}>
        <thead style={{background:C.border, color:C.muted, fontSize:12}}>
          <tr><th style={{padding:15, textAlign:'left'}}>Объект</th><th style={{textAlign:'left'}}>Наименование</th><th style={{textAlign:'left'}}>Сумма</th></tr>
        </thead>
        <tbody>
          {costs.map(c => (
            <tr key={c.id} style={{borderBottom:`1px solid ${C.border}`}}>
              <td style={{padding:15}}>{objects.find(o=>o.id===c.object_id)?.name}</td>
              <td>{c.title} <span style={{fontSize:10, color:C.muted}}>({c.category})</span></td>
              <td style={{color:C.red, fontWeight:700}}>-{c.amount?.toLocaleString()} ₸</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CostModal({ objects, handleAddCost, setShowModal, C }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
      <form onSubmit={handleAddCost} style={{background:C.card, padding:30, borderRadius:20, width:350}}>
        <h3>Новый расход</h3>
        <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
          <option value="">Выберите объект</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input name="title" placeholder="Напр: Арматура 12мм" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
        <select name="category" style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
          <option value="материалы">Материалы</option>
          <option value="зарплата">Зарплата</option>
          <option value="логистика">Транспорт</option>
        </select>
        <input name="amount" type="number" placeholder="Сумма ₸" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:20}} />
        <button type="submit" style={{width:'100%', padding:12, background:C.blue, color:'#fff', border:'none', borderRadius:8}}>Записать</button>
        <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
      </form>
    </div>
  );
}

function EditObjectModal({ editItem, handleUpdateObject, setEditItem, C }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
      <form onSubmit={handleUpdateObject} style={{background:C.card, padding:30, borderRadius:20, width:350}}>
        <h3>Редактировать объект</h3>
        <input name="name" defaultValue={editItem.name} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
        <input name="address" defaultValue={editItem.address} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
        <input name="budget" type="number" defaultValue={editItem.budget_income} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:20}} />
        <button type="submit" style={{width:'100%', padding:12, background:C.accent, color:'#fff', border:'none', borderRadius:8}}>Сохранить</button>
        <button onClick={()=>setEditItem(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
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
      }} style={{ background: C.card, padding: 40, borderRadius: 20, width: 320, border: `1px solid ${C.border}` }}>
        <h2 style={{ color: '#fff', textAlign: 'center', margin: '0 0 20px 0' }}>Abyroi CRM</h2>
        <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 10 }} />
        <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 20 }} />
        <button type="submit" style={{ width: '100%', padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>Войти</button>
      </form>
    </div>
  );
}
