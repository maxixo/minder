import { useEffect, useRef, useState } from 'react';
import authService from '@/services/authService';

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleButtonProps {
  onSuccess: (response: any) => void;
  onError: (message: string) => void;
}

const loadGisScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });

export default function GoogleSignInButton({ onSuccess, onError }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleHostRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // GIS injects a fixed-width (360px) iframe into the container. On narrow
  // screens we scale the iframe down to match the host width (e.g. a ~330px
  // phone viewport) so it never overflows or gets cut off.
  useEffect(() => {
    const host = scaleHostRef.current;
    if (!host) return;
    const updateScale = () => {
      const hostWidth = host.clientWidth;
      if (!hostWidth) return;
      const scale = Math.min(1, hostWidth / 360);
      host.style.transform = `scale(${scale})`;
      host.style.transformOrigin = 'center';
      host.style.height = `${44 * scale}px`;
    };
    updateScale();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;
    resizeObserver?.observe(host);
    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;

    authService
      .googleConfig()
      .then((config) => {
        if (!cancelled) setClientId(config?.data?.clientId || null);
      })
      .catch(() => {
        if (!cancelled) setClientId(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError('Google sign-in was cancelled.');
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'pill',
        });
      })
      .catch(() => onError('Could not load Google sign-in.'));

    return () => {
      cancelled = true;
    };
  }, [clientId, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-[360px]">
        <div ref={scaleHostRef} className="w-full" style={{ height: 44 }}>
          <div ref={containerRef} className="flex justify-center" />
        </div>
      </div>
    </div>
  );
}
