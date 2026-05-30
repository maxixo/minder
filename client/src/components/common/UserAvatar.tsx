import clsx from 'clsx';
import { getSafeAvatarUrl } from '@/lib/avatar';

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join(' ');

export default function UserAvatar({
  avatar,
  name,
  alt = '',
  ariaHidden = true,
  className,
  fallbackClassName,
  imgClassName,
}: {
  avatar?: string | null;
  name?: string | null;
  alt?: string;
  ariaHidden?: boolean;
  className?: string;
  fallbackClassName?: string;
  imgClassName?: string;
}) {
  const avatarUrl = getSafeAvatarUrl(avatar);
  const initials = getInitials(name || 'Mindful Life');

  if (avatarUrl) {
    return (
      <img
        alt={alt}
        aria-hidden={ariaHidden}
        className={clsx(className, imgClassName)}
        referrerPolicy="no-referrer"
        src={avatarUrl}
      />
    );
  }

  return (
    <div className={clsx(className, fallbackClassName)}>
      {initials}
    </div>
  );
}
