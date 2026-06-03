import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/useAuth';
import '@/styles/pages/login.css';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useMemo(() => {
    const checks = [
      name.trim().length > 0,
      email.trim().length > 0,
      password.length >= 8,
      confirmPassword.length > 0 && password === confirmPassword,
      privacyAccepted,
    ];
    const completedFields = checks.filter(Boolean).length;
    const percent = Math.round((completedFields / checks.length) * 100);

    return {
      completedFields,
      percent,
      totalFields: checks.length,
    };
  }, [confirmPassword, email, name, password, privacyAccepted]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please complete all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!privacyAccepted) {
      setError('Please accept the Privacy Policy and Terms of Service.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name: trimmedName, email: trimmedEmail, password });
      navigate('/login', {
        replace: true,
        state: {
          newlyRegistered: true,
          registeredEmail: trimmedEmail,
        },
      });
    } catch (err: any) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.errors?.[0]?.message;
      setError(validationMessage || apiError?.message || 'Unable to create your account right now.');
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

            <div className="flex flex-1 justify-end gap-3 md:gap-8">
              <AuthThemeToggle />

              <div className="hidden items-center gap-9 md:flex">
                <a
                  className="text-sm font-medium leading-normal text-[#141514] transition-colors hover:text-[#5e7860] dark:text-white"
                  href="#"
                >
                  Our Vision
                </a>
                <a
                  className="text-sm font-medium leading-normal text-[#141514] transition-colors hover:text-[#5e7860] dark:text-white"
                  href="#"
                >
                  Practices
                </a>
                <a
                  className="text-sm font-medium leading-normal text-[#141514] transition-colors hover:text-[#5e7860] dark:text-white"
                  href="#"
                >
                  Journal
                </a>
              </div>

              <div className="flex gap-2">
                <Link
                  className="flex h-10 min-w-[84px] items-center justify-center overflow-hidden rounded-full bg-[#f2f3f2] px-4 text-sm font-bold leading-normal text-[#141514] dark:bg-[#2d2f2d] dark:text-white"
                  to="/login"
                >
                  <span>Login</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-6">
            <div className="w-full max-w-[560px] animate-fade-in">
              <div className="relative overflow-hidden rounded-[3rem_2rem_4rem_2rem] border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#15201a]/85 md:p-12">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5e7860]/10 blur-3xl dark:bg-sage-300/10" />

                <div className="relative z-10 flex flex-col">
              <div className="mb-8 flex flex-col gap-3">
                <div className="flex items-end justify-between gap-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#5e7860]">
                    Basics Completed: {progress.completedFields} of {progress.totalFields}
                  </p>
                  <p className="text-sm font-normal text-[#737873] dark:text-[#a0a3a0]">{progress.percent}%</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e0e1e0] dark:bg-[#2d2f2d]">
                  <div
                    className="h-full bg-[#5e7860] transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>

              <div className="mb-10 text-center">
                <BrandLogo
                  className="mb-5 justify-center"
                  titleClassName="text-3xl text-[#141514] dark:text-sage-50 sm:text-[2.2rem]"
                  iconClassName="h-10 w-10 text-[#44604a] dark:text-sage-50"
                />
                <h1 className="mb-3 font-sans text-2xl font-bold leading-tight tracking-tight text-[#5e7860] sm:text-3xl md:text-4xl">
                  Create Your Account
                </h1>
                <p className="text-lg leading-relaxed text-gray-500 dark:text-sage-300">
                  Set up your account, choose your reflection rhythm, and reach your first entry in a few minutes.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">Full Name</label>
                  <input
                    className="h-12 w-full rounded-xl border-2 border-transparent bg-sand-100 px-4 text-gray-800 outline-none placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-0 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-400"
                    disabled={isSubmitting}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    type="text"
                    value={name}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">Email Address</label>
                  <input
                    className="h-12 w-full rounded-xl border-2 border-transparent bg-sand-100 px-4 text-gray-800 outline-none placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-0 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-400"
                    autoComplete="email"
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="hello@nature.com"
                    type="email"
                    value={email}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">Password</label>
                    <input
                      className="h-12 w-full rounded-xl border-2 border-transparent bg-sand-100 px-4 text-gray-800 outline-none placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-0 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-400"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="********"
                      type="password"
                      value={password}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">Confirm Password</label>
                    <input
                      className="h-12 w-full rounded-xl border-2 border-transparent bg-sand-100 px-4 text-gray-800 outline-none placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-0 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-400"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="********"
                      type="password"
                      value={confirmPassword}
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-2 flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 rounded border-[#e0e1e0] text-[#5e7860] focus:ring-0"
                    checked={privacyAccepted}
                    disabled={isSubmitting}
                    id="privacy"
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <label className="text-sm leading-relaxed text-gray-600 dark:text-sage-300" htmlFor="privacy">
                    I agree to the{' '}
                    <a className="text-[#5e7860] underline underline-offset-2" href="#">
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a className="text-[#5e7860] underline underline-offset-2" href="#">
                      Terms of Service
                    </a>
                    .
                  </label>
                </div>

                <button
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#5e7860] text-base font-bold leading-normal text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="rounded-xl border border-[#d8e4d8] bg-[#f4f8f4] px-4 py-3 text-sm leading-6 text-[#4f6b55] dark:border-white/10 dark:bg-[#101915] dark:text-sage-200">
                  Basic reflection, reminder setup, and your first habit loop are free. Upgrade later only if you want deeper analytics and richer summaries.
                </div>
              </form>

              <div className="mt-8 border-t border-[#e0e1e0] pt-6 text-center dark:border-[#2d2f2d]">
                <p className="text-sm text-gray-500 dark:text-sage-300">
                  Already have an account?
                  <Link
                    className="ml-1 font-semibold text-[#5e7860] hover:underline underline-offset-4"
                    to="/login"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
                </div>
              </div>
            </div>
          </main>

          <div className="pointer-events-none fixed bottom-0 left-0 p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860]">eco</span>
          </div>
          <div className="pointer-events-none fixed right-0 top-20 p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860]">psychiatry</span>
          </div>

          <footer className="flex flex-col items-center gap-4 border-t border-[#e0e1e0] bg-white py-8 dark:border-[#2d2f2d] dark:bg-[#1f211f]">
            <div className="flex gap-6">
              <a className="text-xs text-[#737873] transition-colors hover:text-[#5e7860]" href="#">
                Privacy
              </a>
              <a className="text-xs text-[#737873] transition-colors hover:text-[#5e7860]" href="#">
                Terms
              </a>
              <a className="text-xs text-[#737873] transition-colors hover:text-[#5e7860]" href="#">
                Help
              </a>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#b0b3b0]">
              Copyright 2024 MindfulLife. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
