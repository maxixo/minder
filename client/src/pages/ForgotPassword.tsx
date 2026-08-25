import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import authService from '@/services/authService';
import '@/styles/pages/login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(trimmed);
      setSuccess(res?.message || 'If that email is registered, a reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <AuthThemeToggle />
              <Link className="text-sm font-medium text-[#141514] transition-colors hover:text-[#5e7860] dark:text-sage-100" to="/">
                Home
              </Link>
              <Link
                className="rounded-full bg-[#5e7860] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-sage-600"
                to="/login"
              >
                Sign In
              </Link>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <AuthThemeToggle className="gap-2 px-2.5" />
            </div>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-6">
            <div className="w-full max-w-[440px] animate-fade-in">
              <div className="relative overflow-hidden rounded-[3rem_2rem_4rem_2rem] border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#15201a]/85 md:p-10">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5e7860]/10 blur-3xl dark:bg-sage-300/10" />

                <div className="relative z-10 flex flex-col items-center">
                  <span className="material-symbols-outlined mb-4 text-5xl text-[#5e7860]" aria-hidden="true">
                    lock_reset
                  </span>

                  <h1 className="compact-section-title mb-2 text-center font-sans text-[#5e7860] md:text-3xl">
                    Forgot Password
                  </h1>

                  {success ? (
                    <>
                      <p className="compact-lead mb-6 text-center text-gray-500 dark:text-sage-300">
                        {success}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-sage-300">
                        Didn\u2019t receive it?{' '}
                        <button
                          className="font-semibold text-[#5e7860] hover:underline"
                          disabled={isSubmitting}
                          onClick={() => { setSuccess(''); setError(''); }}
                          type="button"
                        >
                          Try again
                        </button>
                      </p>
                      <Link
                        className="mt-6 w-full rounded-xl bg-[#5e7860] py-3.5 text-center text-base font-semibold text-white transition-all hover:bg-sage-600"
                        to="/login"
                      >
                        Back to Sign In
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="compact-lead mb-6 text-center text-gray-500 dark:text-sage-300">
                        Enter your email and we&rsquo;ll send you a link to reset your password.
                      </p>
                      <form className="w-full space-y-5" onSubmit={handleSubmit}>
                        <div>
                          <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-[#5e7860]/70">
                            Email Address
                          </label>
                          <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all dark:bg-[#101915]">
                            <span className="material-symbols-outlined mr-3 text-[#5e7860]/50 dark:text-sage-300/60">mail</span>
                            <input
                              className="w-full border-none bg-transparent py-2.5 text-gray-800 outline-none placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-sage-50 dark:placeholder:text-sage-400"
                              autoComplete="email"
                              disabled={isSubmitting}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="yourname@email.com"
                              type="email"
                              value={email}
                            />
                          </div>
                        </div>

                        {error ? (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                          </div>
                        ) : null}

                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-semibold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSubmitting}
                          type="submit"
                        >
                          {isSubmitting ? 'Sending\u2026' : 'Send Reset Link'}
                          <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                      </form>

                      <p className="mt-6 text-sm text-gray-500 dark:text-sage-300">
                        Remember your password?{' '}
                        <Link className="font-semibold text-[#5e7860] hover:underline" to="/login">
                          Sign In
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center sm:mt-8">
                <p className="mx-auto max-w-sm font-display text-base italic leading-relaxed text-[#5e7860]/70 dark:text-sage-300/80">
                  &quot;Every step forward is progress.&quot;
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}