import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import ProfileMenu from '@/components/common/ProfileMenu';
import type { DailyEntryPatch, EntryTodoItem } from '@/types/entry';

const createEmptyTask = (): EntryTodoItem => ({ text: '', completed: false });

const sanitizePriorities = (priorities: string[]) => priorities.map((item) => item.trim()).filter(Boolean);
const sanitizeTasks = (tasks: EntryTodoItem[]) => tasks.map((task) => ({ ...task, text: task.text.trim() })).filter((task) => task.text);

export default function Review() {
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [focus, setFocus] = useState('');
  const [priorities, setPriorities] = useState<string[]>(['']);
  const [tasks, setTasks] = useState<EntryTodoItem[]>([createEmptyTask()]);
  const [mindfulnessNotes, setMindfulnessNotes] = useState('');

  const reviewDateLabel = useMemo(() => format(new Date(entry?.date || new Date()), 'EEE, MMM d, yyyy'), [entry?.date]);

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
    <div className="daily-reflection-scrollbar animate-fade-in pb-10 transition-colors text-[#3a523e] dark:text-sage-50">
      <header className="mb-6 border-b border-[#e8ede8] bg-white/80 px-4 py-4 backdrop-blur-md lg:sticky lg:top-0 lg:z-20 dark:border-white/10 dark:bg-[#15201a]/90">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#638869] dark:text-sage-300">Review Space</p>
            <h1 className="mt-1 text-2xl font-black text-[#3a523e] sm:text-3xl dark:text-sage-50">Journal Review</h1>
          </div>

          <div className="rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-2 text-sm font-semibold text-[#3a523e] dark:border-white/10 dark:bg-white/5 dark:text-sage-100">
            {reviewDateLabel}
          </div>

          <ProfileMenu />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 py-2">
        <section className="rounded-xl border border-[#e8ede8] bg-white px-6 py-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#3a523e] dark:text-sage-50">Daily Focus &amp; Review</h2>
              <p className="mt-1 text-sm text-[#638869] dark:text-sage-200">A more intentional close to the day.</p>
            </div>
            <button
              className="flex items-center gap-2 rounded-full bg-[#19e63c] px-6 py-3 text-sm font-bold text-[#3a523e] shadow-lg shadow-[#19e63c]/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || saving}
              onClick={handleSave}
              type="button"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {saving ? 'Saving Review...' : 'Save Review'}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-6 py-4 text-sm font-medium text-[#638869] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sage-200">
            Loading review...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-800 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">center_focus_strong</span>
                <h3 className="text-xl font-bold">Core Intention</h3>
              </div>
              <textarea
                className="min-h-[140px] w-full resize-none rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-3 text-xl leading-tight text-[#3a523e] outline-none placeholder:text-[#638869]/60 focus:border-[#19e63c] dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                onChange={(event) => setFocus(event.target.value)}
                placeholder="Write the one thought you want to carry through the day..."
                value={focus}
              />
              <p className="mt-4 text-sm text-[#638869] dark:text-sage-300">Keep this short enough to revisit when the day gets noisy.</p>
            </section>

            <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Top Priorities</h3>
                <button className="text-[#19e63c] hover:text-[#15c733]" onClick={addPriority} type="button">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>

              <div className="space-y-3">
                {priorities.map((priority, index) => (
                  <div
                    key={`priority-${index + 1}`}
                    className="group flex items-center gap-3 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] p-4 dark:border-white/10 dark:bg-[#101915]"
                  >
                    <div className="flex flex-col gap-1 text-[#638869]/70">
                      <button className="leading-none hover:text-[#19e63c]" onClick={() => movePriority(index, -1)} type="button">
                        <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
                      </button>
                      <button className="leading-none hover:text-[#19e63c]" onClick={() => movePriority(index, 1)} type="button">
                        <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                      </button>
                    </div>
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#19e63c]/20 text-xs font-bold text-[#1a7f2e]">{index + 1}</span>
                    <input
                      className="flex-1 border-none bg-transparent text-[#3a523e] outline-none placeholder:text-[#638869]/50 dark:text-sage-50"
                      onChange={(event) => updatePriority(index, event.target.value)}
                      placeholder={`Priority ${index + 1}`}
                      type="text"
                      value={priority}
                    />
                    <button className="text-[#638869]/70 transition-colors hover:text-rose-500" onClick={() => removePriority(index)} type="button">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8 lg:col-span-5">
            <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Daily Tasks</h3>
                <button className="text-[#19e63c] hover:text-[#15c733]" onClick={addTask} type="button">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div
                    key={task._id || `task-${index + 1}`}
                    className="group flex items-center gap-3 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] p-3 dark:border-white/10 dark:bg-[#101915]"
                  >
                    <input
                      checked={task.completed}
                      className="size-5 rounded-full border-2 border-[#19e63c] bg-transparent text-[#19e63c] focus:ring-[#19e63c] focus:ring-offset-0"
                      onChange={(event) => updateTask(index, { completed: event.target.checked })}
                      type="checkbox"
                    />
                    <input
                      className={`flex-1 border-none bg-transparent outline-none placeholder:text-[#638869]/50 ${
                        task.completed
                          ? 'text-[#638869]/70 line-through decoration-2 decoration-[#19e63c]/60'
                          : 'text-[#3a523e] dark:text-sage-50'
                      }`}
                      onChange={(event) => updateTask(index, { text: event.target.value })}
                      placeholder={`Task ${index + 1}`}
                      type="text"
                      value={task.text}
                    />
                    <div className="flex items-center gap-1 text-[#638869]/70">
                      <button className="leading-none hover:text-[#19e63c]" onClick={() => moveTask(index, -1)} type="button">
                        <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
                      </button>
                      <button className="leading-none hover:text-[#19e63c]" onClick={() => moveTask(index, 1)} type="button">
                        <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                      </button>
                      <button className="leading-none hover:text-rose-500" onClick={() => removeTask(index)} type="button">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 text-xl font-bold">Mindfulness Notes &amp; Ideas</h3>
              <textarea
                className="min-h-[260px] w-full resize-none rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-3 text-[#3a523e] outline-none placeholder:text-[#638869]/60 focus:border-[#19e63c] dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                onChange={(event) => setMindfulnessNotes(event.target.value)}
                placeholder="Let your thoughts flow here..."
                value={mindfulnessNotes}
              />
            </section>
          </div>
        </div>

        <section className="rounded-xl border border-[#e8ede8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-black text-[#19e63c]">{completedTasks}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[#638869]">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#638869] dark:text-sage-300">{remainingTasks}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[#638869]">Remaining</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#638869] dark:text-sage-300">{energyLevel}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[#638869]">Energy Level</p>
              </div>
            </div>

            <button
              className="flex items-center gap-2 rounded-full bg-[#19e63c] px-6 py-3 text-sm font-bold text-[#3a523e] shadow-lg shadow-[#19e63c]/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || saving}
              onClick={handleSave}
              type="button"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {saving ? 'Saving Review...' : 'Save Review'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
