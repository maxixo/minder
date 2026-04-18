import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import type { DailyEntryPatch, EntryTodoItem } from '@/types/entry';
import '@/styles/pages/review.css';

const createEmptyTask = (): EntryTodoItem => ({ text: '', completed: false });

const sanitizePriorities = (priorities: string[]) => priorities.map((item) => item.trim()).filter(Boolean);
const sanitizeTasks = (tasks: EntryTodoItem[]) => tasks.map((task) => ({ ...task, text: task.text.trim() })).filter((task) => task.text);

export default function Review() {
  const { user } = useAuth();
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [focus, setFocus] = useState('');
  const [priorities, setPriorities] = useState<string[]>(['']);
  const [tasks, setTasks] = useState<EntryTodoItem[]>([createEmptyTask()]);
  const [mindfulnessNotes, setMindfulnessNotes] = useState('');

  const reviewDateLabel = useMemo(
    () => format(new Date(entry?.date || new Date()), 'EEEE, MMMM do'),
    [entry?.date]
  );

  const initials = useMemo(() => (user?.name || 'Mindful Life')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(' '), [user?.name]);

  useEffect(() => {
    if (!entry) return;

    setFocus(entry.focus || '');
    setPriorities(entry.priorities?.length ? entry.priorities : ['']);
    setTasks(entry.todoList?.length ? entry.todoList : [createEmptyTask()]);
    setMindfulnessNotes(entry.mindfulnessNotes || '');
  }, [entry]);

  const updatePriority = (index: number, value: string) => {
    setPriorities((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addPriority = () => {
    setPriorities((current) => [...current, '']);
  };

  const removePriority = (index: number) => {
    setPriorities((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [''];
    });
  };

  const movePriority = (index: number, direction: -1 | 1) => {
    setPriorities((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateTask = (index: number, patch: Partial<EntryTodoItem>) => {
    setTasks((current) => current.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  };

  const addTask = () => {
    setTasks((current) => [...current, createEmptyTask()]);
  };

  const removeTask = (index: number) => {
    setTasks((current) => {
      const next = current.filter((_, taskIndex) => taskIndex !== index);
      return next.length ? next : [createEmptyTask()];
    });
  };

  const moveTask = (index: number, direction: -1 | 1) => {
    setTasks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    const patch: DailyEntryPatch = {
      focus: focus.trim(),
      priorities: sanitizePriorities(priorities),
      todoList: sanitizeTasks(tasks),
      mindfulnessNotes: mindfulnessNotes.trim(),
    };

    try {
      await saveEntryPatch(patch, 'review');
      toast.success('Daily review saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save daily review');
    }
  };

  const completedTasks = tasks.filter((task) => task.completed && task.text.trim()).length;
  const remainingTasks = tasks.filter((task) => !task.completed && task.text.trim()).length;
  const energyLevel = entry?.ratings?.energyPoint ? `${entry.ratings.energyPoint * 20}%` : '0%';

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

              {user?.avatar ? (
                <div
                  aria-label="User profile avatar"
                  className="review-image-blend size-9 rounded-full border-2 border-[#19e62b]/20 bg-cover bg-center bg-no-repeat"
                  role="img"
                  style={{ backgroundImage: `url("${user.avatar}")` }}
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#19e62b]/20 bg-[#19e62b]/10 text-[10px] font-semibold text-[#111812] dark:text-white">
                  {initials}
                </div>
              )}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1200px] px-6 py-10">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-[#111812] dark:text-white">Daily Focus &amp; Review</h1>
                <p className="mt-2 text-lg font-medium text-[#638866] dark:text-slate-400">{reviewDateLabel} - A more intentional close to the day</p>
              </div>

              <button
                className="flex items-center gap-2 rounded-xl bg-[#19e62b] px-8 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#19e62b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading || saving}
                onClick={handleSave}
                type="button"
              >
                <span className="material-symbols-outlined">check_circle</span>
                {saving ? 'Saving Review...' : 'Complete Daily Review'}
              </button>
            </div>

            {loading ? (
              <div className="mb-6 rounded-xl border border-[#e1e9e3] bg-white px-5 py-4 text-sm font-medium text-[#638866] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Loading today&apos;s review...
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <section className="rounded-xl border-l-4 border-[#19e62b] bg-[#f0f4f1] p-8 dark:bg-white/5">
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#638866]">Core Intention</h2>
                  <textarea
                    className="min-h-[140px] w-full resize-none border-none bg-transparent font-['Lora',serif] text-3xl leading-tight text-[#111812] placeholder:text-[#638866]/50 focus:ring-0 md:text-4xl dark:text-white"
                    onChange={(event) => setFocus(event.target.value)}
                    placeholder="Write the one thought you want to carry through the day..."
                    value={focus}
                  />
                  <div className="mt-6 flex items-center gap-2 text-sm text-[#638866]/70 dark:text-slate-500">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span>Keep this short enough to revisit when the day gets noisy.</span>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#111812] dark:text-white">Top Priorities</h2>
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[#638866]/10 px-2 py-1 text-xs font-semibold text-[#638866]">Ordered by Impact</span>
                      <button className="text-[#19e62b] hover:text-[#19e62b]/80" onClick={addPriority} type="button">
                        <span className="material-symbols-outlined">add_circle</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {priorities.map((priority, index) => {
                      const isPrimary = index === 0;

                      return (
                        <div
                          key={`priority-${index + 1}`}
                          className="group flex items-center gap-4 rounded-lg border border-[#e1e9e3] bg-white p-4 transition-all hover:border-[#19e62b]/50 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex flex-col gap-1 text-[#638866]/60">
                            <button className="leading-none hover:text-[#19e62b]" onClick={() => movePriority(index, -1)} type="button">
                              <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
                            </button>
                            <button className="leading-none hover:text-[#19e62b]" onClick={() => movePriority(index, 1)} type="button">
                              <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                            </button>
                          </div>
                          <span
                            className={
                              isPrimary
                                ? 'flex size-6 items-center justify-center rounded-full bg-[#19e62b]/20 text-xs font-bold text-[#19e62b]'
                                : 'flex size-6 items-center justify-center rounded-full bg-[#e1e9e3] text-xs font-bold text-[#638866] dark:bg-white/10'
                            }
                          >
                            {index + 1}
                          </span>
                          <input
                            className="flex-1 border-none bg-transparent font-medium text-[#111812] outline-none placeholder:text-[#638866]/40 dark:text-white"
                            onChange={(event) => updatePriority(index, event.target.value)}
                            placeholder={`Priority ${index + 1}`}
                            type="text"
                            value={priority}
                          />
                          <button className="text-[#638866]/60 transition-colors hover:text-red-500" onClick={() => removePriority(index)} type="button">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <section className="rounded-xl border border-[#e1e9e3] bg-white p-6 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#111812] dark:text-white">Daily Tasks</h2>
                    <button className="text-[#19e62b] hover:text-[#19e62b]/80" onClick={addTask} type="button">
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tasks.map((task, index) => {
                      const textClassName = task.completed
                        ? 'font-medium text-[#638866]/60 line-through decoration-2 decoration-[#19e62b]/50 transition-all'
                        : 'text-[#111812] transition-colors group-hover:text-[#19e62b] dark:text-white';

                      return (
                        <div key={task._id || `task-${index + 1}`} className="group flex items-center gap-3">
                          <input
                            checked={task.completed}
                            className="size-5 rounded-full border-2 border-[#19e62b] bg-transparent text-[#19e62b] focus:ring-[#19e62b] focus:ring-offset-0"
                            onChange={(event) => updateTask(index, { completed: event.target.checked })}
                            type="checkbox"
                          />
                          <input
                            className={`flex-1 border-none bg-transparent outline-none placeholder:text-[#638866]/40 ${textClassName}`}
                            onChange={(event) => updateTask(index, { text: event.target.value })}
                            placeholder={`Task ${index + 1}`}
                            type="text"
                            value={task.text}
                          />
                          <div className="flex items-center gap-1 text-[#638866]/60">
                            <button className="leading-none hover:text-[#19e62b]" onClick={() => moveTask(index, -1)} type="button">
                              <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
                            </button>
                            <button className="leading-none hover:text-[#19e62b]" onClick={() => moveTask(index, 1)} type="button">
                              <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                            </button>
                            <button className="leading-none hover:text-red-500" onClick={() => removeTask(index)} type="button">
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="flex h-full grow flex-col">
                  <h2 className="mb-4 text-xl font-bold text-[#111812] dark:text-white">Mindfulness Notes &amp; Ideas</h2>
                  <div className="review-dot-grid min-h-[300px] flex-1 rounded-xl border border-[#e1e9e3] bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <textarea
                      className="h-full w-full resize-none border-none bg-transparent font-['Lora',serif] text-lg leading-relaxed text-[#111812] placeholder:text-[#638866]/30 focus:ring-0 dark:text-white"
                      onChange={(event) => setMindfulnessNotes(event.target.value)}
                      placeholder="Let your thoughts flow here..."
                      value={mindfulnessNotes}
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-[#e1e9e3] pt-8 md:flex-row dark:border-white/10">
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-2xl font-black text-[#19e62b]">{completedTasks}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-[#638866]">{remainingTasks}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black italic text-[#638866]/60">{energyLevel}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#638866]">Energy Level</p>
                </div>
              </div>

              <button
                className="flex items-center gap-2 rounded-xl bg-[#19e62b] px-8 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#19e62b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading || saving}
                onClick={handleSave}
                type="button"
              >
                <span className="material-symbols-outlined">check_circle</span>
                {saving ? 'Saving Review...' : 'Complete Daily Review'}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
