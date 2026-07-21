import clsx from 'clsx';
import {
  BRAND_LOGO_LEAF_OFFSET_X,
  BRAND_LOGO_LEAF_PATH,
  BRAND_LOGO_LEAF_VEIN_PATH,
} from '@/lib/brandLogo';

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
        <g transform={`translate(${BRAND_LOGO_LEAF_OFFSET_X} 0)`}>
          <path
            d={BRAND_LOGO_LEAF_PATH}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.6"
          />
          <path
            d={BRAND_LOGO_LEAF_VEIN_PATH}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.6"
          />
        </g>
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
