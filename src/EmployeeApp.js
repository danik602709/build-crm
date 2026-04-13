import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const STAGES = ["Проектирование","Разрешения","Фундамент","Каркас","Кровля","Инженерия","Отделка","Сдача"];
const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e'};

export default function EmployeeApp({ profile }) {
  const [objects, setObjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selObj, setSelObj] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: objs } = await supabase.from('objects').select('*');
    const { data: tsks } = await supabase.from('tasks').select('*');
    setObjects(objs || []);
    setTasks(tsks || []);
    if (objs?.length) setSelObj(objs[0]);
    setLoading(false);
  }

  async function toggleTask(task) {
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done })
      .eq('id', task.id);
    if (!error) setTasks(p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:C.bg,color:'#fff',fontFamily:'Onest,sans-serif'}}>Загрузка...</div>;
  
  const objTasks = tasks.filter(t => t.object_id === selObj?.id);

  return (
    <div style={{fontFamily:'Onest,sans-serif',background:C.bg,minHeight:'100vh',color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>Build<span style={{color:C.accent}}>CRM</span></div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:13,color:C.muted}}>👷 {profile?.name}</span>
          <button onClick={handleLogout} style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 14px',color:C.muted,fontSize:12,cursor:'pointer'}}>Выйти</button>
        </div>
      </div>

      <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
        <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:20}}>Мои задачи</div>
        
        <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          {objects.map(o => (
            <button key={o.id} 
              style={{padding:'8px 16px',borderRadius:20,border:`1px solid ${selObj?.id===o.id?C.accent:C.border}`,background:selObj?.id===o.id?'rgba(249,115,22,0.12)':'transparent',color:selObj?.id===o.id?C.accent:C.muted,fontSize:13,fontWeight:selObj?.id===o.id?700:400,cursor:'pointer'}}
              onClick={() => setSelObj(o)}>
              {o.name}
            </button>
          ))}
        </div>

        {selObj && (
          <>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>{selObj.name}</div>
                  <div style={{fontSize:13,color:C.muted,marginTop:4}}>📍 {selObj.address} · Этап: {selObj.stage}</div>
                </div>
                <div style={{fontSize:13,color:C.muted}}>Прогресс: <span style={{color:C.accent,fontWeight:700}}>{selObj.progress}%</span></div>
              </div>
              <div style={{height:6,borderRadius:3,background:C.border,overflow:'hidden',marginTop:12}}>
                <div style={{height:'100%',width:`${selObj.progress}%`,background:C.accent,borderRadius:3}}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {STAGES.map(stage => {
                const list = objTasks.filter(t => t.stage === stage);
                if (!list.length) return null;
                const done = list.filter(t => t.done).length;
                const isCurrent = selObj.stage === stage;
                return (
                  <div key={stage} style={{background:isCurrent?'rgba(249,115,22,0.06)':C.bg,border:`1px solid ${isCurrent?C.accent:C.border}`,borderRadius:10,padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:isCurrent?C.accent:C.muted}}>{stage}</span>
                      <span style={{fontSize:11,color:C.muted}}>{done}/{list.length}</span>
                    </div>
                    {list.map(task => (
                      <div key={task.id} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8,cursor:'pointer'}} onClick={() => toggleTask(task)}>
                        <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${task.done?C.green:C.border}`,background:task.done?'rgba(34,197,94,0.2)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                          {task.done && <span style={{color:C.green,fontSize:10,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:12.5,color:task.done?C.muted:C.text,textDecoration:task.done?'line-through':'none'}}>{task.text}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
