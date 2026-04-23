import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { LoginScreen } from './LoginScreen';
import { Dashboard } from './Dashboard';
import type { Session } from '@supabase/supabase-js';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div class="loading">달그미데스크 로딩 중…</div>;
  if (!session) return <LoginScreen />;
  return <Dashboard session={session} />;
}
