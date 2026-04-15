import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

const statCards = [
  {
    title: 'Current Streak',
    value: '12 Days',
    icon: 'local_fire_department',
    iconClassName: 'text-orange-500',
    detail: '+2 from last week',
    trendIcon: 'trending_up',
    trendClassName: 'text-emerald-600',
  },
  {
    title: 'Mood Average',
    value: 'Calm',
    icon: 'sentiment_satisfied',
    iconClassName: 'text-blue-400',
    detail: 'Consistent for 5 days',
    trendIcon: null,
    trendClassName: 'text-slate-400',
  },
  {
    title: 'Completion',
    value: '85%',
    icon: 'task_alt',
    iconClassName: 'text-sage-600',
    detail: '+5% overall improvement',
    trendIcon: 'trending_up',
    trendClassName: 'text-emerald-600',
  },
];

const journalEntries = [
  {
    title: 'Morning Serenity',
    excerpt: '"I felt connected during my garden walk..."',
    time: 'Today, 8:30 AM',
    icon: 'filter_drama',
    accentClassName: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Productive Energy',
    excerpt: '"Grateful for the focused hours today..."',
    time: 'Yesterday, 9:15 PM',
    icon: 'wb_sunny',
    accentClassName: 'bg-amber-50 text-amber-600',
  },
];

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const quickActions = [
  {
    label: "Today's Reflection",
    icon: 'edit_note',
    to: '/reflection',
    className: 'bg-sage-600 text-white shadow-lg shadow-sage-600/20 hover:bg-sage-700 hover:shadow-sage-600/30',
  },
  {
    label: 'Self-Care Check',
    icon: 'self_care',
    to: '/selfcare',
    className: 'border border-sage-200 bg-white text-sage-700 hover:bg-sage-50',
  },
];

export default function WellnessOverview() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8 flex flex-col gap-3 rounded-[2rem] border border-sage-200/80 bg-white/80 px-6 py-5 shadow-soft backdrop-blur-sm sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-500">Wellness Dashboard</p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold text-sage-800 sm:text-5xl">Welcome back, {firstName}.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-sage-700 sm:text-base">
              Your emotional wellness snapshot brings together reflection, streaks, and the small rituals keeping you grounded this week.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-2 text-sm font-medium text-sage-700">
            <span className="material-symbols-outlined text-base">air</span>
            Breathe. Notice. Begin again.
          </div>
        </div>
      </div>

      <section className="mb-10 overflow-hidden rounded-[2rem] border border-sage-200 bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-sage-200/80 bg-sage-600/10 px-6 py-12 text-center sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(94, 120, 96, 0.95) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
            <span className="material-symbols-outlined mb-4 text-4xl text-sage-600/70">format_quote</span>
            <h2 className="font-display text-3xl italic leading-tight text-sage-900 sm:text-4xl lg:text-5xl">
              &quot;Nature does not hurry, yet everything is accomplished.&quot;
            </h2>
            <p className="mt-5 text-base font-semibold tracking-[0.24em] text-sage-700">LAO TZU</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-600 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-sage-700 hover:shadow-lifted"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">favorite</span>
                Save to Favorites
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-bold text-sage-700 transition-all hover:bg-sage-50"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-sage-100 bg-white p-7 shadow-soft transition-shadow hover:shadow-lifted"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage-500">{card.title}</p>
              <span className={`material-symbols-outlined text-2xl ${card.iconClassName}`}>{card.icon}</span>
            </div>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{card.value}</p>
            {card.trendIcon ? (
              <div className={`mt-3 flex items-center gap-1 text-sm font-bold ${card.trendClassName}`}>
                <span className="material-symbols-outlined text-base">{card.trendIcon}</span>
                <span>{card.detail}</span>
              </div>
            ) : (
              <p className={`mt-3 text-sm font-medium ${card.trendClassName}`}>{card.detail}</p>
            )}
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Weekly Emotional Wellness</h2>
                <p className="mt-1 text-sm text-sage-600">A soft snapshot of the rhythms shaping your week.</p>
              </div>
              <select className="rounded-full border border-sage-200 bg-white px-4 py-2 text-sm text-sage-700 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-100">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>

            <div className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-7">
              <div className="flex h-72 flex-col">
                <div className="relative mt-2 flex-1">
                  <svg className="h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 478 150" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z"
                      fill="url(#wellness-gradient)"
                    />
                    <path
                      d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 110 363.077 110C381.231 110 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                      stroke="#5e7860"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <defs>
                      <linearGradient id="wellness-gradient" x1="236" x2="236" y1="1" y2="149" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5e7860" stopOpacity="0.3" />
                        <stop offset="1" stopColor="#5e7860" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex justify-between px-2 pt-4">
                  {weekdays.map((day) => (
                    <p key={day} className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                      {day}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Recent Journal Entries</h2>
                <p className="mt-1 text-sm text-sage-600">Return to the moments that shaped your recent reflections.</p>
              </div>
              <Link className="text-sm font-semibold text-sage-700 transition-colors hover:text-sage-900" to="/review">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <article
                  key={entry.title}
                  className="group flex flex-col justify-between gap-4 rounded-[1.75rem] border border-sage-100 bg-white p-5 shadow-soft transition-all hover:border-sage-300 hover:shadow-lifted sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${entry.accentClassName}`}>
                      <span className="material-symbols-outlined">{entry.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{entry.title}</h3>
                      <p className="text-sm text-slate-500">{entry.excerpt}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{entry.time}</p>
                    <span className="material-symbols-outlined text-slate-300 transition-colors group-hover:text-sage-600">chevron_right</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-sage-200/80 bg-gradient-to-b from-sage-100/80 to-white p-8 text-center shadow-soft">
            <h2 className="font-display text-3xl font-semibold text-sage-700">How are you truly?</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">
              Taking a moment to check in with yourself is the first step toward steadiness and balance.
            </p>

            <div className="mt-8 space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-bold transition-all ${action.className}`}
                  to={action.to}
                >
                  <span className="material-symbols-outlined">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Daily Mindful Tip</h2>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
                <span className="material-symbols-outlined text-xl">air</span>
              </div>
              <p className="text-sm italic leading-7 text-slate-700">
                &quot;Try the 4-7-8 breathing technique before starting your next task to reset your nervous system.&quot;
              </p>
            </div>
          </section>

          <section className="group relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-200 shadow-soft">
            <img
              alt="Sunlight streaming through a dense green forest"
              className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-700 group-hover:scale-100"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBItI64Ljuqq5JnU3kiSCpUF0IV-eva6CMFskI_cQx5KYA_2S3KLM1LmsI4_YKSEwjOykN0gejCOUA7dA2ReO3psRI-ZBhhg7Q92EmpgEMxC6uHjcADzP_DItbGPvtGpxIFMT4Xl_4RVGLb-w6gsHMAxW2RKShGfy7SosiMWi1cO7OnusJDUX9y-o44sdRa0aDdxg2GS5xiqmmD9iZxscYq8TwrBXcXUINVCLemEFATy8ZbKGmwP3deMwOoeDNd3NreKdP_Be3VqCXY"
            />
            <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 text-white">
              <p className="text-lg font-bold leading-tight">Guided Meditation: Forest Path</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/80">12 min - Sage Greenwood</p>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-12 rounded-[1.75rem] border border-sage-200/80 bg-white/80 px-6 py-8 shadow-soft backdrop-blur-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sage-600">
            <span className="material-symbols-outlined text-2xl">eco</span>
            <p className="font-display text-xl font-semibold">MindfulLife</p>
          </div>
          <p className="text-sm text-slate-500">© 2024 MindfulLife App. Cultivating peace, one breath at a time.</p>
          <div className="flex gap-4 text-slate-400">
            <button className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700" type="button">
              <span className="material-symbols-outlined">language</span>
            </button>
            <button className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700" type="button">
              <span className="material-symbols-outlined">share</span>
            </button>
            <Link className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700" to="/settings">
              <span className="material-symbols-outlined">settings</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
