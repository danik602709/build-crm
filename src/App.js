import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import AdminApp from './AdminApp';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
    setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'),
      password: fd.get('password'),
    });
    if (error) alert("Ошибка входа: " + error.message);
  }

  if (loading) return <div style={{background:'#0d1117', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'sans-serif'}}>Загрузка Abyroi CRM...</div>;

  if (session && profile) {
    return <AdminApp profile={profile} />;
  }

  const inputStyle = { width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #1e2840', borderRadius: 8, color: '#fff', marginBottom: 15, boxSizing: 'border-box' };

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleLogin} style={{ background: '#161c2a', padding: 40, borderRadius: 20, width: 320, border: '1px solid #1e2840' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 5px 0', textAlign: 'center' }}>
          Abyroi<span style={{ color: '#f97316' }}>CRM</span>
        </h1>
        <p style={{ color: '#5a6685', textAlign: 'center', marginBottom: 30, fontSize: 14 }}>
          Система управления строительством
        </p>
        
        <input name="email" type="email" placeholder="Email" required style={inputStyle} />
        <input name="password" type="password" placeholder="Пароль" required style={inputStyle} />
        
        <button type="submit" style={{ width: '100%', padding: 12, background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Войти
        </button>
      </form>
    </div>
  );
}
