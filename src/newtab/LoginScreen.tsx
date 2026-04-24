import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';

type Step = 'email' | 'code';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep('code');
  }

  async function verifyCode(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div class="login">
      <h1>달그미데스크</h1>
      <p class="subtitle">팀 내부 공유 북마크 시작페이지</p>

      {step === 'email' ? (
        <form onSubmit={sendCode}>
          <input
            type="email"
            placeholder="회사 이메일"
            value={email}
            onInput={(e) => setEmail((e.currentTarget as HTMLInputElement).value)}
            required
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || !email}>
            {loading ? '전송 중…' : '로그인 코드 받기'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <p class="hint">
            <strong>{email}</strong> 으로 전송된 6자리 코드를 입력해 주세요.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="6자리 코드"
            value={code}
            onInput={(e) => setCode((e.currentTarget as HTMLInputElement).value)}
            maxLength={6}
            required
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? '확인 중…' : '로그인'}
          </button>
          <button
            type="button"
            class="link"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            disabled={loading}
          >
            이메일 변경
          </button>
        </form>
      )}

      {error && <div class="error">{error}</div>}
    </div>
  );
}
