import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';

const STAGES = ["Проектирование","Разрешения","Фундамент","Каркас","Кровля","Инженерия","Отделка","Сдача"];
const EXP_CATEGORIES = ["Материалы","Подрядчики","Сотрудники","Аренда техники","Транспорт","Прочее"];
const INC_CATEGORIES = ["Аванс заказчика","Этапный платёж","Финальный платёж","Доп. работы"];
const STAGE_TASKS = {
  "Проектирование":["Разработка архитектурного проекта","Согласование с заказчиком","Инженерные изыскания"],
  "Разрешения":["Получение разрешения на строительство","Согласование с администрацией","Пожарная экспертиза"],
  "Фундамент":["Разметка и земляные работы","Опалубка","Заливка бетона","Гидроизоляция"],
  "Каркас":["Монтаж колонн","Сборка перекрытий","Кладка стен"],
  "Кровля":["Монтаж стропильной системы","Укладка кровельного материала","Водосток"],
  "Инженерия":["Электромонтаж","Сантехника","Вентиляция","Слаботочные системы"],
  "Отделка":["Штукатурка стен","Стяжка полов","Покраска","Установка окон и дверей"],
  "Сдача":["Технический осмотр","Подписание актов","Передача документов заказчику"],
};

const fmt = n => new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(n);
const STC={active:"#22c55e",done:"#3b82f6",paused:"#f59e0b"};
const STL={active:"Активный",done:"Завершён",paused:"Приостановлен"};
const C={bg:"#0d1117",card:"#161c2a",border:"#1e2840",text:"#dde3f0",muted:"#5a6685",accent:"#f97316",green:"#22c55e",red:"#ef4444",blue:"#3b82f6"};

const inp={background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13.5,width:"100%",outline:"none",boxSizing:"border-box"};
const lbl={fontSize:11,color:C.muted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.5px"};
const ghost={background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer"};
const pill=a=>({padding:"6px 14px",borderRadius:20,border:`1px solid ${a?C.accent:C.border}`,background:a?"rgba(249,115,22,0.12)":"transparent",color:a?C.accent:C.muted,fontSize:12.5,fontWeight:a?700:400,cursor:"pointer"});
const badge=color=>({background:color+"20",color,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700});
const statCard={background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",flex:1,minWidth:140};
const prog={height:6,borderRadius:3,background:C.border,overflow:"hidden"};
const pfill=(p,color=C.accent)=>({height:"100%",width:`${Math.min(p,100)}%`,background:color,borderRadius:3});
const row2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
const modalBg={position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
const mbox={background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:32,width:520,maxWidth:"92vw",maxHeight:"90vh",overflowY:"auto"};
const thS={padding:"8px 12px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"};
const tdS=(color)=>({padding:"11px 12px",color:color||C.text});
const trS={borderBottom:`1px solid ${C.border}`};

export default function AdminApp({ profile }) {
  const [tab, setTab] = useState("dashboard");
  const [objects, setObjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal2, setModal2] = useState(null);
  const [selObj, setSelObj] = useState(null);
  const [txFilter, setTxFilter] = useState("all");
  const [reportObj, setReportObj] = useState(null);

  const emptyObj={name:"",address:"",clientId:"",budget:"",startDate:"",endDate:"",stage:STAGES[0],status:"active"};
  const emptyTx={objectId:"",type:"expense",category:EXP_CATEGORIES[0],amount:"",date:"",note:""};
  const emptyEmp={name:"",role:"",phone:"",salary:""};
  const emptyCli={name:"",contact:"",phone:"",email:""};
  const emptyCtr={name:"",phone:"",specialty:""};

  const [fObj,setFObj]=useState(emptyObj);
  const [fTx,setFTx]=useState(emptyTx);
  const [fEmp,setFEmp]=useState(emptyEmp);
  const [fCli,setFCli]=useState(emptyCli);
  const [fCtr,setFCtr]=useState(emptyCtr);
  const [newEmpEmail,setNewEmpEmail]=useState("");
  const [newEmpPassword,setNewEmpPassword]=useState("");

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll() {
    const [o,t,co,e,cl,tk] = await Promise.all([
      supabase.from('objects').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('contractors').select('*'),
      supabase.from('employees').select('*, employee_objects(object_id)'),
      supabase.from('clients').select('*'),
      supabase.from('tasks').select('*'),
    ]);
    setObjects(o.data||[]);
    setTransactions(t.data||[]);
    setContractors(co.data||[]);
    setEmployees((e.data||[]).map(emp=>({...emp,objectIds:(emp.employee_objects||[]).map(x=>x.object_id)})));
    setClients(cl.data||[]);
    setTasks(tk.data||[]);
    setLoading(false);
  }

  const objStats=id=>{
    const inc=transactions.filter(t=>t.object_id===id&&t.type==="income").reduce((s,t)=>s+t.amount,0);
    const exp=transactions.filter(t=>t.object_id===id&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
    return{inc,exp,profit:inc-exp};
  };
  const total=useMemo(()=>{
    const inc=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const exp=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    return{inc,exp,profit:inc-exp};
  },[transactions]);

  async function toggleTask(task) {
    await supabase.from('tasks').update({done:!task.done}).eq('id',task.id);
    setTasks(p=>p.map(t=>t.id===task.id?{...t,done:!t.done}:t));
  }
  async function addTask(objId,stage,text) {
    if(!text.trim())return;
    const {data}=await supabase.from('tasks').insert({object_id:objId,stage,text,done:false}).select().single();
    if(data) setTasks(p=>[...p,data]);
  }

  async function submitObj() {
    if(!fObj.name)return;
    const {data}=await supabase.from('objects').insert({
      name:fObj.name,address:fObj.address,client_id:fObj.clientId||null,
      budget:parseFloat(fObj.budget)||0,start_date:fObj.startDate||null,
      end_date:fObj.endDate||null,stage:fObj.stage,status:fObj.status,progress:0
    }).select().single();
    if(data){
      setObjects(p=>[...p,data]);
      const stageTasks=STAGES.flatMap(st=>(STAGE_TASKS[st]||[]).map(text=>({object_id:data.id,stage:st,text,done:false})));
      const {data:newTasks}=await supabase.from('tasks').insert(stageTasks).select();
      if(newTasks) setTasks(p=>[...p,...newTasks]);
    }
    setModal2(null);setFObj(emptyObj);
  }

  async function submitTx() {
    if(!fTx.amount||!fTx.date||!fTx.objectId)return;
    const {data}=await supabase.from('transactions').insert({
      object_id:parseInt(fTx.objectId),type:fTx.type,category:fTx.category,
      amount:parseFloat(fTx.amount),date:fTx.date,note:fTx.note
    }).select().single();
    if(data) setTransactions(p=>[...p,data]);
    setModal2(null);setFTx(emptyTx);
  }

  async function submitEmp() {
    if(!fEmp.name||!newEmpEmail||!newEmpPassword)return;
    const {data:authData,error}=await supabase.auth.admin.createUser({
      email:newEmpEmail,password:newEmpPassword,email_confirm:true
    });
    if(error){alert("Ошибка создания пользователя: "+error.message);return;}
    const userId=authData.user.id;
    await supabase.from('profiles').insert({id:userId,name:fEmp.name,role:'employee'});
    const {data}=await supabase.from('employees').insert({
      name:fEmp.name,role:fEmp.role,phone:fEmp.phone,
      salary:parseFloat(fEmp.salary)||0,user_id:userId
    }).select().single();
    if(data) setEmployees(p=>[...p,{...data,objectIds:[]}]);
    setModal2(null);setFEmp(emptyEmp);setNewEmpEmail("");setNewEmpPassword("");
  }

  async function submitCli() {
    if(!fCli.name)return;
    const {data}=await supabase.from('clients').insert(fCli).select().single();
    if(data) setClients(p=>[...p,data]);
    setModal2(null);setFCli(emptyCli);
  }

  async function submitCtr() {
    if(!fCtr.name)return;
    const {data}=await supabase.from('contractors').insert(fCtr).select().single();
    if(data) setContractors(p=>[...p,data]);
    setModal2(null);setFCtr(emptyCtr);
  }

  async function deleteTx(id) {
    await supabase.from('transactions').delete().eq('id',id);
    setTransactions(p=>p.filter(t=>t.id!==id));
  }

  async function updateObject(id,updates) {
    await supabase.from('objects').update(updates).eq('id',id);
    setObjects(p=>p.map(o=>o.id===id?{...o,...updates}:o));
  }

  async function toggleEmpObject(emp,objId) {
    if(emp.objectIds.includes(objId)){
      await supabase.from('employee_objects').delete().eq('employee_id',emp.id).eq('object_id',objId);
      setEmployees(p=>p.map(e=>e.id===emp.id?{...e,objectIds:e.objectIds.filter(x=>x!==objId)}:e));
    } else {
      await supabase.from('employee_objects').insert({employee_id:emp.id,object_id:objId});
      setEmployees(p=>p.map(e=>e.id===emp.id?{...e,objectIds:[...e.objectIds,objId]}:e));
    }
  }

  async function deleteEmployee(id) {
    await supabase.from('employees').delete().eq('id',id);
    setEmployees(p=>p.filter(e=>e.id!==id));
  }

  async function deleteContractor(id) {
    await supabase.from('contractors').delete().eq('id',id);
    setContractors(p=>p.filter(c=>c.id!==id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const filteredTx=useMemo(()=>{
    let list=selObj?transactions.filter(t=>t.object_id===selObj.id):transactions;
    if(txFilter==="income")list=list.filter(t=>t.type==="income");
    if(txFilter==="expense")list=list.filter(t=>t.type==="expense");
    return list.sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[transactions,selObj,txFilter]);

  const NAV=[
    {id:"dashboard",icon:"◈",label:"Дашборд"},
    {id:"objects",icon:"🏗",label:"Объекты"},
    {id:"clients",icon:"🤝",label:"Заказчики"},
    {id:"finance",icon:"₽",label:"Финансы"},
    {id:"tasks",icon:"☑",label:"Задачи"},
    {id:"employees",icon:"👷",label:"Сотрудники"},
    {id:"contractors",icon:"🔧",label:"Подрядчики"},
    {id:"reports",icon:"📊",label:"Отчёты"},
  ];

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,color:"#fff",fontFamily:"Onest,sans-serif"}}>Загрузка...</div>;

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{fontFamily:"'Onest',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex"}}>

        {/* SIDEBAR */}
        <div style={{width:230,background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"0 0 24px",position:"fixed",top:0,left:0,bottom:0,zIndex:200,overflowY:"auto"}}>
          <div style={{padding:"24px 24px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Build<span style={{color:C.accent}}>CRM</span></div>
            <div style={{fontSize:10,color:C.muted,marginTop:2,textTransform:"uppercase",letterSpacing:"1.5px"}}>Строительный учёт</div>
          </div>
          {NAV.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 24px",cursor:"pointer",borderLeft:`3px solid ${tab===n.id?C.accent:"transparent"}`,background:tab===n.id?"rgba(249,115,22,0.08)":"transparent",color:tab===n.id?C.accent:C.muted,fontSize:13.5,fontWeight:tab===n.id?700:400,transition:"all 0.12s"}}
              onClick={()=>setTab(n.id)}>
              <span style={{fontSize:15,width:20,textAlign:"center"}}>{n.icon}</span>{n.label}
            </div>
          ))}
          <div style={{marginTop:"auto",padding:"20px 24px 0",borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8}}>👤 {profile?.name}</div>
            <button onClick={handleLogout} style={{...ghost,width:"100%",fontSize:12,padding:"8px"}}>Выйти</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{marginLeft:230,padding:"32px 36px",flex:1,minWidth:0}}>

          {/* DASHBOARD */}
          {tab==="dashboard"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Дашборд</div>
                <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFTx({...emptyTx,objectId:objects[0]?.id||""});setModal2("tx")}}>+ Транзакция</button>
              </div>
              <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
                {[{l:"Объектов",v:objects.length,c:C.blue},{l:"Активных",v:objects.filter(o=>o.status==="active").length,c:C.green},{l:"Заказчиков",v:clients.length,c:"#a78bfa"},{l:"Сотрудников",v:employees.length,c:C.accent}].map((x,i)=>(
                  <div key={i} style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>{x.l}</div><div style={{fontSize:24,fontWeight:800,color:x.c,marginTop:6}}>{x.v}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
                <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Общий доход</div><div style={{fontSize:24,fontWeight:800,color:C.green,marginTop:6}}>{fmt(total.inc)}</div></div>
                <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Общий расход</div><div style={{fontSize:24,fontWeight:800,color:C.red,marginTop:6}}>{fmt(total.exp)}</div></div>
                <div style={{...statCard,border:`1px solid ${total.profit>=0?"#22c55e40":"#ef444440"}`}}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Прибыль</div><div style={{fontSize:24,fontWeight:800,color:total.profit>=0?C.green:C.red,marginTop:6}}>{fmt(total.profit)}</div></div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:20}}>Объекты — сводка</div>
                {objects.map(obj=>{
                  const os=objStats(obj.id);
                  const objTasks=tasks.filter(t=>t.object_id===obj.id);
                  return(
                    <div key={obj.id} style={{marginBottom:22}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:8}}>
                        <div><span style={{fontSize:14,color:"#fff",fontWeight:700}}>{obj.name}</span><span style={{...badge(STC[obj.status]),marginLeft:10}}>{STL[obj.status]}</span></div>
                        <div style={{display:"flex",gap:16,fontSize:13}}><span style={{color:C.green}}>↑ {fmt(os.inc)}</span><span style={{color:C.red}}>↓ {fmt(os.exp)}</span><span style={{color:os.profit>=0?C.green:C.red,fontWeight:700}}>{fmt(os.profit)}</span></div>
                      </div>
                      <div style={prog}><div style={pfill(obj.progress)}/></div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:11,color:C.muted}}><span>{obj.stage} · {obj.progress}%</span><span>Задачи: {objTasks.filter(t=>t.done).length}/{objTasks.length}</span></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* OBJECTS */}
          {tab==="objects"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Объекты</div>
                <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFObj(emptyObj);setModal2("object")}}>+ Объект</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
                {objects.map(obj=>{
                  const cli=clients.find(c=>c.id===obj.client_id);
                  const os=objStats(obj.id);
                  return(
                    <div key={obj.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{fontSize:15,fontWeight:800,color:"#fff",flex:1,paddingRight:8}}>{obj.name}</div>
                        <span style={badge(STC[obj.status])}>{STL[obj.status]}</span>
                      </div>
                      <div style={{fontSize:12.5,color:C.muted,marginBottom:3}}>📍 {obj.address}</div>
                      <div style={{fontSize:12.5,color:C.muted,marginBottom:14}}>🤝 {cli?.name||"—"}</div>
                      <div style={prog}><div style={pfill(obj.progress)}/></div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:4,marginBottom:14}}><span>{obj.stage}</span><span>{obj.progress}%</span></div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                        {[{l:"Доход",v:fmt(os.inc),c:C.green},{l:"Расход",v:fmt(os.exp),c:C.red},{l:"Прибыль",v:fmt(os.profit),c:os.profit>=0?C.green:C.red}].map((x,i)=>(
                          <div key={i}><div style={{fontSize:10,color:C.muted}}>{x.l}</div><div style={{fontSize:12,fontWeight:700,color:x.c,marginTop:2}}>{x.v}</div></div>
                        ))}
                      </div>
                      <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8}}>
                        <select style={{...inp,flex:1,fontSize:12,padding:"7px 10px"}} value={obj.stage} onChange={e=>updateObject(obj.id,{stage:e.target.value})}>
                          {STAGES.map(st=><option key={st}>{st}</option>)}
                        </select>
                        <input type="range" min={0} max={100} value={obj.progress} style={{flex:1,accentColor:C.accent}} onChange={e=>updateObject(obj.id,{progress:+e.target.value})}/>
                        <span style={{fontSize:12,color:C.accent,minWidth:32}}>{obj.progress}%</span>
                      </div>
                      <div style={{marginTop:8}}>
                        <select style={{...inp,fontSize:12,padding:"7px 10px"}} value={obj.status} onChange={e=>updateObject(obj.id,{status:e.target.value})}>
                          <option value="active">Активный</option><option value="paused">Приостановлен</option><option value="done">Завершён</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CLIENTS */}
          {tab==="clients"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Заказчики</div>
                <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFCli(emptyCli);setModal2("client")}}>+ Заказчик</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
                {clients.map(cli=>{
                  const objs=objects.filter(o=>o.client_id===cli.id);
                  return(
                    <div key={cli.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                        <div style={{width:46,height:46,borderRadius:12,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤝</div>
                        <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{cli.name}</div><div style={{fontSize:12,color:C.muted}}>{cli.contact}</div></div>
                      </div>
                      <div style={{fontSize:13,color:C.muted,marginBottom:4}}>📞 {cli.phone}</div>
                      <div style={{fontSize:13,color:C.muted,marginBottom:14}}>✉️ {cli.email}</div>
                      <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Объекты ({objs.length}):</div>
                        {objs.map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:6}}><span style={{color:C.text}}>{o.name}</span><span style={badge(STC[o.status])}>{STL[o.status]}</span></div>)}
                        {objs.length===0&&<div style={{fontSize:12,color:C.muted}}>Нет объектов</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* FINANCE */}
          {tab==="finance"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Финансы{selObj?` · ${selObj.name}`:""}</div>
                <div style={{display:"flex",gap:10}}>
                  {selObj&&<button style={ghost} onClick={()=>setSelObj(null)}>✕ Все</button>}
                  <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFTx({...emptyTx,objectId:objects[0]?.id||""});setModal2("tx")}}>+ Транзакция</button>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                <button style={pill(!selObj)} onClick={()=>setSelObj(null)}>Все объекты</button>
                {objects.map(o=><button key={o.id} style={pill(selObj?.id===o.id)} onClick={()=>setSelObj(o)}>{o.name}</button>)}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                {["all","income","expense"].map(f=><button key={f} style={pill(txFilter===f)} onClick={()=>setTxFilter(f)}>{f==="all"?"Все":f==="income"?"↑ Доходы":"↓ Расходы"}</button>)}
              </div>
              {(()=>{const inc=filteredTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);const exp=filteredTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);return(
                <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
                  <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Доходы</div><div style={{fontSize:24,fontWeight:800,color:C.green,marginTop:6}}>{fmt(inc)}</div></div>
                  <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Расходы</div><div style={{fontSize:24,fontWeight:800,color:C.red,marginTop:6}}>{fmt(exp)}</div></div>
                  <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Итого</div><div style={{fontSize:24,fontWeight:800,color:inc-exp>=0?C.green:C.red,marginTop:6}}>{fmt(inc-exp)}</div></div>
                </div>
              );})()}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                {filteredTx.length===0&&<div style={{color:C.muted,textAlign:"center",padding:32}}>Нет транзакций</div>}
                {filteredTx.map(tx=>{
                  const obj=objects.find(o=>o.id===tx.object_id);
                  return(
                    <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{width:38,height:38,borderRadius:10,background:tx.type==="income"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{tx.type==="income"?"↑":"↓"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13.5,color:C.text,fontWeight:600}}>{tx.category}</div>
                        <div style={{fontSize:11.5,color:C.muted,marginTop:2}}>{obj?.name} · {tx.date}{tx.note?` · ${tx.note}`:""}</div>
                      </div>
                      <div style={{fontSize:14,fontWeight:700,color:tx.type==="income"?C.green:C.red,marginRight:10}}>{tx.type==="income"?"+":"−"}{fmt(tx.amount)}</div>
                      <button style={{background:"none",border:"none",color:"#2e3a55",cursor:"pointer",fontSize:16}} onClick={()=>deleteTx(tx.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TASKS */}
          {tab==="tasks"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Задачи по этапам</div>
                {selObj&&<button style={ghost} onClick={()=>setSelObj(null)}>✕ Все объекты</button>}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                <button style={pill(!selObj)} onClick={()=>setSelObj(null)}>Все</button>
                {objects.map(o=><button key={o.id} style={pill(selObj?.id===o.id)} onClick={()=>setSelObj(o)}>{o.name}</button>)}
              </div>
              {(selObj?[selObj]:objects).map(obj=>(
                <div key={obj.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{obj.name}</div>
                    <span style={badge(STC[obj.status])}>{obj.stage}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                    {STAGES.map(stage=>{
                      const list=tasks.filter(t=>t.object_id===obj.id&&t.stage===stage);
                      const done=list.filter(t=>t.done).length;
                      const isCurrent=obj.stage===stage;
                      return(
                        <div key={stage} style={{background:isCurrent?"rgba(249,115,22,0.06)":C.bg,border:`1px solid ${isCurrent?C.accent:C.border}`,borderRadius:10,padding:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <span style={{fontSize:12.5,fontWeight:700,color:isCurrent?C.accent:C.muted}}>{stage}</span>
                            <span style={{fontSize:11,color:C.muted}}>{done}/{list.length}</span>
                          </div>
                          <div style={{...prog,marginBottom:10}}><div style={pfill(list.length?done/list.length*100:0,isCurrent?C.accent:C.muted)}/></div>
                          {list.map(task=>(
                            <div key={task.id} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,cursor:"pointer"}} onClick={()=>toggleTask(task)}>
                              <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${task.done?C.green:C.border}`,background:task.done?"rgba(34,197,94,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                                {task.done&&<span style={{color:C.green,fontSize:10,fontWeight:900}}>✓</span>}
                              </div>
                              <span style={{fontSize:12,color:task.done?C.muted:C.text,textDecoration:task.done?"line-through":"none"}}>{task.text}</span>
                            </div>
                          ))}
                          <div style={{display:"flex",gap:6,marginTop:8}}>
                            <input placeholder="Новая задача..." style={{...inp,fontSize:11.5,padding:"5px 9px",flex:1}} id={`t-${obj.id}-${stage}`}
                              onKeyDown={e=>{if(e.key==="Enter"){addTask(obj.id,stage,e.target.value);e.target.value="";}}}/>
                            <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{const el=document.getElementById(`t-${obj.id}-${stage}`);if(el){addTask(obj.id,stage,el.value);el.value="";};}}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* EMPLOYEES */}
          {tab==="employees"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Сотрудники</div>
                <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFEmp(emptyEmp);setNewEmpEmail("");setNewEmpPassword("");setModal2("employee")}}>+ Сотрудник</button>
              </div>
              <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
                <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Всего</div><div style={{fontSize:24,fontWeight:800,color:C.accent,marginTop:6}}>{employees.length}</div></div>
                <div style={statCard}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px"}}>ФОТ / мес.</div><div style={{fontSize:24,fontWeight:800,color:C.red,marginTop:6}}>{fmt(employees.reduce((s,e)=>s+e.salary,0))}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
                {employees.map(emp=>(
                  <div key={emp.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                    <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
                      <div style={{width:46,height:46,borderRadius:12,background:"rgba(249,115,22,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>👷</div>
                      <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{emp.name}</div><div style={{fontSize:12,color:C.muted}}>{emp.role}</div></div>
                    </div>
                    <div style={{fontSize:13,color:C.muted,marginBottom:4}}>📞 {emp.phone}</div>
                    <div style={{fontSize:13,color:C.green,fontWeight:700,marginBottom:12}}>💰 {fmt(emp.salary)} / мес.</div>
                    <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                      <div style={{fontSize:11.5,color:C.muted,marginBottom:6}}>Назначен на объекты:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                        {objects.map(o=>(
                          <button key={o.id} style={{...pill(emp.objectIds.includes(o.id)),fontSize:11,padding:"4px 10px"}} onClick={()=>toggleEmpObject(emp,o.id)}>{o.name}</button>
                        ))}
                      </div>
                    </div>
                    <button style={{...ghost,width:"100%",fontSize:12,marginTop:4,color:C.red,borderColor:"rgba(239,68,68,0.3)"}} onClick={()=>deleteEmployee(emp.id)}>Удалить</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CONTRACTORS */}
          {tab==="contractors"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Подрядчики</div>
                <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>{setFCtr(emptyCtr);setModal2("contractor")}}>+ Подрядчик</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                {contractors.map(c=>(
                  <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                    <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
                      <div style={{width:46,height:46,borderRadius:12,background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔧</div>
                      <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{c.name}</div><div style={{fontSize:12,color:C.muted}}>{c.specialty}</div></div>
                    </div>
                    <div style={{fontSize:13,color:C.muted,marginBottom:12}}>📞 {c.phone}</div>
                    <button style={{...ghost,width:"100%",fontSize:12,color:C.red,borderColor:"rgba(239,68,68,0.3)"}} onClick={()=>deleteContractor(c.id)}>Удалить</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* REPORTS */}
          {tab==="reports"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>Отчёты</div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                <button style={pill(!reportObj)} onClick={()=>setReportObj(null)}>Сводный</button>
                {objects.map(o=><button key={o.id} style={pill(reportObj?.id===o.id)} onClick={()=>setReportObj(o)}>{o.name}</button>)}
              </div>
              {!reportObj&&(
                <>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:16,overflowX:"auto"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:16}}>Все объекты</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Объект","Заказчик","Бюджет","Доходы","Расходы","Прибыль","Статус","Прогресс"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                      <tbody>
                        {objects.map(obj=>{const cli=clients.find(c=>c.id===obj.client_id);const os=objStats(obj.id);return(
                          <tr key={obj.id} style={trS}>
                            <td style={{...tdS(),...{fontWeight:600,color:"#fff"}}}>{obj.name}</td>
                            <td style={tdS(C.muted)}>{cli?.name||"—"}</td>
                            <td style={tdS()}>{fmt(obj.budget)}</td>
                            <td style={tdS(C.green)}><b>{fmt(os.inc)}</b></td>
                            <td style={tdS(C.red)}><b>{fmt(os.exp)}</b></td>
                            <td style={tdS(os.profit>=0?C.green:C.red)}><b>{fmt(os.profit)}</b></td>
                            <td style={tdS()}><span style={badge(STC[obj.status])}>{STL[obj.status]}</span></td>
                            <td style={tdS()}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...prog,width:80}}><div style={pfill(obj.progress)}/></div><span style={{color:C.muted,fontSize:11}}>{obj.progress}%</span></div></td>
                          </tr>
                        );})}
                        <tr style={{borderTop:`2px solid ${C.border}`,background:"rgba(249,115,22,0.04)"}}>
                          <td colSpan={3} style={{...tdS(),...{fontWeight:700,color:"#fff"}}}>ИТОГО</td>
                          <td style={{...tdS(C.green),...{fontWeight:800}}}>{fmt(total.inc)}</td>
                          <td style={{...tdS(C.red),...{fontWeight:800}}}>{fmt(total.exp)}</td>
                          <td colSpan={3} style={{...tdS(total.profit>=0?C.green:C.red),...{fontWeight:800}}}>{fmt(total.profit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,overflowX:"auto"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:16}}>Расходы по категориям</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Категория","Сумма","Операций"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                      <tbody>
                        {EXP_CATEGORIES.map(cat=>{const list=transactions.filter(t=>t.type==="expense"&&t.category===cat);if(!list.length)return null;const sum=list.reduce((s,t)=>s+t.amount,0);return(
                          <tr key={cat} style={trS}><td style={tdS()}>{cat}</td><td style={tdS(C.red)}><b>{fmt(sum)}</b></td><td style={tdS(C.muted)}>{list.length}</td></tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {reportObj&&(()=>{
                const os=objStats(reportObj.id);
                const cli=clients.find(c=>c.id===reportObj.client_id);
                const emps=employees.filter(e=>e.objectIds.includes(reportObj.id));
                const objTx=transactions.filter(t=>t.object_id===reportObj.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
                const objTasks=tasks.filter(t=>t.object_id===reportObj.id);
                return(
                  <>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                        <div>
                          <div style={{fontSize:18,fontWeight:900,color:"#fff",marginBottom:4}}>{reportObj.name}</div>
                          <div style={{fontSize:13,color:C.muted}}>📍 {reportObj.address}</div>
                          <div style={{fontSize:13,color:C.muted}}>🤝 {cli?.name||"—"} · {cli?.contact}</div>
                          <div style={{fontSize:13,color:C.muted}}>📅 {reportObj.start_date} → {reportObj.end_date}</div>
                        </div>
                        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                          {[{l:"Бюджет",v:fmt(reportObj.budget),c:C.blue},{l:"Доходы",v:fmt(os.inc),c:C.green},{l:"Расходы",v:fmt(os.exp),c:C.red},{l:"Прибыль",v:fmt(os.profit),c:os.profit>=0?C.green:C.red}].map((x,i)=>(
                            <div key={i} style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div></div>
                          ))}
                        </div>
                      </div>
                      <div style={{marginTop:16}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6}}><span>Прогресс: {reportObj.stage}</span><span>{reportObj.progress}%</span></div>
                        <div style={prog}><div style={pfill(reportObj.progress)}/></div>
                        <div style={{fontSize:12,color:C.muted,marginTop:6}}>Задачи: {objTasks.filter(t=>t.done).length}/{objTasks.length}</div>
                      </div>
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:16,overflowX:"auto"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:16}}>Транзакции</div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Дата","Тип","Категория","Сумма","Примечание"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                        <tbody>
                          {objTx.map(tx=>(
                            <tr key={tx.id} style={trS}>
                              <td style={tdS(C.muted)}>{tx.date}</td>
                              <td style={tdS()}><span style={badge(tx.type==="income"?C.green:C.red)}>{tx.type==="income"?"Доход":"Расход"}</span></td>
                              <td style={tdS()}>{tx.category}</td>
                              <td style={tdS(tx.type==="income"?C.green:C.red)}><b>{tx.type==="income"?"+":"−"}{fmt(tx.amount)}</b></td>
                              <td style={tdS(C.muted)}>{tx.note||"—"}</td>
                            </tr>
                          ))}
                          <tr style={{borderTop:`2px solid ${C.border}`,background:"rgba(249,115,22,0.04)"}}>
                            <td colSpan={3} style={{...tdS(),...{fontWeight:700,color:"#fff"}}}>Итого</td>
                            <td colSpan={2} style={{...tdS(os.profit>=0?C.green:C.red),...{fontWeight:800}}}>{fmt(os.profit)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,overflowX:"auto"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:16}}>Сотрудники на объекте</div>
                      {emps.length===0?<div style={{color:C.muted}}>Не назначены</div>:(
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Сотрудник","Должность","Телефон","Оклад/мес."].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                          <tbody>
                            {emps.map(e=>(
                              <tr key={e.id} style={trS}>
                                <td style={{...tdS(),...{fontWeight:600,color:"#fff"}}}>{e.name}</td>
                                <td style={tdS(C.muted)}>{e.role}</td>
                                <td style={tdS(C.muted)}>{e.phone}</td>
                                <td style={tdS(C.accent)}><b>{fmt(e.salary)}</b></td>
                              </tr>
                            ))}
                            <tr style={{borderTop:`2px solid ${C.border}`}}>
                              <td colSpan={3} style={{...tdS(),...{fontWeight:700,color:"#fff"}}}>ФОТ итого</td>
                              <td style={{...tdS(C.accent),...{fontWeight:800}}}>{fmt(emps.reduce((s,e)=>s+e.salary,0))}</td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* MODALS */}
        {modal2&&(
          <div style={modalBg} onClick={()=>setModal2(null)}>
            <div style={mbox} onClick={e=>e.stopPropagation()}>

              {modal2==="object"&&(
                <>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:20}}>Новый объект</div>
                  <div style={{marginBottom:14}}><label style={lbl}>Название</label><input style={inp} value={fObj.name} onChange={e=>setFObj(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>Адрес</label><input style={inp} value={fObj.address} onChange={e=>setFObj(p=>({...p,address:e.target.value}))}/></div>
                  <div style={{...row2,marginBottom:14}}>
                    <div><label style={lbl}>Заказчик</label><select style={inp} value={fObj.clientId} onChange={e=>setFObj(p=>({...p,clientId:e.target.value}))}><option value="">— выбрать —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div><label style={lbl}>Бюджет (₽)</label><input type="number" style={inp} value={fObj.budget} onChange={e=>setFObj(p=>({...p,budget:e.target.value}))}/></div>
                  </div>
                  <div style={{...row2,marginBottom:14}}>
                    <div><label style={lbl}>Начало</label><input type="date" style={inp} value={fObj.startDate} onChange={e=>setFObj(p=>({...p,startDate:e.target.value}))}/></div>
                    <div><label style={lbl}>Конец</label><input type="date" style={inp} value={fObj.endDate} onChange={e=>setFObj(p=>({...p,endDate:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:20}}><label style={lbl}>Этап</label><select style={inp} value={fObj.stage} onChange={e=>setFObj(p=>({...p,stage:e.target.value}))}>{STAGES.map(st=><option key={st}>{st}</option>)}</select></div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={ghost} onClick={()=>setModal2(null)}>Отмена</button><button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={submitObj}>Создать</button></div>
                </>
              )}

              {modal2==="tx"&&(
                <>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:20}}>Новая транзакция</div>
                  <div style={{marginBottom:14}}><label style={lbl}>Объект</label><select style={inp} value={fTx.objectId} onChange={e=>setFTx(p=>({...p,objectId:e.target.value}))}><option value="">— выбрать —</option>{objects.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                  <div style={{...row2,marginBottom:14}}>
                    <div><label style={lbl}>Тип</label><select style={inp} value={fTx.type} onChange={e=>setFTx(p=>({...p,type:e.target.value,category:e.target.value==="income"?INC_CATEGORIES[0]:EXP_CATEGORIES[0]}))}>
                      <option value="expense">Расход</option><option value="income">Доход</option></select></div>
                    <div><label style={lbl}>Категория</label><select style={inp} value={fTx.category} onChange={e=>setFTx(p=>({...p,category:e.target.value}))}>{(fTx.type==="income"?INC_CATEGORIES:EXP_CATEGORIES).map(c=><option key={c}>{c}</option>)}</select></div>
                  </div>
                  <div style={{...row2,marginBottom:14}}>
                    <div><label style={lbl}>Сумма (₽)</label><input type="number" style={inp} value={fTx.amount} onChange={e=>setFTx(p=>({...p,amount:e.target.value}))}/></div>
                    <div><label style={lbl}>Дата</label><input type="date" style={inp} value={fTx.date} onChange={e=>setFTx(p=>({...p,date:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:20}}><label style={lbl}>Примечание</label><input style={inp} value={fTx.note} onChange={e=>setFTx(p=>({...p,note:e.target.value}))}/></div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={ghost} onClick={()=>setModal2(null)}>Отмена</button><button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={submitTx}>Добавить</button></div>
                </>
              )}

              {modal2==="employee"&&(
                <>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:20}}>Новый сотрудник</div>
                  <div style={{marginBottom:14}}><label style={lbl}>ФИО</label><input style={inp} value={fEmp.name} onChange={e=>setFEmp(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{...row2,marginBottom:14}}>
                    <div><label style={lbl}>Должность</label><input style={inp} value={fEmp.role} onChange={e=>setFEmp(p=>({...p,role:e.target.value}))}/></div>
                    <div><label style={lbl}>Оклад (₽/мес)</label><input type="number" style={inp} value={fEmp.salary} onChange={e=>setFEmp(p=>({...p,salary:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:14}}><label style={lbl}>Телефон</label><input style={inp} value={fEmp.phone} onChange={e=>setFEmp(p=>({...p,phone:e.target.value}))}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>Email для входа</label><input type="email" style={inp} value={newEmpEmail} onChange={e=>setNewEmpEmail(e.target.value)}/></div>
                  <div style={{marginBottom:20}}><label style={lbl}>Пароль для входа</label><input type="password" style={inp} value={newEmpPassword} onChange={e=>setNewEmpPassword(e.target.value)}/></div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={ghost} onClick={()=>setModal2(null)}>Отмена</button><button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={submitEmp}>Добавить</button></div>
                </>
              )}

              {modal2==="client"&&(
                <>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:20}}>Новый заказчик</div>
                  <div style={{marginBottom:14}}><label style={lbl}>Организация / ФИО</label><input style={inp} value={fCli.name} onChange={e=>setFCli(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>Контактное лицо</label><input style={inp} value={fCli.contact} onChange={e=>setFCli(p=>({...p,contact:e.target.value}))}/></div>
                  <div style={{...row2,marginBottom:20}}>
                    <div><label style={lbl}>Телефон</label><input style={inp} value={fCli.phone} onChange={e=>setFCli(p=>({...p,phone:e.target.value}))}/></div>
                    <div><label style={lbl}>Email</label><input style={inp} value={fCli.email} onChange={e=>setFCli(p=>({...p,email:e.target.value}))}/></div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={ghost} onClick={()=>setModal2(null)}>Отмена</button><button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={submitCli}>Добавить</button></div>
                </>
              )}

              {modal2==="contractor"&&(
                <>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:20}}>Новый подрядчик</div>
                  <div style={{marginBottom:14}}><label style={lbl}>Название / ФИО</label><input style={inp} value={fCtr.name} onChange={e=>setFCtr(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{...row2,marginBottom:20}}>
                    <div><label style={lbl}>Телефон</label><input style={inp} value={fCtr.phone} onChange={e=>setFCtr(p=>({...p,phone:e.target.value}))}/></div>
                    <div><label style={lbl}>Специализация</label><input style={inp} value={fCtr.specialty} onChange={e=>setFCtr(p=>({...p,specialty:e.target.value}))}/></div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={ghost} onClick={()=>setModal2(null)}>Отмена</button><button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={submitCtr}>Добавить</button></div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}
