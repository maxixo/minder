import React, { type ReactNode } from 'react';
import BrandLogo from './BrandLogo';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application render failed:', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-sage-50 px-6 py-16 text-slate-900 dark:bg-[#0f1712] dark:text-sage-50">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-sage-200 bg-white/90 p-8 shadow-soft dark:border-white/10 dark:bg-white/5">
          <BrandLogo titleClassName="text-xl text-sage-700 dark:text-sage-50" iconClassName="h-8 w-8 text-[#44604a] dark:text-sage-50" />
          <h1 className="mt-4 font-display text-3xl font-semibold">
            Something went wrong
          </h1>
          <p className="mt-3 text-base leading-7 text-sage-700 dark:text-sage-200">
            Refresh the page to try again. If the problem keeps happening, sign back in after the refresh.
          </p>
        </div>
      </main>
    );
  }
}
