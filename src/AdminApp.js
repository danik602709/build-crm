import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {bg:'#0d1117',card:'#161c2a',border:'#1e2840',text:'#dde3f0',muted:'#5a6685',accent:'#f97316',green:'#22c55e',red:'#ef4444'};

export default function AdminApp() {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: objs } = await supabase.from('objects').select('*');
    const { data: trans } = await supabase.from('transactions').select('*');
    setObjects(objs || []);
    setTransactions(trans || []);
    setLoading(false);
  }

  const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.reload(); // Это заставит страницу обновиться и показать экран входа
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

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:C.bg,color:'#fff'}}>Загрузка системы...</div>;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Onest, sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      
      {/* Sidebar */}
      <div style={{width:260, borderRight:`1px solid ${C.border}`, padding:24, display:'flex', flexDirection:'column'}}>
        <div style={{fontSize:22, fontWeight:900, color:'#fff', marginBottom:32}}>Build<span style={{color:C.accent}}>CRM</span></div>
        
        <nav style={{flex:1}}>
          <NavItem id="dashboard" label="Дашборд" icon="📊" />
          <NavItem id="objects" label="Объекты" icon="🏗️" />
          <NavItem id="finance" label="Финансы" icon="💰" />
          <NavItem id="clients" label="Заказчики" icon="🤝" />
          <NavItem id="employees" label="Сотрудники" icon="👷" />
        </nav>

        <button onClick={handleLogout} style={{background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:10, borderRadius:8, cursor:'pointer', fontSize:13}}>Выйти</button>
      </div>

      {/* Main Content */}
      <div style={{flex:1, padding:40, overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:32}}>
          <h1 style={{fontSize:24, fontWeight:800, margin:0}}>
            {tab === 'dashboard' && "Общая сводка"}
            {tab === 'objects' && "Строительные объекты"}
            {tab === 'finance' && "Учёт финансов"}
            {tab === 'clients' && "База заказчиков"}
            {tab === 'employees' && "Команда"}
          </h1>
          <button onClick={loadData} style={{background:C.card, border:`1px solid ${C.border}`, color:C.text, padding:'8px 16px', borderRadius:8, cursor:'pointer'}}>Обновить данные</button>
        </div>

        {tab === 'dashboard' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20}}>
            <div style={{background:C.card, padding:24, borderRadius:16, border:`1px solid ${C.border}`}}>
              <div style={{color:C.muted, fontSize:12, marginBottom:8, textTransform:'uppercase'}}>Объектов в работе</div>
              <div style={{fontSize:32, fontWeight:900}}>{objects.length}</div>
            </div>
            {/* Здесь будут другие карточки */}
            <div style={{gridColumn:'1 / -1', marginTop:20, padding:40, textAlign:'center', background:'rgba(249,115,22,0.05)', borderRadius:16, border:`1px dashed ${C.accent}`}}>
              <div style={{fontSize:18, color:C.accent, fontWeight:700, marginBottom:8}}>Добро пожаловать в панель управления!</div>
              <div style={{color:C.muted}}>Перейдите в раздел "Объекты" или "Заказчики", чтобы внести первые данные.</div>
            </div>
          </div>
        )}

        {/* Заглушки для остальных вкладок, чтобы код не упал */}
        {tab !== 'dashboard' && (
          <div style={{padding:40, textAlign:'center', color:C.muted, border:`1px dashed ${C.border}`, borderRadius:16}}>
            Раздел {tab} в процессе наполнения данными. Нажмите "Обновить", если вы уже внесли данные в базу.
          </div>
        )}
      </div>
    </div>
  );
}
