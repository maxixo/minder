import { useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '@/components/common/BrandLogo';
import { readOnboardingFlowState } from '@/lib/onboardingFlow';
import '@/styles/pages/welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onboardingFlow = readOnboardingFlowState();
  const firstName = onboardingFlow?.profileName?.split(' ')[0] || 'there';
  const isFromOnboarding = searchParams.get('source') === 'onboarding';

  return (
    <div className="welcome-page overflow-hidden bg-surface font-body-md text-on-surface">
      <div className="welcome-botanical-bg fixed inset-0 z-0 opacity-60" />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface/20 via-surface/80 to-surface" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-container-padding-mobile md:px-container-padding-desktop">
        <header className="welcome-canvas-entrance absolute top-12 left-0 flex w-full justify-center" style={{ animationDelay: '0.1s' }}>
          <BrandLogo
            className="justify-center"
            iconClassName="h-10 w-10 md:h-12 md:w-12 text-[#44604a]"
            titleClassName="text-3xl md:text-4xl text-primary"
          />
        </header>

        <div className="welcome-canvas-entrance w-full max-w-[720px] space-y-stack-lg text-center" style={{ animationDelay: '0.3s' }}>
          <div className="space-y-stack-md">
            <div className="mb-stack-lg flex justify-center">
              <div className="welcome-leaf-float flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary shadow-sm">
                <span className="material-symbols-outlined !text-[40px] welcome-filled-icon">spa</span>
              </div>
            </div>

            <h1 className="font-display-lg-mobile text-display-lg-mobile tracking-tight text-primary md:font-display-lg md:text-display-lg">
              {isFromOnboarding ? `${firstName}, your journey begins today.` : 'Your Journey Begins Today.'}
            </h1>

            <p className="mx-auto max-w-[580px] font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              Welcome to your digital sanctuary. Every step toward stillness is a victory for your well-being.
            </p>
          </div>

          <div className="pt-stack-md">
            <button
              className="group inline-flex items-center justify-center rounded-full bg-primary px-10 py-5 font-label-md text-label-md text-on-primary shadow-md transition-all hover:bg-primary/90 active:scale-95"
              onClick={() => navigate('/dashboard', { replace: true })}
              type="button"
            >
              Proceed to Dashboard
              <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>

        <footer className="welcome-canvas-entrance absolute bottom-12 w-full text-center opacity-40" style={{ animationDelay: '0.8s' }}>
          <p className="font-metadata text-metadata uppercase tracking-widest text-outline">
            MindfulLife • Session 01 • Est. 2024
          </p>
        </footer>
      </main>

      <div className="welcome-cursor-glow fixed z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-fixed/20 blur-[120px]" />
    </div>
  );
}
