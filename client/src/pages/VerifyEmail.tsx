import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import authService from '@/services/authService';
import '@/styles/pages/login.css';

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is invalid. It may be missing its token.');
      return;
    }

    let active = true;
    (async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (!active) return;
        setState('success');
        setMessage(res?.message || 'Email verified successfully. You can now log in.');
      } catch (err: any) {
        if (!active) return;
        setState('error');
        setMessage(err.response?.data?.message || 'We couldn\u2019t verify this link. It may be expired or already used.');
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const icon =
    state === 'success' ? 'verified' : state === 'error' ? 'error' : 'sync';
  const iconClasses =
    state === 'success'
      ? 'text-[#5e7860]'
      : state === 'error'
        ? 'text-red-500'
        : 'animate-spin text-[#5e7860]';

  return (
    <div className="botanical-pattern min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-sage-50 to-sand-100 font-sans text-[#141514] transition-colors dark:from-[#18201b] dark:to-[#101714] dark:text-sage-50">
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 bg-white/30 px-6 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-[#15201a]/70 md:px-20">
            <BrandLogo
              titleClassName="text-xl text-[#141514] dark:text-sage-50"
              iconClassName="h-8 w-8 text-[#44604a] dark:text-sage-50"
            />
            <div className="hidden items-center gap-4 md:flex">
              <AuthThemeToggle showLabel={false} />
              <Link className="text-sm font-medium text-[#141514] transition-colors hover:text-[#5e7860] dark:text-sage-100" to="/">
                Home
              </Link>
            </div>
            <div className="flex items-center md:hidden">
              <AuthThemeToggle showLabel={false} />
            </div>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-6">
            <div className="w-full max-w-[440px] animate-fade-in">
              <div className="relative overflow-hidden rounded-[3rem_2rem_4rem_2rem] border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#15201a]/85 md:p-10">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5e7860]/10 blur-3xl dark:bg-sage-300/10" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <span
                    className={`material-symbols-outlined mb-4 text-5xl ${iconClasses}`}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>

                  <h1 className="compact-section-title mb-2 font-sans text-[#5e7860] md:text-3xl">
                    {state === 'success'
                      ? 'Email Verified'
                      : state === 'error'
                        ? 'Verification Failed'
                        : 'Verifying\u2026'}
                  </h1>

                  <p className="compact-lead mb-6 text-gray-500 dark:text-sage-300">
                    {state === 'loading' ? 'Confirming your email address\u2026' : message}
                  </p>

                  {state === 'success' && (
                    <Link
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-semibold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20"
                      to="/login"
                    >
                      Continue to Login
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </Link>
                  )}

                  {state === 'error' && (
                    <>
                      <Link
                        className="mt-2 w-full rounded-xl bg-[#5e7860] py-3.5 text-base font-semibold text-white transition-all hover:bg-sage-600"
                        to="/login"
                      >
                        Go to Login
                      </Link>
                      <p className="mt-4 text-sm text-gray-500 dark:text-sage-300">
                        Trouble verifying?{' '}
                        <Link className="font-semibold text-[#5e7860] hover:underline" to="/login">
                          Sign in instead
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center sm:mt-8">
                <p className="mx-auto max-w-sm font-display text-base italic leading-relaxed text-[#5e7860]/70 dark:text-sage-300/80">
                  &quot;Small steps, steady progress.&quot;
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
