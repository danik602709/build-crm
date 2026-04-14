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

  // Обработчики форм
  async function handleAddObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').insert([{
      name: fd.get('name'), address: fd.get('address'), budget_income: Number(fd.get('budget'))
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('tasks').insert([{
      object_id: fd.get('object_id'), text: fd.get('text'), user_id: fd.get('user_id'), deadline: fd.get('deadline'), done: false
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  async function handleAddCost(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('costs').insert([{
      object_id: fd.get('object_id'), title: fd.get('title'), amount: Number(fd.get('amount')), category: fd.get('category')
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'sans-serif'}}>Загрузка...</div>;

  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Sidebar */}
      <div style={{width:240, borderRight:`1px solid ${C.border}`, padding:25, display:'flex', flexDirection:'column'}}>
        <h2 style={{color:C.accent, marginBottom:30}}>Abyroi CRM</h2>
        <nav style={{flex:1}}>
            <div onClick={() => setTab('dashboard')} style={{padding:12, cursor:'pointer', color: tab==='dashboard'?C.accent:C.muted}}>📊 Дашборд</div>
            <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.muted}}>🏗️ Объекты</div>
            <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.muted}}>✅ Задачи</div>
            {isAdmin && <div onClick={() => setTab('finance')} style={{padding:12, cursor:'pointer', color: tab==='finance'?C.accent:C.muted}}>💰 Финансы</div>}
        </nav>
        <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:`1px solid ${C.border}`, color:C.red, padding:10, borderRadius:8, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Main Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
            <h2 style={{margin:0}}>{tab==='dashboard'?'Дашборд':tab==='objects'?'Объекты':tab==='tasks'?'Задачи':'Финансы'}</h2>
            <div style={{display:'flex', gap:10}}>
                {isAdmin && tab === 'objects' && <button onClick={() => setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Объект</button>}
                {isAdmin && tab === 'tasks' && <button onClick={() => setShowModal('task')} style={{background:C.green, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Задача</button>}
                {isAdmin && tab === 'finance' && <button onClick={() => setShowModal('cost')} style={{background:C.blue, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Расход</button>}
            </div>
        </div>

        {tab === 'dashboard' && <DashboardStats objects={objects} tasks={tasks} costs={costs} isAdmin={isAdmin} C={C} />}

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

        {tab === 'tasks' && (
            <div style={{background:C.card, borderRadius:15, border:`1px solid ${C.border}`}}>
                {tasks.map(t => (
                    <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <div style={{fontWeight:700}}>{t.text}</div>
                            <div style={{fontSize:12, color:C.muted}}>
                                {objects.find(o=>o.id===t.object_id)?.name} | 👷 {profiles.find(p=>p.id===t.user_id)?.name}
                            </div>
                        </div>
                        <div style={{color:C.accent, fontWeight:700}}>📅 {t.deadline || 'Без срока'}</div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'finance' && (
            <table style={{width:'100%', borderCollapse:'collapse', background:C.card, borderRadius:12, overflow:'hidden'}}>
                <thead style={{background:C.border, color:C.muted}}>
                    <tr><th style={{padding:15, textAlign:'left'}}>Объект</th><th style={{textAlign:'left'}}>Статья</th><th style={{textAlign:'left'}}>Сумма</th></tr>
                </thead>
                <tbody>
                    {costs.map(c => (
                        <tr key={c.id} style={{borderBottom:`1px solid ${C.border}`}}>
                            <td style={{padding:15}}>{objects.find(o=>o.id===c.object_id)?.name}</td>
                            <td>{c.title} <small style={{color:C.muted}}>({c.category})</small></td>
                            <td style={{color:C.red, fontWeight:700}}>-{c.amount?.toLocaleString()} ₸</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* Модальные окна */}
      {showModal === 'object' && <ModalObject handleAddObject={handleAddObject} setShowModal={setShowModal} C={C} />}
      {showModal === 'task' && <ModalTask objects={objects} profiles={profiles} handleAddTask={handleAddTask} setShowModal={setShowModal} C={C} />}
      {showModal === 'cost' && <ModalCost objects={objects} handleAddCost={handleAddCost} setShowModal={setShowModal} C={C} />}
    </div>
  );
}

// --- Подчиненные компоненты ---

function DashboardStats({ objects, tasks, costs, isAdmin, C }) {
    const income = objects.reduce((a,b)=>a+(Number(b.budget_income)||0), 0);
    const expense = costs.reduce((a,b)=>a+(Number(b.amount)||0), 0);
    return (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20}}>
            <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted}}>Объектов</div>
                <div style={{fontSize:32, fontWeight:900}}>{objects.length}</div>
            </div>
            <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted}}>Задач в работе</div>
                <div style={{fontSize:32, fontWeight:900, color:C.accent}}>{tasks.filter(t=>!t.done).length}</div>
            </div>
            {isAdmin && (
                <div style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`}}>
                    <div style={{color:C.muted}}>Прибыль (прогноз)</div>
                    <div style={{fontSize:32, fontWeight:900, color:C.green}}>{(income-expense).toLocaleString()} ₸</div>
                </div>
            )}
        </div>
    );
}

function ModalObject({ handleAddObject, setShowModal, C }) {
    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <form onSubmit={handleAddObject} style={{background:C.card, padding:30, borderRadius:20, width:350}}>
                <h3>Новый объект</h3>
                <input name="name" placeholder="Название" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
                <input name="address" placeholder="Адрес" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
                <input name="budget" type="number" placeholder="Бюджет дохода ₸" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:20}} />
                <button type="submit" style={{width:'100%', padding:12, background:C.accent, color:'#fff', border:'none', borderRadius:8, fontWeight:700}}>Создать</button>
                <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
            </form>
        </div>
    );
}

function ModalTask({ objects, profiles, handleAddTask, setShowModal, C }) {
    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <form onSubmit={handleAddTask} style={{background:C.card, padding:30, borderRadius:20, width:350}}>
                <h3>Новая задача</h3>
                <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
                    <option value="">Выберите объект</option>
                    {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <input name="text" placeholder="Что сделать?" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
                <select name="user_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
                    <option value="">Выберите исполнителя</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input name="deadline" type="date" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:20}} />
                <button type="submit" style={{width:'100%', padding:12, background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:700}}>Поставить задачу</button>
                <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
            </form>
        </div>
    );
}

function ModalCost({ objects, handleAddCost, setShowModal, C }) {
    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <form onSubmit={handleAddCost} style={{background:C.card, padding:30, borderRadius:20, width:350}}>
                <h3>Записать расход</h3>
                <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
                    <option value="">Выберите объект</option>
                    {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <input name="title" placeholder="Наименование (напр: Бетон)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}} />
                <select name="category" style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:10}}>
                    <option value="материалы">Материалы</option>
                    <option value="зарплата">Зарплата</option>
                    <option value="логистика">Транспорт</option>
                </select>
                <input name="amount" type="number" placeholder="Сумма ₸" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', marginBottom:20}} />
                <button type="submit" style={{width:'100%', padding:12, background:C.blue, color:'#fff', border:'none', borderRadius:8, fontWeight:700}}>Записать</button>
                <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
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
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>Abyroi CRM</h2>
        <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 10 }} />
        <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', marginBottom: 20 }} />
        <button type="submit" style={{ width: '100%', padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>Войти</button>
      </form>
    </div>
  );
}
