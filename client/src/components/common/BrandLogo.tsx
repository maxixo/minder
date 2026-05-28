import clsx from 'clsx';

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  tone?: 'brand' | 'light';
  withWordmark?: boolean;
}

const palette = {
  brand: {
    accent: 'text-[#44604a]',
    detail: 'text-sage-500',
  },
  light: {
    accent: 'text-sage-50',
    detail: 'text-sage-200',
  },
} as const;

export default function BrandLogo({
  className,
  iconClassName,
  subtitle,
  subtitleClassName,
  titleClassName,
  tone = 'brand',
  withWordmark = true,
}: BrandLogoProps) {
  const colors = palette[tone];

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <svg
        aria-hidden="true"
        className={clsx('h-9 w-9 shrink-0', colors.accent, iconClassName)}
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M38.25 10.75c-7.28 0-13 2.1-17 6.27-4.08 4.24-6.15 9.92-5.83 15.99.15 2.89 1.19 5.13 3.01 6.69 1.83 1.56 4.38 2.3 7.27 2.1 5.48-.38 10.54-4.02 13.87-9.93 3.08-5.48 4.2-12.69 3.08-19.79a1.5 1.5 0 0 0-1.48-1.28h-2.92Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.6"
        />
        <path
          d="M20.75 35.75c2.35-5.74 6.23-10.83 11.55-15.17"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </svg>

      {withWordmark ? (
        <div className="min-w-0">
          <p className={clsx('font-display text-2xl font-semibold leading-none tracking-tight', colors.accent, titleClassName)}>
            MindfulLife
          </p>
          {subtitle ? (
            <p className={clsx('mt-1 text-xs font-semibold uppercase tracking-[0.24em]', colors.detail, subtitleClassName)}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
