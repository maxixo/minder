import { useCallback, useEffect, useRef, useState } from 'react';
import entryService from '@/services/entryService';
import {
  createEmptyDailyEntry,
  mergeEntryPatch,
  normalizeDailyEntry,
  toDailyEntryRequest,
  withCompletedSection,
  type DailyEntry,
  type DailyEntryPatch,
  type EntrySection,
} from '@/types/entry';

const getErrorMessage = (error: any) => error?.response?.data?.message || error?.message || 'Unable to load entry';

interface SaveEntryOptions {
  autoSave?: boolean;
  completedSection?: EntrySection | null;
}

const toStartOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useDailyEntry = () => {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDateState] = useState(() => toStartOfLocalDay(new Date()));
  const requestSequenceRef = useRef(0);

  const today = toStartOfLocalDay(new Date());

  const loadEntryByDate = useCallback(async (date: Date) => {
    const requestedDate = toStartOfLocalDay(date);
    const clampedDate = requestedDate > toStartOfLocalDay(new Date()) ? toStartOfLocalDay(new Date()) : requestedDate;
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    setSelectedDateState(clampedDate);
    setLoading(true);
    setError('');

    try {
      const response = await entryService.getEntryByDate(toDateParam(clampedDate));
      const normalized = response.data
        ? normalizeDailyEntry(response.data)
        : createEmptyDailyEntry(clampedDate.toISOString());

      if (requestId === requestSequenceRef.current) {
        setEntry(normalized);
      }

      return normalized;
    } catch (err: any) {
      if (requestId === requestSequenceRef.current) {
        setError(getErrorMessage(err));
      }
      throw err;
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadEntry = useCallback(async () => loadEntryByDate(selectedDate), [loadEntryByDate, selectedDate]);

  useEffect(() => {
    void loadEntryByDate(new Date()).catch(() => undefined);
  }, [loadEntryByDate]);

  const resolveEntry = useCallback(async () => {
    if (entry) return entry;
    return loadEntryByDate(selectedDate);
  }, [entry, loadEntryByDate, selectedDate]);

  const persistPatch = useCallback(async (patch: DailyEntryPatch, options: SaveEntryOptions = {}) => {
    setSaving(true);
    setError('');

    try {
      const currentEntry = await resolveEntry();
      const selectedDateIso = toStartOfLocalDay(selectedDate).toISOString();
      const nextEntry = normalizeDailyEntry({
        ...mergeEntryPatch(currentEntry, patch),
        date: currentEntry.date || selectedDateIso,
        completedSections: withCompletedSection(currentEntry.completedSections, options.completedSection),
      });
      const payload = toDailyEntryRequest(nextEntry);

      const response = currentEntry.id
        ? options.autoSave
          ? await entryService.autoSaveEntry(currentEntry.id, payload)
          : await entryService.updateEntry(currentEntry.id, payload)
        : await entryService.createEntry(payload);

      const normalized = normalizeDailyEntry(response.data);
      setEntry(normalized);
      return normalized;
    } catch (err: any) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }, [resolveEntry, selectedDate]);

  const canGoNext = selectedDate.getTime() < today.getTime();

  const goToPreviousDate = useCallback(async () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    return loadEntryByDate(previousDate);
  }, [loadEntryByDate, selectedDate]);

  const goToNextDate = useCallback(async () => {
    if (!canGoNext) return entry;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return loadEntryByDate(nextDate);
  }, [canGoNext, entry, loadEntryByDate, selectedDate]);

  return {
    entry,
    entryId: entry?.id || null,
    loading,
    saving,
    error,
    setEntry,
    selectedDate,
    canGoNext,
    loadEntryByDate,
    goToPreviousDate,
    goToNextDate,
    reload: loadEntry,
    saveEntryPatch: (patch: DailyEntryPatch, completedSection?: EntrySection | null) => (
      persistPatch(patch, { completedSection })
    ),
    autoSaveEntryPatch: (patch: DailyEntryPatch, completedSection?: EntrySection | null) => (
      persistPatch(patch, { autoSave: true, completedSection })
    ),
  };
};
