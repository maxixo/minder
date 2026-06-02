import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/useAuth';
import '@/styles/pages/login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to sign in right now.');
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
              <a className="text-sm font-medium text-[#141514] transition-colors hover:text-[#5e7860] dark:text-sage-100" href="#">
                Home
              </a>
              <a className="text-sm font-medium text-[#141514] transition-colors hover:text-[#5e7860] dark:text-sage-100" href="#">
                About
              </a>
              <a className="text-sm font-medium text-[#141514] transition-colors hover:text-[#5e7860] dark:text-sage-100" href="#">
                Resources
              </a>
              <Link
                className="rounded-full bg-[#5e7860] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-sage-600"
                to="/register"
              >
                Sign Up
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <AuthThemeToggle className="gap-2 px-2.5" />
              <span className="material-symbols-outlined cursor-pointer text-[#141514] dark:text-sage-100">menu</span>
            </div>
          </header>

          <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-[500px] animate-fade-in">
              <div className="relative overflow-hidden rounded-[3rem_2rem_4rem_2rem] border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#15201a]/85 sm:p-8 md:p-10">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5e7860]/10 blur-3xl dark:bg-sage-300/10" />

                <div className="relative z-10 flex flex-col items-center">
                  <BrandLogo
                    className="mb-5 justify-center"
                    titleClassName="text-3xl text-[#141514] dark:text-sage-50 sm:text-[2.2rem]"
                    iconClassName="h-10 w-10 text-[#44604a] dark:text-sage-50"
                  />

                  <h1 className="mb-2 text-center font-sans text-2xl font-semibold text-[#5e7860] sm:text-3xl md:text-4xl">
                    Welcome Back
                  </h1>
                  <p className="mb-6 text-center text-gray-500 dark:text-sage-300 sm:mb-8">Continue your journey to wellness</p>

                  <form className="w-full space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                      <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">
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

                    <div className="relative">
                      <div className="mb-2 ml-1 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">Password</label>
                        <a className="text-xs font-semibold text-[#5e7860] hover:underline" href="#">
                          Forgot?
                        </a>
                      </div>
                      <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all dark:bg-[#101915]">
                        <span className="material-symbols-outlined mr-3 text-[#5e7860]/50 dark:text-sage-300/60">lock</span>
                        <input
                          className="w-full border-none bg-transparent py-2.5 text-gray-800 outline-none placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-sage-50 dark:placeholder:text-sage-400"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="********"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                        />
                        <button
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="material-symbols-outlined cursor-pointer text-[#5e7860]/50 hover:text-[#5e7860] dark:text-sage-300/60 dark:hover:text-sage-100"
                          onClick={() => setShowPassword((current) => !current)}
                          type="button"
                        >
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </button>
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 px-1">
                      <input
                        className="h-4 w-4 rounded border-[#5e7860]/20 bg-sand-50 text-[#5e7860] focus:ring-0 dark:border-white/10 dark:bg-[#101915]"
                        id="remember"
                        type="checkbox"
                      />
                      <label className="cursor-pointer text-sm text-gray-600 dark:text-sage-300" htmlFor="remember">
                        Remember my journey
                      </label>
                    </div>

                    <button
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-bold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-4 sm:py-4 sm:text-lg"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </form>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-sage-300">
                      New to MindfulLife?{' '}
                      <Link className="font-bold text-[#5e7860] hover:underline" to="/register">
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center sm:mt-10">
                <p className="mx-auto max-w-sm font-display text-base italic leading-relaxed text-[#5e7860]/70 dark:text-sage-300/80 sm:text-xl md:text-2xl">
                  &quot;Take a deep breath. You are exactly where you need to be.&quot;
                </p>
              </div>
            </div>
          </main>

          <div className="pointer-events-none fixed bottom-0 left-0 p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860] dark:text-sage-300/70">eco</span>
          </div>
          <div className="pointer-events-none fixed right-0 top-20 p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860] dark:text-sage-300/70">psychiatry</span>
          </div>

          <footer className="flex w-full justify-center py-4 sm:py-6">
            <div className="flex gap-4 opacity-30 grayscale transition-all hover:grayscale-0">
              <div className="h-12 w-12 rounded-full bg-[#5e7860] dark:bg-sage-200/80" data-alt="Abstract green organic leaf shape circle" />
              <div className="h-12 w-12 rounded-full border border-[#5e7860] bg-sand-100 dark:border-sage-200/70 dark:bg-[#101915]" data-alt="Abstract sand colored circle outline" />
              <div className="h-12 w-12 rounded-full bg-[#5e7860]/40 dark:bg-sage-200/40" data-alt="Abstract translucent green circle" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
