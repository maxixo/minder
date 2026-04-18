import { useCallback, useEffect, useState } from 'react';
import entryService from '@/services/entryService';
import {
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

export const useDailyEntry = () => {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadEntry = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await entryService.getTodayEntry();
      setEntry(normalizeDailyEntry(response.data));
    } catch (err: any) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntry().catch(() => undefined);
  }, [loadEntry]);

  const resolveEntry = useCallback(async () => {
    if (entry?._id) return entry;

    const response = await entryService.getTodayEntry();
    const normalized = normalizeDailyEntry(response.data);
    setEntry(normalized);
    return normalized;
  }, [entry]);

  const persistPatch = useCallback(async (patch: DailyEntryPatch, options: SaveEntryOptions = {}) => {
    setSaving(true);
    setError('');

    try {
      const currentEntry = await resolveEntry();
      const nextEntry = normalizeDailyEntry({
        ...mergeEntryPatch(currentEntry, patch),
        completedSections: withCompletedSection(currentEntry.completedSections, options.completedSection),
      });
      const payload = toDailyEntryRequest(nextEntry);

      const response = options.autoSave
        ? await entryService.autoSaveEntry(currentEntry._id, payload)
        : await entryService.updateEntry(currentEntry._id, payload);

      const normalized = normalizeDailyEntry(response.data);
      setEntry(normalized);
      return normalized;
    } catch (err: any) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }, [resolveEntry]);

  return {
    entry,
    entryId: entry?._id || null,
    loading,
    saving,
    error,
    setEntry,
    reload: loadEntry,
    saveEntryPatch: (patch: DailyEntryPatch, completedSection?: EntrySection | null) => (
      persistPatch(patch, { completedSection })
    ),
    autoSaveEntryPatch: (patch: DailyEntryPatch, completedSection?: EntrySection | null) => (
      persistPatch(patch, { autoSave: true, completedSection })
    ),
  };
};
