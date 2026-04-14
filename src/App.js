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
    const { data: cst } = await supabase.from('costs').select('*');
    const { data: allP } = await supabase.from('profiles').select('*');
    setObjects(o || []);
    setTasks(tsk || []);
    setCosts(cst || []);
    setProfiles(allP || []);
    setLoading(false);
  }

  const isAdmin = profile?.role === 'admin';

  // Функции редактирования и удаления для Админа
  async function handleUpdateObject(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('objects').update({
      name: fd.get('name'), address: fd.get('address'), budget_income: Number(fd.get('budget'))
    }).eq('id', editItem.id);
    if (error) alert(error.message); else { setEditItem(null); fetchInitialData(session.user.id); }
  }

  async function handleAddCost(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('costs').insert([{
      object_id: fd.get('object_id'), title: fd.get('title'), amount: Number(fd.get('amount')), category: fd.get('category')
    }]);
    if (error) alert(error.message); else { setShowModal(null); fetchInitialData(session.user.id); }
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Abyroi CRM...</div>;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'sans-serif'}}>
      {/* Меню */}
      <div style={{width:240, borderRight:`1px solid ${C.border}`, padding:25}}>
        <h2 style={{color:C.accent}}>Abyroi CRM</h2>
        <div onClick={() => setTab('dashboard')} style={{padding:12, cursor:'pointer', color: tab==='dashboard'?C.accent:C.muted}}>📊 Дашборд</div>
        <div onClick={() => setTab('objects')} style={{padding:12, cursor:'pointer', color: tab==='objects'?C.accent:C.muted}}>🏗️ Объекты</div>
        <div onClick={() => setTab('tasks')} style={{padding:12, cursor:'pointer', color: tab==='tasks'?C.accent:C.muted}}>✅ Задачи</div>
        {isAdmin && <div onClick={() => setTab('finance')} style={{padding:12, cursor:'pointer', color: tab==='finance'?C.accent:C.muted}}>💰 Финансы</div>}
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:40, background:'none', color:C.red, border:'none', cursor:'pointer'}}>Выйти</button>
      </div>

      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
            <h2>{tab === 'finance' ? 'Финансы и Материалы' : 'Управление'}</h2>
            {isAdmin && <button onClick={() => setShowModal('cost')} style={{background:C.blue, border:'none', padding:'10px 20px', color:'#fff', borderRadius:8}}>+ Расход/Материал</button>}
        </div>

        {tab === 'objects' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {objects.map(o => (
              <div key={o.id} onClick={() => isAdmin && setEditItem({type:'obj', ...o})} style={{background:C.card, padding:25, borderRadius:16, border:`1px solid ${C.border}`, cursor:isAdmin?'pointer':'default'}}>
                <div style={{fontWeight:800, fontSize:18}}>{o.name} {isAdmin && '✏️'}</div>
                <div style={{color:C.muted, fontSize:13}}>{o.address}</div>
                <div style={{marginTop:15, fontSize:14, color:C.green}}>Доход: {o.budget_income?.toLocaleString()} ₸</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'finance' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:30}}>
                <div style={{background:C.card, padding:20, borderRadius:15, borderLeft:`4px solid ${C.green}`}}>
                    <div style={{fontSize:12, color:C.muted}}>ОБЩИЙ ДОХОД</div>
                    <div style={{fontSize:24, fontWeight:900}}>{objects.reduce((a,b)=>a+(b.budget_income||0),0).toLocaleString()} ₸</div>
                </div>
                <div style={{background:C.card, padding:20, borderRadius:15, borderLeft:`4px solid ${C.red}`}}>
                    <div style={{fontSize:12, color:C.muted}}>ОБЩИЙ РАСХОД (МАТЕРИАЛЫ/ЗП)</div>
                    <div style={{fontSize:24, fontWeight:900}}>{costs.reduce((a,b)=>a+(b.amount||0),0).toLocaleString()} ₸</div>
                </div>
            </div>
            <h3>История расходов</h3>
            <table style={{width:'100%', borderCollapse:'collapse', background:C.card, borderRadius:10}}>
                <thead><tr style={{textAlign:'left', color:C.muted}}><th style={{padding:15}}>Объект</th><th>Наименование</th><th>Категория</th><th>Сумма</th></tr></thead>
                <tbody>
                    {costs.map(c => (
                        <tr key={c.id} style={{borderTop:`1px solid ${C.border}`}}>
                            <td style={{padding:15}}>{objects.find(o=>o.id===c.object_id)?.name}</td>
                            <td>{c.title}</td>
                            <td><span style={{fontSize:10, background:C.bg, padding:'2px 8px', borderRadius:10}}>{c.category}</span></td>
                            <td style={{color:C.red}}>- {c.amount?.toLocaleString()} ₸</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}

        {/* Модалка добавления расхода */}
        {showModal === 'cost' && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <form onSubmit={handleAddCost} style={{background:C.card, padding:30, borderRadius:20, width:380}}>
              <h3>Добавить расход / Материалы</h3>
              <select name="object_id" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}}>
                  <option value="">Выберите объект</option>
                  {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <input name="title" placeholder="Название (например, Цемент М500)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}} />
              <select name="category" style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10}}>
                  <option value="материалы">Материалы</option>
                  <option value="зарплата">Зарплата</option>
                  <option value="логистика">Транспорт / Логистика</option>
                  <option value="прочее">Прочее</option>
              </select>
              <input name="amount" type="number" placeholder="Сумма (₸)" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:8, marginBottom:20}} />
              <button type="submit" style={{width:'100%', padding:14, background:C.blue, color:'#fff', border:'none', borderRadius:10, fontWeight:700}}>Записать расход</button>
              <button onClick={()=>setShowModal(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
            </form>
          </div>
        )}

        {/* Модалка редактирования объекта */}
        {editItem?.type === 'obj' && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
                <form onSubmit={handleUpdateObject} style={{background:C.card, padding:30, borderRadius:20, width:380}}>
                    <h3>Редактировать объект</h3>
                    <input name="name" defaultValue={editItem.name} style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, marginBottom:10}} />
                    <input name="address" defaultValue={editItem.address} style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, marginBottom:10}} />
                    <input name="budget" type="number" defaultValue={editItem.budget_income} style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, marginBottom:20}} />
                    <button type="submit" style={{width:'100%', padding:14, background:C.accent, color:'#fff', border:'none', borderRadius:10}}>Сохранить изменения</button>
                    <button onClick={()=>setEditItem(null)} type="button" style={{width:'100%', marginTop:10, background:'none', color:C.muted, border:'none'}}>Отмена</button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}
