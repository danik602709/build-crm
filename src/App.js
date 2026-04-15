import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {
  bg: '#0d1117', card: '#161c2d', border: '#2d3748', text: '#e2e8f0', muted: '#94a3b8',
  abyroi: '#3b82f6', crm: '#facc15', green: '#10b981', red: '#ef4444', orange: '#f59e0b'
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ projects: [], tasks: [], transactions: [], crews: [], materials: [] });
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });
  }, []);

  async function fetchAllData() {
    const [p, t, tr, cr, mt] = await Promise.all([
      supabase.from('objects').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('crews').select('*'),
      supabase.from('materials').select('*')
    ]);
    setData({
      projects: p.data || [],
      tasks: t.data || [],
      transactions: tr.data || [],
      crews: cr.data || [],
      materials: mt.data || []
    });
    setLoading(false);
  }

  if (loading) return <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:C.text}}>Загрузка ERP системы...</div>;
  if (!session) return <LoginForm C={C} />;

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Inter, sans-serif'}}>
      {/* SIDEBAR */}
      <aside style={{width:260, borderRight:`1px solid ${C.border}`, padding:25, background:'#090c12'}}>
        <div style={{fontSize:24, fontWeight:900, marginBottom:40}}><span style={{color:C.abyroi}}>ABYROI</span> <span style={{color:C.crm}}>CRM</span></div>
        <nav>
          <MenuBtn active={tab==='dashboard'} label="Дашборд" icon="📊" onClick={()=>setTab('dashboard')} />
          <MenuBtn active={tab==='projects'} label="Объекты" icon="🏗️" onClick={()=>setTab('projects')} />
          <MenuBtn active={tab==='finance'} label="Финансы" icon="💰" onClick={()=>setTab('finance')} />
          <MenuBtn active={tab==='crews'} label="Бригады" icon="👷" onClick={()=>setTab('crews')} />
        </nav>
      </aside>

      {/* MAIN */}
      <main style={{flex:1, padding:40, overflowY:'auto'}}>
        {selectedProject ? (
          <ProjectDetail 
            project={selectedProject} 
            data={data} 
            onBack={()=>setSelectedProject(null)} 
            C={C} 
          />
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard data={data} C={C} />}
            {tab === 'projects' && <ProjectList projects={data.projects} transactions={data.transactions} onSelect={setSelectedProject} C={C} />}
            {tab === 'finance' && <FinanceManager transactions={data.transactions} projects={data.projects} C={C} />}
            {tab === 'crews' && <CrewsManager crews={data.crews} C={C} />}
          </>
        )}
      </main>
    </div>
  );
}

// --- КОМПОНЕНТЫ СИСТЕМЫ ---

function Dashboard({ data, C }) {
  const totalIncome = data.transactions.filter(t=>t.type==='income').reduce((a,b)=>a+Number(b.amount),0);
  const totalExpense = data.transactions.filter(t=>t.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
  
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20, marginBottom:40}}>
        <StatCard title="ПРИХОД" val={totalIncome} color={C.green} />
        <StatCard title="РАСХОД" val={totalExpense} color={C.red} />
        <StatCard title="ПРИБЫЛЬ" val={totalIncome - totalExpense} color={C.abyroi} />
        <StatCard title="ОБЪЕКТЫ" val={data.projects.length} color={C.crm} />
      </div>
      
      <h3>Актуальные риски</h3>
      <div style={{display:'grid', gap:10}}>
        {data.projects.map(p => {
          const projectExp = data.transactions.filter(t=>t.project_id===p.id && t.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
          const isOverLimit = projectExp > p.planned_cost;
          if (!isOverLimit) return null;
          return (
            <div key={p.id} style={{padding:15, background:'rgba(239,68,68,0.1)', border:`1px solid ${C.red}`, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span>🔴 Перерасход на объекте: <b>{p.name}</b></span>
              <span>Лимит превышен на {(projectExp - p.planned_cost).toLocaleString()} ₸</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectList({ projects, transactions, onSelect, C }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
      {projects.map(p => {
        const projectExp = transactions.filter(t=>t.project_id===p.id && t.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
        const risk = projectExp > p.planned_cost;
        return (
          <div key={p.id} onClick={()=>onSelect(p)} style={{background:C.card, padding:25, borderRadius:20, border:`1px solid ${risk ? C.red : C.border}`, cursor:'pointer'}}>
            <div style={{fontWeight:800, fontSize:18}}>{p.name}</div>
            <div style={{fontSize:12, color:C.muted, marginBottom:15}}>{p.address}</div>
            <div style={{fontSize:14}}>Расходы: <b style={{color: risk ? C.red : C.green}}>{projectExp.toLocaleString()} ₸</b></div>
            <div style={{fontSize:12, color:C.muted}}>Лимит: {p.planned_cost?.toLocaleString()} ₸</div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectDetail({ project, data, onBack, C }) {
  const [subTab, setSubTab] = useState('overview');
  const projectTransactions = data.transactions.filter(t => t.project_id === project.id);
  const projectExp = projectTransactions.filter(t=>t.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
  const projectInc = projectTransactions.filter(t=>t.type==='income').reduce((a,b)=>a+Number(b.amount),0);

  return (
    <div>
      <button onClick={onBack} style={{background:'none', border:'none', color:C.muted, cursor:'pointer', marginBottom:20}}>← К списку объектов</button>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
        <h1>{project.name}</h1>
        <div style={{background: projectExp > project.planned_cost ? C.red : C.green, padding:'5px 15px', borderRadius:20, fontSize:12, fontWeight:700}}>
          {projectExp > project.planned_cost ? 'РИСК: ПЕРЕРАСХОД' : 'В НОРМЕ'}
        </div>
      </div>

      <div style={{display:'flex', gap:20, borderBottom:`1px solid ${C.border}`, marginBottom:30}}>
        {['overview', 'finance', 'materials', 'work'].map(t => (
          <div key={t} onClick={()=>setSubTab(t)} style={{padding:'10px 20px', cursor:'pointer', borderBottom: subTab===t ? `2px solid ${C.abyroi}` : 'none', color: subTab===t ? C.abyroi : C.muted}}>
            {t.toUpperCase()}
          </div>
        ))}
      </div>

      {subTab === 'overview' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30}}>
          <div style={{background:C.card, padding:25, borderRadius:20}}>
            <h3>Финансовый итог</h3>
            <p>Сумма договора: <b>{project.contract_sum?.toLocaleString()} ₸</b></p>
            <p>План себестоимости: <b>{project.planned_cost?.toLocaleString()} ₸</b></p>
            <p>Факт расходов: <b style={{color:C.red}}>{projectExp.toLocaleString()} ₸</b></p>
            <hr style={{borderColor:C.border}} />
            <p>Текущая прибыль: <b style={{fontSize:20, color:C.green}}>{(project.contract_sum - projectExp).toLocaleString()} ₸</b></p>
          </div>
        </div>
      )}
      
      {subTab === 'finance' && (
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead><tr style={{textAlign:'left', color:C.muted}}><th>Дата</th><th>Категория</th><th>Описание</th><th>Сумма</th></tr></thead>
          <tbody>
            {projectTransactions.map(t => (
              <tr key={t.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:12}}>{t.date}</td>
                <td>{t.category}</td>
                <td>{t.title}</td>
                <td style={{color: t.type==='income' ? C.green : C.red}}>{t.type==='income'?'+':'-'} {t.amount.toLocaleString()} ₸</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- UI КОРНЕВЫЕ ЭЛЕМЕНТЫ ---

function StatCard({ title, val, color }) {
  return (
    <div style={{background:C.card, padding:20, borderRadius:20, borderLeft:`5px solid ${color}`}}>
      <div style={{fontSize:12, color:C.muted, fontWeight:700}}>{title}</div>
      <div style={{fontSize:24, fontWeight:900}}>{val.toLocaleString()} ₸</div>
    </div>
  );
}

function MenuBtn({ active, label, icon, onClick }) {
  return (
    <div onClick={onClick} style={{padding:'12px 15px', cursor:'pointer', borderRadius:10, background: active ? 'rgba(59,130,246,0.1)' : 'transparent', color: active ? C.abyroi : C.muted, marginBottom:5}}>
      <span style={{marginRight:10}}>{icon}</span> {label}
    </div>
  );
}

function LoginForm({ C }) {
    return (
      <div style={{background:C.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
          if (error) alert("Ошибка входа");
        }} style={{background:C.card, padding:40, borderRadius:25, width:320, border:`1px solid ${C.border}`}}>
          <h2 style={{textAlign:'center'}}><span style={{color:C.abyroi}}>ABYROI</span> <span style={{color:C.crm}}>CRM</span></h2>
          <input name="email" type="email" placeholder="Email" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:10, marginBottom:10}} />
          <input name="password" type="password" placeholder="Пароль" required style={{width:'100%', padding:12, background:C.bg, color:'#fff', border:`1px solid ${C.border}`, borderRadius:10, marginBottom:20}} />
          <button type="submit" style={{width:'100%', padding:12, background:C.abyroi, color:'#fff', border:'none', borderRadius:10, fontWeight:700}}>Войти</button>
        </form>
      </div>
    );
}
