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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0d1117',color:'#fff',fontFamily:'Onest,sans-serif',fontSize:16}}>
      Загрузка...
    </div>
  );

  if (!session) return <Login />;
  if (profile?.role === 'admin') return <AdminApp profile={profile} />;
  return <EmployeeApp profile={profile} />;
}
