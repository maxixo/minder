import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import '@/styles/pages/landing.css';

const landscapeUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXYq286VW1f18x4qR0D_EBxJje683pXioD7k_dhiwFf0zNbx__14iosn3l0URvO4VJFm5O64C8QjGo10GenFwh-z12q2hjP2x3RHpvSzq5TBwpPI3_WEH-n8c3MeOt5EF9wGmnnDhflGbdx6v5LdB0Zuf9c8MqO9UCoo72WTa7nxWJphQiPZnAdvAzyYcBcV8HIoBcLRt-ivSlfs4l9_kcY2KUjIkackTS914Uq4w28z13izsRTz6DdW1si7VbGkAntVYh8qZyYkio';
const leafUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYbatW62FFdeXo8LEnim5aLeeA6nNnIElL4cPd58OlOX8c9w0uVSNRXKey7L1xgsceyOGTujh-7Bp6TWhte-StUJTtMENJISoDShxgh5Re04aDjLOtRjWDbpASqW1QMN9tnISWIy3DufAsXeM7dIvlbGtxL46hqr7ZQGte-qBWc0s4uVgMosJrOgqDlWS2F0cJlA9mkdLq3CoaEyrbfamjSe90jYhw6KEi3_9ifxoKD8Ompa0PWUmrL8VDeta5mwkDwKfzB5bFxMLg';
const navItems = [
  { id: 'reflection', label: 'Reflection' },
  { id: 'energy', label: 'Energy' },
  { id: 'guidance', label: 'Guidance' },
  { id: 'about', label: 'About' },
] as const;

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]['id']>('reflection');

  const primaryCtaPath = useMemo(() => (isAuthenticated ? '/dashboard' : '/register'), [isAuthenticated]);

  useEffect(() => {
    document.body.classList.add('landing-page-body');
    document.title = 'MindfulLife | Your Sanctuary for Inner Peace';

    return () => {
      document.body.classList.remove('landing-page-body');
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;

    const revealSections = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        });
      },
      { threshold: 0.1 }
    );

    revealSections.forEach((section) => {
      section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10');
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id as (typeof navItems)[number]['id']);
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed"
      ref={pageRef}
    >
      <nav className={`fixed left-0 top-0 z-50 w-full bg-surface/80 backdrop-blur-md transition-all duration-300 dark:bg-surface-dim/80 ${isScrolled ? 'py-2 shadow-sm' : 'py-4'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-gutter">
          <Link className="shrink-0" to="/">
            <BrandLogo
              className="gap-2"
              iconClassName="h-8 w-8 md:h-9 md:w-9"
              titleClassName="text-xl md:text-2xl"
              tone={isDarkMode ? 'light' : 'brand'}
              withWordmark
            />
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-8 lg:gap-10">
              {navItems.map(({ id, label }) => {
                const isActive = activeSection === id;

                return (
                  <a
                    key={id}
                    className={`border-b-2 pb-1 font-body-md text-body-md transition-colors duration-300 ${
                      isActive
                        ? 'border-primary font-bold text-primary dark:border-primary-fixed dark:text-primary-fixed'
                        : 'border-transparent font-medium text-on-surface-variant hover:text-primary dark:text-outline-variant dark:hover:text-primary-fixed'
                    }`}
                    href={`#${id}`}
                    onClick={() => setActiveSection(id)}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AuthThemeToggle className="shrink-0" showLabel={false} />
            <Link
              className="rounded-full bg-primary-container px-6 py-2 font-label-md text-label-md text-on-primary-container transition-all duration-200 hover:opacity-80"
              to={primaryCtaPath}
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="hero-bg relative flex min-h-screen items-center justify-center overflow-hidden pt-24">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/10 to-background/40" />
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-gutter">
            <div className="glass-hero max-w-4xl rounded-[40px] p-8 text-center shadow-2xl shadow-primary/10 md:p-16">
              <h1 className="animate-fade-in-up expressive-heading type-scale-h1 mb-8 text-primary">
                Your Sanctuary for Inner Peace
              </h1>
              <p className="type-scale-p mx-auto mb-12 max-w-2xl font-label-sm text-secondary">
                Cultivate mindfulness, track your energy, and find balance in the rhythm of nature.
              </p>
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <Link className="btn-sage text-lg" to={primaryCtaPath}>
                  Begin Your Journey
                </Link>
                <a
                  className="px-8 py-4 font-label-md text-primary transition-colors decoration-2 underline-offset-4 hover:underline dark:text-primary-fixed"
                  href="#reflection"
                >
                  Explore Methodologies
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface px-gutter py-section-gap" data-reveal id="reflection">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-3">
              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl">spa</span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary">Daily Reflections</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant">
                  Gentle prompts designed to help you navigate your inner world with kindness and curiosity.
                </p>
              </div>

              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5" id="energy">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    eco
                  </span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary">Energy Awareness</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant">
                  Monitor your emotional and physical rhythm to optimize your day for natural productivity.
                </p>
              </div>

              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5" id="guidance">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary">Emotional Guidance</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant">
                  AI-assisted tools that provide calming perspectives when you need a moment of clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-background px-gutter py-section-gap" data-reveal>
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10">
              <span className="material-symbols-outlined text-[160px] text-primary">format_quote</span>
            </div>
            <blockquote className="relative z-10">
              <p className="expressive-heading mb-8 text-[40px] leading-tight text-primary md:text-[56px]">
                &quot;MindfulLife helped me find my center amidst the chaos of daily life.&quot;
              </p>
              <footer className="font-label-md text-label-md uppercase tracking-widest text-secondary">- Sarah J.</footer>
            </blockquote>
          </div>
        </section>

        <section className="mb-24 px-gutter pb-section-gap md:mb-32" data-reveal id="about">
          <div className="mx-auto grid h-auto max-w-7xl grid-cols-1 gap-6 md:h-[600px] md:grid-cols-12">
            <div className="min-h-[300px] overflow-hidden rounded-card shadow-lg md:col-span-8">
              <img
                alt="Serene landscape with soft rolling hills"
                className="h-full w-full object-cover grayscale-[20%] transition-all duration-700 hover:grayscale-0"
                src={landscapeUrl}
              />
            </div>
            <div className="grid gap-6 md:col-span-4 md:grid-rows-2">
              <div className="flex min-h-[250px] items-center justify-center overflow-hidden rounded-card bg-primary-container p-8 text-center text-on-primary-container shadow-lg">
                <div>
                  <span className="material-symbols-outlined mb-4 text-5xl">water_drop</span>
                  <h4 className="mb-2 font-headline-sm italic">Fluidity</h4>
                  <p className="text-sm font-label-sm opacity-80">Design that flows with your life&apos;s natural current.</p>
                </div>
              </div>
              <div className="min-h-[250px] overflow-hidden rounded-card shadow-lg">
                <img alt="Macro photograph of leaf" className="h-full w-full object-cover" src={leafUrl} />
              </div>
            </div>
          </div>
        </section>


      </main>

      <footer className="mt-24 bg-surface px-gutter py-16 md:mt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
            <div className="max-w-md">
              <BrandLogo
                className="gap-2"
                iconClassName="h-8 w-8 md:h-9 md:w-9"
                titleClassName="text-xl"
                tone={isDarkMode ? 'light' : 'brand'}
                withWordmark
              />
              <p className="mt-5 font-body-md text-body-md leading-7 text-secondary">
                A calmer digital sanctuary for reflection, energy awareness, and emotional clarity.
              </p>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Explore</p>
              <div className="space-y-3">
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#reflection">
                  Reflection
                </a>
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#energy">
                  Energy
                </a>
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#guidance">
                  Guidance
                </a>
              </div>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Access</p>
              <div className="space-y-3">
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" to="/login">
                  Sign In
                </Link>
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" to="/register">
                  Create Account
                </Link>
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" to="/dashboard">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Stay Grounded</p>
              <p className="font-body-md text-body-md leading-7 text-secondary">
                Begin with one quiet check-in and let the next step become clear.
              </p>
              <Link className="btn-sage mt-6 inline-block" to={primaryCtaPath}>
                Start Your Journey
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="font-label-sm text-label-sm text-secondary">© 2024 MindfulLife. Cultivating digital sanctuary.</p>
            <div className="flex flex-wrap gap-6">
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary" href="#">
                Privacy Policy
              </a>
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary" href="#">
                Terms of Service
              </a>
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary" href="#">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
