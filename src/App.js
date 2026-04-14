import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import AdminApp from './AdminApp';
import EmployeeApp from './EmployeeApp';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка текущей сессии
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error("Ошибка загрузки профиля:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
     // Найдите это место в App.js и замените тексты:

return (
  <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
    <form onSubmit={handleLogin} style={{ background: '#161c2a', padding: 40, borderRadius: 20, width: 320, border: '1px solid #1e2840' }}>
      
      {/* ЗАМЕНИТЕ ЭТИ СТРОЧКИ */}
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 10px 0', textAlign: 'center' }}>
        Abyroi<span style={{ color: '#f97316' }}>CRM</span>
      </h1>
      <p style={{ color: '#5a6685', textAlign: 'center', marginBottom: 30, fontSize: 14 }}>
        Система управления строительством
      </p>
      
      <input name="email" type="email" placeholder="Email" required style={inputStyle} />
      <input name="password" type="password" placeholder="Пароль" required style={inputStyle} />
      
      <button type="submit" style={{ width: '100%', padding: 12, background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        Войти в систему
      </button>
      
    </form>
  </div>
);
  }

  // Если не авторизован — показываем экран логина
  if (!session) return <Login />;

  // Если авторизован — показываем админку (принудительно для вас сейчас)
  // Позже мы вернем проверку if (profile?.role === 'admin')
  return <AdminApp profile={profile} />;
}
