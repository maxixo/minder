import { Link } from 'react-router-dom';
import '@/styles/pages/login.css';

export default function Login() {
  return (
    <div className="botanical-pattern min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-sage-50 to-sand-100 font-sans text-[#141514]">
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 bg-white/30 px-6 py-3 backdrop-blur-sm md:px-20">
            <div className="flex items-center gap-3">
              <div className="size-8 text-[#5e7860]">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#5e7860]">Mindful</h2>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <a className="text-sm font-medium transition-colors hover:text-[#5e7860]" href="#">
                Home
              </a>
              <a className="text-sm font-medium transition-colors hover:text-[#5e7860]" href="#">
                About
              </a>
              <a className="text-sm font-medium transition-colors hover:text-[#5e7860]" href="#">
                Resources
              </a>
              <Link
                className="rounded-full bg-[#5e7860] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-sage-600"
                to="/register"
              >
                Sign Up
              </Link>
            </div>

            <div className="md:hidden">
              <span className="material-symbols-outlined cursor-pointer">menu</span>
            </div>
          </header>

          <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-[500px] animate-fade-in">
              <div className="relative overflow-hidden rounded-[3rem_2rem_4rem_2rem] border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-8 md:p-10">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5e7860]/10 blur-3xl" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-4 inline-flex rounded-full bg-sage-50 p-3 sm:p-4">
                    <span className="material-symbols-outlined text-3xl text-[#5e7860]">spa</span>
                  </div>

                  <h1 className="mb-2 text-center font-display text-3xl font-semibold text-[#5e7860] sm:text-4xl md:text-5xl">
                    Welcome Back
                  </h1>
                  <p className="mb-6 text-center text-gray-500 sm:mb-8">Continue your journey to wellness</p>

                  <form className="w-full space-y-6">
                    <div className="relative">
                      <label className="mb-2 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#5e7860]/70">
                        Email Address
                      </label>
                      <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all focus-within:border-[#5e7860]/20">
                        <span className="material-symbols-outlined mr-3 text-[#5e7860]/50">mail</span>
                        <input
                          className="w-full border-none bg-transparent py-2.5 text-gray-800 placeholder:text-gray-400 focus:ring-0"
                          placeholder="yourname@email.com"
                          type="email"
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
                      <div className="flex items-center rounded-xl border-2 border-transparent bg-sand-100 px-4 py-1 transition-all focus-within:border-[#5e7860]/20">
                        <span className="material-symbols-outlined mr-3 text-[#5e7860]/50">lock</span>
                        <input
                          className="w-full border-none bg-transparent py-2.5 text-gray-800 placeholder:text-gray-400 focus:ring-0"
                          placeholder="••••••••"
                          type="password"
                        />
                        <span className="material-symbols-outlined cursor-pointer text-[#5e7860]/50 hover:text-[#5e7860]">
                          visibility
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                      <input
                        className="h-4 w-4 rounded border-[#5e7860]/20 bg-sand-50 text-[#5e7860] focus:ring-[#5e7860]"
                        id="remember"
                        type="checkbox"
                      />
                      <label className="cursor-pointer text-sm text-gray-600" htmlFor="remember">
                        Remember my journey
                      </label>
                    </div>

                    <button
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5e7860] py-3.5 text-base font-bold text-white transition-all hover:bg-sage-600 hover:shadow-lg hover:shadow-[#5e7860]/20 sm:mt-4 sm:py-4 sm:text-lg"
                      type="button"
                    >
                      Sign In
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </form>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <p className="text-sm text-gray-500">
                      New to Mindful?{' '}
                      <Link className="font-bold text-[#5e7860] hover:underline" to="/register">
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center sm:mt-10">
                <p className="mx-auto max-w-sm font-display text-base italic leading-relaxed text-[#5e7860]/70 sm:text-xl md:text-2xl">
                  &quot;Take a deep breath. You are exactly where you need to be.&quot;
                </p>
              </div>
            </div>
          </main>

          <footer className="flex w-full justify-center py-4 sm:py-6">
            <div className="flex gap-4 opacity-30 grayscale transition-all hover:grayscale-0">
              <div className="h-12 w-12 rounded-full bg-[#5e7860]" data-alt="Abstract green organic leaf shape circle" />
              <div className="h-12 w-12 rounded-full border border-[#5e7860] bg-sand-100" data-alt="Abstract sand colored circle outline" />
              <div className="h-12 w-12 rounded-full bg-[#5e7860]/40" data-alt="Abstract translucent green circle" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
