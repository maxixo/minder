const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toDateOnly = (value: Date) => (
  new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
);

export const parseDateOnlyString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const parseEntryDateInput = (value?: string | Date | null) => {
  if (!value) return toDateOnly(new Date());
  if (value instanceof Date) return toDateOnly(value);
  if (DATE_ONLY_PATTERN.test(value)) return parseDateOnlyString(value);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid entry date');
  }

  return toDateOnly(parsed);
};

export const formatDateParam = (value: Date) => (
  value.toISOString().slice(0, 10)
);
