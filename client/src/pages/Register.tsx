import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

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
      navigate('/login', { replace: true });
    } catch (err: any) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.errors?.[0]?.message;
      setError(validationMessage || apiError?.message || 'Unable to create your account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f7f7f7] text-[#141514] dark:bg-[#181a18] dark:text-white">
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-[#e0e1e0] bg-white px-10 py-3 dark:border-[#2d2f2d] dark:bg-[#1f211f]">
            <div className="flex items-center gap-3 text-[#5e7860]">
              <span className="material-symbols-outlined text-3xl">filter_vintage</span>
              <h2 className="font-display text-lg font-bold leading-tight tracking-[-0.015em] text-[#141514] dark:text-white">
                MindfulNature
              </h2>
            </div>

            <div className="flex flex-1 justify-end gap-8">
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

          <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#5e7860]/10 via-[#f7f7f7] to-[#f7f7f7] px-4 py-12 dark:from-[#5e7860]/5 dark:via-[#181a18] dark:to-[#181a18]">
            <div className="flex w-full max-w-[560px] flex-col rounded-xl border border-[#e0e1e0] bg-white p-8 shadow-sm dark:border-[#2d2f2d] dark:bg-[#1f211f] md:p-12">
              <div className="mb-8 flex flex-col gap-3">
                <div className="flex items-end justify-between gap-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#5e7860]">Step 1 of 2: Basics</p>
                  <p className="text-sm font-normal text-[#737873]">50%</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e0e1e0] dark:bg-[#2d2f2d]">
                  <div className="h-full bg-[#5e7860]" style={{ width: '50%' }} />
                </div>
              </div>

              <div className="mb-10 text-center">
                <h1 className="mb-3 font-display text-3xl font-bold leading-tight tracking-tight text-[#141514] dark:text-white">
                  Create Your Account
                </h1>
                <p className="font-display text-lg leading-relaxed text-[#737873] dark:text-[#a0a3a0]">
                  Begin your journey towards emotional wellness and mindful reflection.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#141514] dark:text-white">Full Name</label>
                  <input
                    className="h-12 w-full rounded-lg border-[#e0e1e0] px-4 placeholder:text-[#b0b3b0] focus:border-[#5e7860] focus:ring-[#5e7860] dark:border-[#2d2f2d] dark:bg-[#181a18] dark:text-white"
                    disabled={isSubmitting}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    type="text"
                    value={name}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#141514] dark:text-white">Email Address</label>
                  <input
                    className="h-12 w-full rounded-lg border-[#e0e1e0] px-4 placeholder:text-[#b0b3b0] focus:border-[#5e7860] focus:ring-[#5e7860] dark:border-[#2d2f2d] dark:bg-[#181a18] dark:text-white"
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
                    <label className="text-sm font-medium text-[#141514] dark:text-white">Password</label>
                    <input
                      className="h-12 w-full rounded-lg border-[#e0e1e0] px-4 placeholder:text-[#b0b3b0] focus:border-[#5e7860] focus:ring-[#5e7860] dark:border-[#2d2f2d] dark:bg-[#181a18] dark:text-white"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      type="password"
                      value={password}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#141514] dark:text-white">Confirm Password</label>
                    <input
                      className="h-12 w-full rounded-lg border-[#e0e1e0] px-4 placeholder:text-[#b0b3b0] focus:border-[#5e7860] focus:ring-[#5e7860] dark:border-[#2d2f2d] dark:bg-[#181a18] dark:text-white"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
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
                    className="mt-1 h-4 w-4 rounded border-[#e0e1e0] text-[#5e7860] focus:ring-[#5e7860]"
                    checked={privacyAccepted}
                    disabled={isSubmitting}
                    id="privacy"
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <label
                    className="font-display text-sm leading-relaxed text-[#737873] dark:text-[#a0a3a0]"
                    htmlFor="privacy"
                  >
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
              </form>

              <div className="mt-8 border-t border-[#e0e1e0] pt-6 text-center dark:border-[#2d2f2d]">
                <p className="font-display text-[#737873] dark:text-[#a0a3a0]">
                  Already have an account?
                  <Link
                    className="ml-1 font-display font-semibold text-[#5e7860] hover:underline underline-offset-4"
                    to="/login"
                  >
                    Sign in here
                  </Link>
                </p>
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
            <p className="font-display text-[10px] uppercase tracking-widest text-[#b0b3b0]">
              © 2024 MindfulNature. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
