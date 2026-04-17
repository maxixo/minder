import '@/styles/pages/review.css';

export default function Review() {
  return (
    <div className="-mx-4 min-h-full bg-[#f6f8f6] font-sans text-slate-900 sm:-mx-6 lg:-mx-8 dark:bg-[#112112] dark:text-slate-100">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden animate-fade-in">
        <div className="flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e1e9e3] bg-white px-6 py-3 sm:px-8 dark:border-white/10 dark:bg-[#112112]">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 text-[#638866]">
                <div className="size-6 text-[#19e62b]">
                  <span className="material-symbols-outlined text-3xl">spa</span>
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-tight text-[#111812] dark:text-white">MindfulLife</h2>
              </div>
              <nav className="hidden items-center gap-9 md:flex">
                <a className="text-sm font-medium text-[#638866] transition-colors hover:text-[#19e62b] dark:text-slate-300" href="#">
                  Daily Focus
                </a>
                <a className="text-sm font-medium text-[#638866] transition-colors hover:text-[#19e62b] dark:text-slate-300" href="#">
                  Reflections
                </a>
                <a className="text-sm font-medium text-[#638866] transition-colors hover:text-[#19e62b] dark:text-slate-300" href="#">
                  Wellness
                </a>
                <a className="text-sm font-medium text-[#638866] transition-colors hover:text-[#19e62b] dark:text-slate-300" href="#">
                  Analytics
                </a>
              </nav>
            </div>

            <div className="flex flex-1 items-center justify-end gap-6">
              <label className="hidden min-w-40 max-w-64 flex-col sm:flex">
                <div className="flex h-10 w-full flex-1 items-stretch rounded-lg">
                  <div className="flex items-center justify-center rounded-l-lg bg-[#f0f4f1] pl-4 text-[#638866] dark:bg-white/5">
                    <span className="material-symbols-outlined text-xl">search</span>
                  </div>
                  <input
                    className="h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-none bg-[#f0f4f1] px-4 pl-2 text-sm font-normal text-[#111812] placeholder:text-[#638866] focus:border-none focus:outline-0 focus:ring-0 dark:bg-white/5 dark:text-white"
                    placeholder="Search insights..."
                    type="text"
                  />
                </div>
              </label>

              <div
                aria-label="User profile avatar"
                className="review-image-blend size-9 rounded-full border-2 border-[#19e62b]/20 bg-cover bg-center bg-no-repeat"
                role="img"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBjwqaFYONwrL1Z7nPtwYTZussHgqeyk7StEZAB6BfNpd_wRcclI_JbA8EAVFCBGJoI_azf6-KJ9xVK8VXPFmo9iQwqLFgSU-3UNEXqZQ72YPGgHbeBNxwc1g6mvIMu_-TVDZ1pu9ro9R6q2GgOx6KoGeJKCZsakcTHnGmZe5Gs_xES1NaduY2MBVjSoxRmAfkWsAuLiooWh4O5oHYve5i2D0KZPccB3sv_7TOfa4ofkyMOzC5U2ze7wovyHw5l-wupiJkLQUJo2gCy")',
                }}
              />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1200px] px-6 py-10">
            <div className="mb-10">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-[#111812] dark:text-white">Daily Focus &amp; Review</h1>
              <p className="mt-2 text-lg font-medium text-[#638866] dark:text-slate-400">
                Monday, June 12th - Cultivating Inner Peace
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <section className="rounded-xl border-l-4 border-[#19e62b] bg-[#f0f4f1] p-8 dark:bg-white/5">
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#638866]">Core Intention</h2>
                  <blockquote className="font-['Lora',serif] text-3xl leading-tight text-[#111812] md:text-4xl dark:text-white">
                    "Practice <span className="italic text-[#19e62b]">mindful presence</span> in every interaction today,
                    listening more than I speak."
                  </blockquote>
                  <div className="mt-6 flex items-center gap-2 text-sm text-[#638866]/70 dark:text-slate-500">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span>Reflect on this during your evening walk.</span>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#111812] dark:text-white">Top Priorities</h2>
                    <span className="rounded bg-[#638866]/10 px-2 py-1 text-xs font-semibold text-[#638866]">Ordered by Impact</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        number: 1,
                        primary: true,
                        text: 'Complete the quarterly impact assessment report',
                      },
                      {
                        number: 2,
                        primary: false,
                        text: 'Conduct the 1:1 strategy session with design lead',
                      },
                      {
                        number: 3,
                        primary: false,
                        text: 'Review and finalize the nature-inspired UI components',
                      },
                      {
                        number: 4,
                        primary: false,
                        text: 'Draft initial thoughts for the wellness workshop',
                      },
                      {
                        number: 5,
                        primary: false,
                        text: 'Coordinate logistics for the team retreat',
                      },
                    ].map((item) => (
                      <div
                        key={item.number}
                        className="group flex items-center gap-4 rounded-lg border border-[#e1e9e3] bg-white p-4 transition-all hover:border-[#19e62b]/50 dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="material-symbols-outlined cursor-grab text-[#638866]/40 transition-colors group-hover:text-[#19e62b]">
                          drag_indicator
                        </span>
                        <span
                          className={
                            item.primary
                              ? 'flex size-6 items-center justify-center rounded-full bg-[#19e62b]/20 text-xs font-bold text-[#19e62b]'
                              : 'flex size-6 items-center justify-center rounded-full bg-[#e1e9e3] text-xs font-bold text-[#638866] dark:bg-white/10'
                          }
                        >
                          {item.number}
                        </span>
                        <p className="font-medium text-[#111812] dark:text-white">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <section className="rounded-xl border border-[#e1e9e3] bg-white p-6 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#111812] dark:text-white">Daily Tasks</h2>
                    <button className="text-[#19e62b] hover:text-[#19e62b]/80" type="button">
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#19e62b] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0"
                        defaultChecked
                        type="checkbox"
                      />
                      <span className="font-medium text-[#638866]/60 line-through decoration-2 decoration-[#19e62b]/50 transition-all">
                        Morning 15-min meditation session
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#19e62b] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0"
                        defaultChecked
                        type="checkbox"
                      />
                      <span className="font-medium text-[#638866]/60 line-through decoration-2 decoration-[#19e62b]/50 transition-all">
                        Water intake: 1/2 gallon
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#e1e9e3] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0 dark:border-white/20"
                        type="checkbox"
                      />
                      <span className="text-[#111812] transition-colors group-hover:text-[#19e62b] dark:text-white">Submit expense reports</span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#e1e9e3] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0 dark:border-white/20"
                        type="checkbox"
                      />
                      <span className="text-[#111812] transition-colors group-hover:text-[#19e62b] dark:text-white">
                        Call the botanical nursery for stock check
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#e1e9e3] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0 dark:border-white/20"
                        type="checkbox"
                      />
                      <span className="text-[#111812] transition-colors group-hover:text-[#19e62b] dark:text-white">
                        Read 20 pages of "The Nature Fix"
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        className="size-5 rounded-full border-2 border-[#e1e9e3] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0 dark:border-white/20"
                        type="checkbox"
                      />
                      <span className="text-[#111812] transition-colors group-hover:text-[#19e62b] dark:text-white">
                        Stretch for 10 minutes before bed
                      </span>
                    </label>
                  </div>
                </section>

                <section className="flex h-full grow flex-col">
                  <h2 className="mb-4 text-xl font-bold text-[#111812] dark:text-white">Mindfulness Notes &amp; Ideas</h2>
                  <div className="review-dot-grid min-h-[300px] flex-1 rounded-xl border border-[#e1e9e3] bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <textarea
                      className="h-full w-full resize-none border-none bg-transparent font-['Lora',serif] text-lg leading-relaxed text-[#111812] placeholder:text-[#638866]/30 focus:ring-0 dark:text-white"
                      placeholder="Let your thoughts flow here..."
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-[#e1e9e3] pt-8 md:flex-row dark:border-white/10">
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-2xl font-black text-[#19e62b]">2</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-[#638866]">4</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black italic text-[#638866]/40">80%</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Energy Level</p>
                </div>
              </div>

              <button
                className="flex items-center gap-2 rounded-xl bg-[#19e62b] px-8 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#19e62b]/20"
                type="button"
              >
                <span className="material-symbols-outlined">check_circle</span>
                Complete Daily Review
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
