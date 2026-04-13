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
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center', 
        height:'100vh', background:'#0d1117', color:'#fff', fontFamily:'sans-serif'
      }}>
        Загрузка BuildCRM...
      </div>
    );
  }

  // Если не авторизован — показываем экран логина
  if (!session) return <Login />;

  // Если авторизован — показываем админку (принудительно для вас сейчас)
  // Позже мы вернем проверку if (profile?.role === 'admin')
  return <AdminApp profile={profile} />;
}
