import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Navigation } from '../components/layout/Navigation';
import { OnboardingTutorial, useOnboarding } from '../components/onboarding/OnboardingTutorial';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <main className="h-full overflow-y-auto no-scrollbar pb-20">
          <Outlet />
        </main>
        <Navigation />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}

      {/* First-time user onboarding */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={completeOnboarding} />
      )}
    </div>
  );
}
