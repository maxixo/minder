import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import authService from '@/services/authService';
import '@/styles/pages/login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingToken = !token;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (missingToken) {
      setError('This password reset link is invalid. It may be missing its token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (confirm !== password) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword(token, password);
      setSuccess(res?.message || 'Password reset successfully. You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset your password. The link may be expired or already used.');
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

                <div className="relative z-10 flex flex-col items-center">
                  <span className="material-symbols-outlined mb-4 text-5xl text-[#5e7860]" aria-hidden="true">
                    lock_reset
                  </span>

                  <h1 className="compact-section-title mb-2 text-center font-sans text-[#5e7860] md:text-3xl">
                    Reset Your Password
                  </h1>
                  <p className="compact-lead mb-6 text-center text-gray-500 dark:text-sage-300">
                    {success ? 'Your password has been updated.' : 'Choose a new password for your account.'}
                  </p>

                  {success ? (
                    <>
                      <Link
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-semibold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20"
                        to="/login"
                      >
                        Continue to Login
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </Link>
                      <p className="mt-4 text-sm text-gray-500 dark:text-sage-300">
                        <a className="font-semibold text-[#5e7860] hover:underline" href="mailto:support@stackpro.com.ng">
                          Need help? Contact support.
                        </a>
                      </p>
                    </>
                  ) : missingToken ? (
                    <>
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        This password reset link is invalid. Please request a new one.
                      </div>
                      <Link
                        className="mt-6 w-full rounded-xl bg-[#5e7860] py-3.5 text-center text-base font-semibold text-white transition-all hover:bg-sage-600"
                        to="/login"
                      >
                        Go to Login
                      </Link>
                    </>
                  ) : (
                    <form className="w-full space-y-5" onSubmit={handleSubmit}>
                      <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-[#5e7860]/70">
                          New Password
                        </label>
                        <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all dark:bg-[#101915]">
                          <span className="material-symbols-outlined mr-3 text-[#5e7860]/50 dark:text-sage-300/60">lock</span>
                          <input
                            className="w-full border-none bg-transparent py-2.5 text-gray-800 outline-none placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-sage-50 dark:placeholder:text-sage-400"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="At least 8 characters"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-[#5e7860]/70">
                          Confirm New Password
                        </label>
                        <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all dark:bg-[#101915]">
                          <span className="material-symbols-outlined mr-3 text-[#5e7860]/50 dark:text-sage-300/60">lock</span>
                          <input
                            className="w-full border-none bg-transparent py-2.5 text-gray-800 outline-none placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-sage-50 dark:placeholder:text-sage-400"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            onChange={(event) => setConfirm(event.target.value)}
                            placeholder="Re-enter your new password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirm}
                          />
                        </div>
                      </div>

                      <button
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="text-xs font-medium text-[#5e7860] hover:underline"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? 'Hide passwords' : 'Show passwords'}
                      </button>

                      {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                          {error}
                        </div>
                      ) : null}

                      <button
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-semibold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? 'Saving\u2026' : 'Reset Password'}
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center sm:mt-8">
                <p className="mx-auto max-w-sm font-display text-base italic leading-relaxed text-[#5e7860]/70 dark:text-sage-300/80">
                  &quot;Every new beginning starts with a fresh step.&quot;
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
