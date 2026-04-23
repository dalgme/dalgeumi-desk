import { supabase } from '../lib/supabase';

export function LoginScreen() {
  async function loginWithGoogle() {
    const redirectUri = chrome.identity.getRedirectURL();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      console.error('OAuth init failed', error);
      alert('로그인 실패: ' + (error?.message ?? 'unknown'));
      return;
    }

    try {
      const callback = await chrome.identity.launchWebAuthFlow({
        url: data.url,
        interactive: true,
      });
      if (!callback) throw new Error('no callback url');
      const hashOrQuery = callback.split('#')[1] ?? callback.split('?')[1] ?? '';
      const params = new URLSearchParams(hashOrQuery);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) throw new Error('tokens missing in callback');
      const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (setErr) throw setErr;
    } catch (e) {
      console.error('launchWebAuthFlow failed', e);
      alert('로그인 실패: ' + (e as Error).message);
    }
  }

  return (
    <div class="login">
      <h1>달그미데스크</h1>
      <p>팀 내부 공유 북마크 시작페이지</p>
      <button type="button" onClick={loginWithGoogle}>
        Google 계정으로 로그인
      </button>
    </div>
  );
}
