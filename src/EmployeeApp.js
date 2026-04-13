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
      
      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>Build<span style={{color:C.accent}}>CRM</span></div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:13,color:C.muted}}>👷 {profile?.name}</span>
          <button onClick={handleLogout} style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 14px',color:C.muted,fontSize:12,cursor:'pointer'}}>Выйти</button>
        </div>
      </div>

      <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
        <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:20}}>Мои задачи</div>

        {/* Object tabs */}
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
            {/* Object info */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>{selObj.name}</div>
                  <div style={{fontSize:13,color:C.muted,marginTop:4}}>📍 {selObj.address} · Этап: {selObj.stage}</div>
                </div>
                <div style={{fontSize:13,color:C.muted}}>Прогресс: <span style={{color:C.accent,fontWeight:700}}>{selObj.progress}%</span></div>
              </div>
