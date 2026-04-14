import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0b0f19',card:'#161c2d',border:'#2d3748',text:'#e2e8f0',muted:'#94a3b8',accent:'#3b82f6',green:'#10b981',red:'#ef4444',orange:'#f59e0b'};

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

  // Обработка финансов
  async function handleAddFinance(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('finances').insert([{
      object_id: fd.get('object_id'), title: fd.get('title'), 
      amount: Number(fd.get('amount')), type: fd.get('type')
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

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Abyroi Pro...</div>;

  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Боковое меню в стиле UpService */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:25, display:'flex', flexDirection:'column'}}>
        <h2 style={{color:'#fff', marginBottom:40, fontSize:22}}>Abyroi <span style={{color:C.accent}}>Pro</span></h2>
        <nav style={{flex:1}}>
            <div onClick={() => setTab('dashboard')} style={{padding:'12px 15px', cursor:'pointer', borderRadius:10, background: tab==='dashboard'?'rgba(59,130,246,0.1)':'transparent', color: tab==='dashboard'?C.accent:C.muted, marginBottom:5}}>📊 Дашборд</div>
            <div onClick={() => setTab('objects')} style={{padding:'12px 15px', cursor:'pointer', borderRadius:10, background: tab==='objects'?'rgba(59,130,246,0.1)':'transparent', color: tab==='objects'?C.accent:C.muted, marginBottom:5}}>🏗️ Объекты</div>
            <div onClick={() => setTab('tasks')} style={{padding:'12px 15px', cursor:'pointer', borderRadius:10, background: tab==='tasks'?'rgba(59,130,246,0.1)':'transparent', color: tab==='tasks'?C.accent:C.muted, marginBottom:5}}>✅ Задачи</div>
            {isAdmin && <div onClick={() => setTab('finance')} style={{padding:'12px 15px', cursor:'pointer', borderRadius:10, background: tab==='finance'?'rgba(59,130,246,0.1)':'transparent', color: tab==='finance'?C.accent:C.muted}}>💰 Финансы</div>}
        </nav>
        <button onClick={() => supabase.auth.signOut()} style={{padding:12, background:'transparent', border:`1px solid ${C.border}`, color:C.red, borderRadius:10, cursor:'pointer'}}>Выйти</button>
      </div>

      {/* Основной экран */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:35}}>
            <h1 style={{fontSize:24, margin:0}}>{tab==='dashboard'?'Аналитика':tab==='objects'?'Мои объекты':tab==='tasks'?'Задачи и сроки':'Учет финансов'}</h1>
            {isAdmin && (
                <div style={{display:'flex', gap:10}}>
                    {tab==='objects' && <button onClick={()=>setShowModal('object')} style={{background:C.accent, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Объект</button>}
                    {tab==='tasks' && <button onClick={()=>setShowModal('task')} style={{background:C.green, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Задача</button>}
                    {tab==='finance' && <button onClick={()=>setShowModal('fin')} style={{background:C.orange, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8, fontWeight:700}}>+ Операция</button>}
                </div>
            )}
        </div>

        {tab === 'dashboard' && <DashboardStats objects={objects} finances={finances} tasks={tasks} isAdmin={isAdmin} C={C} />}

        {tab === 'objects' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:25}}>
                {objects.map(o => (
                    <div key={o.id} onClick={() => isAdmin && setEditItem({type:'obj', ...o})} style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${C.border}`, cursor:isAdmin?'pointer':'default', position:'relative'}}>
                        <div style={{fontWeight:800, fontSize:19, marginBottom:5}}>{o.name} {isAdmin && '✏️'}</div>
                        <div style={{color:C.muted, fontSize:14}}>📍 {o.address}</div>
                        <div style={{marginTop:20, display:'flex', justifyContent:'space-between'}}>
                            <span style={{fontSize:12, color:C.muted}}>Бюджет:</span>
                            <span style={{fontWeight:700, color:C.green}}>{o.budget_income?.toLocaleString()} ₸</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'tasks' && (
            <div style={{background:C.card, borderRadius:20, border:`1px solid ${C.border}`, overflow:'hidden'}}>
                {tasks.map(t => (
                    <div key={t.id} style={{padding:20, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <div style={{fontWeight:700}}>{t.text}</div>
                            <div style={{fontSize:12, color:C.muted}}>{objects.find(o=>o.id===t.object_id)?.name} | 👷 {profiles.find(p=>p.id===t.user_id)?.name}</div>
                        </div>
                        <div style={{color: new Date(t.deadline) < new Date() && !t.done ? C.red : C.accent, fontWeight:700}}>📅 {t.deadline}</div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'finance' && <FinanceView finances={finances} objects={objects} C={C} />}
      </div>

      {/* Модалки как в UpService */}
      {showModal === 'fin' && <ModalFinance objects={objects} handleAddFinance={handleAddFinance} setShowModal={setShowModal} C={C} />}
      {editItem?.type === 'obj' && <ModalEditObject editItem={editItem} handleUpdateObject={handleUpdateObject} setEditItem={setEditItem} C={C} />}
    </div>
  );
}

// Вспомогательные компоненты
function DashboardStats({ objects, finances, tasks, isAdmin, C }) {
    const totalInc = finances.filter(f=>f.type==='income').reduce((a,b)=>a+Number(b.amount),0);
    const totalExp = finances.filter(f=>f.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
    return (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:25}}>
            <div style={{background:C.card, padding:30, borderRadius:20, borderLeft:`5px solid ${C.accent}`}}>
                <div style={{color:C.muted, fontSize:13}}>ОБЪЕКТОВ</div>
                <div style={{fontSize:35, fontWeight:900}}>{objects.length}</div>
            </div>
            <div style={{background:C.card, padding:30, borderRadius:20, borderLeft:`5px solid ${C.orange}`}}>
                <div style={{color:C.muted, fontSize:13}}>ЗАДАЧ АКТИВНО</div>
                <div style={{fontSize:35, fontWeight:900}}>{tasks.filter(t=>!t.done).length}</div>
            </div>
            {isAdmin && (
                <div style={{background:C.card, padding:30, borderRadius:20, borderLeft:`5px solid ${C.green}`}}>
                    <div style={{color:C.muted, fontSize:13}}>ЧИСТАЯ ПРИБЫЛЬ</div>
                    <div style={{fontSize:30, fontWeight:900, color:C.green}}>{(totalInc - totalExp).toLocaleString()} ₸</div>
                </div>
            )}
        </div>
    );
}

function FinanceView({ finances, objects, C }) {
    return (
        <table style={{width:'100%', borderCollapse:'collapse', background:C.card, borderRadius:20, overflow:'hidden'}}>
            <thead style={{background:'#1c2539', color:C.muted, fontSize:12}}>
                <tr><th style={{padding:20, textAlign:'left'}}>ОБЪЕКТ</th><th>ОПЕРАЦИЯ</th><th>ТИП</th><th>СУММА</th></tr>
            </thead>
            <tbody>
                {finances.map(f => (
                    <tr key={f.id} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:20}}>{objects.find(o=>o.id===f.object_id)?.name}</td>
                        <td>{f.title}</td>
                        <td><span style={{fontSize:10, padding:'3px 10px', borderRadius:20, background: f.type==='income'?C.green:C.red, color:'#fff'}}>{f.type==='income'?'ДОХОД':'РАСХОД'}</span></td>
                        <td style={{fontWeight:700, color: f.type==='income'?C.green:C.red}}>{f.type==='income'?'+':'-'} {f.amount?.toLocaleString()} ₸</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function ModalFinance({ objects, handleAddFinance, setShowModal, C }) {
    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
            <form onSubmit={handleAddFinance} style={{background:C.card, padding:35, borderRadius:25, width:400, border:`1px solid ${C.border}`}}>
                <h3 style={{marginTop:0}}>Новая фин. операция</h3>
                <select name="type" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:10}}>
                    <option value="expense">Расход (Материалы/ЗП)</option>
                    <option value="income">Доход (Оплата от клиента)</option>
                </select>
                <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:10}}>
                    <option value="">Выберите объект</option>
                    {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <input name="title" placeholder="Описание (напр: Закуп арматуры)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:10}} />
                <input name="amount" type="number" placeholder="Сумма ₸" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:25}} />
                <button type="submit" style={{width:'100%', padding:14, background:C.accent, color:'#fff', border:'none', borderRadius:12, fontWeight:700}}>Записать в историю</button>
                <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:12, background:'none', color:C.muted, border:'none', cursor:'pointer'}}>Отмена</button>
            </form>
        </div>
    );
}

function ModalEditObject({ editItem, handleUpdateObject, setEditItem, C }) {
    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
            <form onSubmit={handleUpdateObject} style={{background:C.card, padding:35, borderRadius:25, width:400}}>
                <h3>Редактировать объект</h3>
                <input name="name" defaultValue={editItem.name} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:10}} />
                <input name="address" defaultValue={editItem.address} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:10}} />
                <input name="budget" type="number" defaultValue={editItem.budget_income} required style={{width:'100%', padding:12, background:C.bg, color:'#fff', borderRadius:10, marginBottom:25}} />
                <button type="submit" style={{width:'100%', padding:14, background:C.accent, color:'#fff', borderRadius:12}}>Сохранить изменения</button>
                <button onClick={()=>setEditItem(null)} type="button" style={{width:'100%', marginTop:12, background:'none', color:C.muted, border:'none'}}>Отмена</button>
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
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: 30 }}>Abyroi CRM <span style={{color:C.accent}}>Pro</span></h2>
        <input name="email" type="email" placeholder="Email" required style={{ width: '100%', padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, color: '#fff', marginBottom: 15 }} />
        <input name="password" type="password" placeholder="Пароль" required style={{ width: '100%', padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, color: '#fff', marginBottom: 25 }} />
        <button type="submit" style={{ width: '100%', padding: 15, background: C.accent, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700 }}>Войти в систему</button>
      </form>
    </div>
  );
}
