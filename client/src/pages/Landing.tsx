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
const previewMoodBars = [4.1, 3.6, 4.4, 4.8, 4.2, 4.7, 4.5];
const planFeatures = [
  {
    name: 'Free',
    eyebrow: 'Start the habit',
    cta: 'Start Free',
    items: [
      'Daily reflection and self-care check-ins',
      'Emotional guidance and coping tools',
      'Basic reminder support',
      'Recent journal history',
    ],
  },
  {
    name: 'Premium',
    eyebrow: 'See the pattern',
    cta: 'Unlock insights',
    items: [
      'Advanced analytics and weekly summaries',
      'AI-powered reflection insights',
      'Longer history and trend comparisons',
      'Premium daily wellness quotes',
      'Exportable wellness reports',
    ],
  },
] as const;
const firstWeekMoments = [
  {
    day: 'Day 1',
    title: 'Set your baseline',
    copy: 'Log one honest reflection and choose the reminder rhythm that fits your real life.',
  },
  {
    day: 'Day 3',
    title: 'Notice the first pattern',
    copy: 'Your check-ins start showing where your energy dips and what steadies it.',
  },
  {
    day: 'Day 7',
    title: 'Get a weekly read',
    copy: 'See your mood trend, recent consistency, and the habits that tend to support calmer days.',
  },
] as const;
const testimonials = [
  {
    quote: 'For the first time, I could see which routines actually helped before I burned out.',
    author: 'Maya, graduate student',
  },
  {
    quote: 'The weekly summary made my journal feel useful instead of buried in old notes.',
    author: 'Jordan, product designer',
  },
  {
    quote: 'It gave me a low-pressure way to check in daily without feeling like another task.',
    author: 'Elena, new parent',
  },
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
      className="flex min-h-screen flex-col bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed dark:bg-sage-700 dark:text-white"
      ref={pageRef}
    >
      <nav className={`fixed left-0 top-0 z-50 w-full border-b border-primary/10 bg-white/30 backdrop-blur-sm transition-all duration-300 dark:border-white/10 dark:bg-[#15201a]/70 ${isScrolled ? 'py-2 shadow-sm dark:shadow-black/20' : 'py-4'}`}>
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
          <div className="pointer-events-none absolute bottom-0 left-0 z-[1] p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860] dark:text-sage-300/70">eco</span>
          </div>
          <div className="pointer-events-none absolute right-0 top-20 z-[1] p-10 opacity-20 dark:opacity-10">
            <span className="material-symbols-outlined text-9xl text-[#5e7860] dark:text-sage-300/70">psychiatry</span>
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-gutter">
            <div className="glass-hero rounded-[40px] p-8 shadow-2xl shadow-primary/10 md:p-12 lg:p-16">
              <div className="grid items-center gap-12">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:border-white/10 dark:bg-white/10 dark:text-sage-100">
                    <span className="material-symbols-outlined text-sm">monitor_heart</span>
                    5-minute daily wellness check-in
                  </div>
                  <h1 className="animate-fade-in-up expressive-heading type-scale-h1 mt-6 text-primary dark:text-white">
                    Notice your mood, energy, and habits before the week runs away from you.
                  </h1>
                  <p className="type-scale-p mt-6 max-w-2xl font-label-sm text-secondary dark:text-sage-50">
                    MindfulLife helps you log one honest check-in a day, then turns it into clear weekly patterns so you can feel steadier and respond earlier.
                  </p>
                  <div className="mt-10">
                    <Link className="btn-sage text-lg" to={primaryCtaPath}>
                      Start Free
                    </Link>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-secondary dark:text-sage-100 lg:justify-start">
                    <span>No card required</span>
                    <span className="hidden h-1 w-1 rounded-full bg-primary/30 sm:block dark:bg-white/20" />
                    <span>First reflection in under 5 minutes</span>
                  </div>
                </div>

                <div className="landing-preview-shell">
                  <div className="landing-preview-frame">
                    <div className="landing-preview-header">
                      <div>
                        <p className="landing-preview-eyebrow">This week at a glance</p>
                        <h2 className="landing-preview-title">A calmer daily rhythm</h2>
                      </div>
                      <div className="landing-preview-badge">Preview</div>
                    </div>

                    <div className="landing-preview-stats">
                      <article className="landing-preview-stat-card">
                        <span className="material-symbols-outlined text-[20px] text-sage-600 dark:text-sage-200">local_fire_department</span>
                        <p className="landing-preview-stat-value">6 days</p>
                        <p className="landing-preview-stat-label">Current streak</p>
                      </article>
                      <article className="landing-preview-stat-card">
                        <span className="material-symbols-outlined text-[20px] text-sage-600 dark:text-sage-200">favorite</span>
                        <p className="landing-preview-stat-value">4.4 / 5</p>
                        <p className="landing-preview-stat-label">Mood average</p>
                      </article>
                    </div>

                    <div className="landing-preview-chart-card">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="landing-preview-card-label">Weekly emotional wellness</p>
                          <p className="landing-preview-card-title">Mood pattern</p>
                        </div>
                        <div className="landing-preview-card-pill">7 days</div>
                      </div>
                      <div className="landing-preview-bars" aria-hidden="true">
                        {previewMoodBars.map((value, index) => (
                          <div className="landing-preview-bar-group" key={`preview-mood-${index + 1}`}>
                            <div className="landing-preview-bar-track">
                              <div
                                className="landing-preview-bar-fill"
                                style={{ height: `${(value / 5) * 100}%` }}
                              />
                            </div>
                            <span className="landing-preview-bar-label">
                              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="landing-preview-insight">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                          <span className="material-symbols-outlined text-[20px]">insights</span>
                        </div>
                        <div>
                          <p className="landing-preview-card-label">What premium unlocks</p>
                          <p className="landing-preview-card-title">Weekly insight summary</p>
                          <p className="landing-preview-card-copy">
                            Your most grounded days followed reflection + fresh air. Premium surfaces those patterns automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface px-gutter py-section-gap dark:bg-sage-700" data-reveal id="reflection">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-3">
              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5 dark:bg-sage-600 dark:hover:bg-sage-500">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110 dark:bg-sage-500/30 dark:text-white">
                  <span className="material-symbols-outlined text-3xl">spa</span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary dark:text-white">Daily Reflections</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant dark:text-sage-50">
                  Gentle prompts designed to help you navigate your inner world with kindness and curiosity.
                </p>
              </div>

              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5 dark:bg-sage-600 dark:hover:bg-sage-500" id="energy">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110 dark:bg-sage-500/30 dark:text-white">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    eco
                  </span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary dark:text-white">Energy Awareness</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant dark:text-sage-50">
                  Monitor your emotional and physical rhythm to optimize your day for natural productivity.
                </p>
              </div>

              <div className="group rounded-card bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container-highest hover:shadow-2xl hover:shadow-primary/5 dark:bg-sage-600 dark:hover:bg-sage-500" id="guidance">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform duration-500 group-hover:scale-110 dark:bg-sage-500/30 dark:text-white">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="mb-4 font-headline-sm text-headline-sm italic text-primary dark:text-white">Emotional Guidance</h3>
                <p className="font-label-sm text-label-sm leading-loose text-on-surface-variant dark:text-sage-50">
                  AI-assisted tools that provide calming perspectives when you need a moment of clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-background px-gutter py-section-gap dark:bg-sage-700" data-reveal>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <p className="font-label-md text-label-md uppercase tracking-[0.24em] text-primary dark:text-primary-fixed">What you get after one week</p>
              <h2 className="mt-4 expressive-heading text-[40px] leading-tight text-primary dark:text-white md:text-[52px]">
                A calmer picture of how your week actually felt.
              </h2>
              <p className="mx-auto mt-4 max-w-3xl font-body-md text-body-md leading-7 text-secondary dark:text-sage-50">
                The goal is not to write perfectly. The goal is to check in often enough that your patterns become visible and useful.
              </p>
            </div>

            <div className="landing-week-grid">
              {firstWeekMoments.map((moment) => (
                <article className="landing-week-card" key={moment.day}>
                  <div className="landing-week-badge">{moment.day}</div>
                  <h3 className="landing-week-title">{moment.title}</h3>
                  <p className="landing-week-copy">{moment.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface px-gutter py-section-gap dark:bg-sage-700" data-reveal>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-label-md text-label-md uppercase tracking-[0.24em] text-primary dark:text-primary-fixed">Choose your pace</p>
                <h2 className="mt-4 expressive-heading text-[38px] leading-tight text-primary dark:text-white md:text-[48px]">
                  Start with reflection. Upgrade when you want deeper clarity.
                </h2>
              </div>
              <p className="max-w-xl font-body-md text-body-md leading-7 text-secondary dark:text-sage-50">
                Keep the daily habit free. Unlock premium when you want trend detection, richer summaries, and reports that make the practice easier to sustain.
              </p>
            </div>

            <div className="landing-plan-grid">
              {planFeatures.map((plan, index) => (
                <article
                  className={`landing-plan-card ${index === 1 ? 'landing-plan-card-featured' : ''}`}
                  key={plan.name}
                >
                  <p className="landing-plan-eyebrow">{plan.eyebrow}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <h3 className="landing-plan-name">{plan.name}</h3>
                    {index === 1 ? <span className="landing-plan-pill">Best for insight</span> : null}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.items.map((item) => (
                      <li className="landing-plan-item" key={item}>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className={`mt-8 inline-flex ${index === 1 ? 'btn-sage' : 'landing-plan-secondary'}`} to={primaryCtaPath}>
                    {plan.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-background px-gutter py-section-gap dark:bg-sage-700" data-reveal>
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <p className="font-label-md text-label-md uppercase tracking-[0.24em] text-primary dark:text-primary-fixed">Why people stay</p>
              <h2 className="mt-4 expressive-heading text-[40px] leading-tight text-primary dark:text-white md:text-[52px]">
                It feels less like keeping up and more like finally noticing.
              </h2>
            </div>

            <div className="landing-testimonial-grid">
              {testimonials.map((testimonial, index) => (
                <article className="landing-testimonial-card" key={`${testimonial.author}-${index + 1}`}>
                  <span className="material-symbols-outlined landing-testimonial-quote">format_quote</span>
                  <p className="landing-testimonial-copy">&quot;{testimonial.quote}&quot;</p>
                  <p className="landing-testimonial-author">{testimonial.author}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-24 bg-background px-gutter pb-section-gap dark:bg-sage-700 md:mb-32" data-reveal id="about">
          <div className="mx-auto grid h-auto max-w-7xl grid-cols-1 gap-6 md:h-[600px] md:grid-cols-12">
            <div className="min-h-[300px] overflow-hidden rounded-card shadow-lg md:col-span-8">
              <img
                alt="Serene landscape with soft rolling hills"
                className="h-full w-full object-cover grayscale-[20%] transition-all duration-700 hover:grayscale-0"
                src={landscapeUrl}
              />
            </div>
            <div className="grid gap-6 md:col-span-4 md:grid-rows-2">
              <div className="flex min-h-[250px] items-center justify-center overflow-hidden rounded-card bg-primary-container p-8 text-center text-on-primary-container shadow-lg dark:bg-sage-500 dark:text-white">
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

      <footer className="mt-24 bg-surface px-gutter py-16 dark:bg-sage-700 md:mt-32">
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
              <p className="mt-5 font-body-md text-body-md leading-7 text-secondary dark:text-sage-50">
                A calmer digital sanctuary for reflection, energy awareness, and emotional clarity.
              </p>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Explore</p>
              <div className="space-y-3">
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#reflection">
                  Reflection
                </a>
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#energy">
                  Energy
                </a>
                <a className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#guidance">
                  Guidance
                </a>
              </div>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Access</p>
              <div className="space-y-3">
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" to="/login">
                  Sign In
                </Link>
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" to="/register">
                  Create Account
                </Link>
                <Link className="block font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" to="/dashboard">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 font-label-md text-label-md uppercase tracking-[0.16em] text-primary">Stay Grounded</p>
              <p className="font-body-md text-body-md leading-7 text-secondary dark:text-sage-50">
                Begin with one quiet check-in and let the next step become clear.
              </p>
              <Link className="btn-sage mt-6 inline-block" to={primaryCtaPath}>
                Start Your Journey
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="font-label-sm text-label-sm text-secondary dark:text-sage-50">© 2024 MindfulLife. Cultivating digital sanctuary.</p>
            <div className="flex flex-wrap gap-6">
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#">
                Privacy Policy
              </a>
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#">
                Terms of Service
              </a>
              <a className="font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 transition-colors hover:text-primary dark:text-sage-50 dark:hover:text-primary-fixed" href="#">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
