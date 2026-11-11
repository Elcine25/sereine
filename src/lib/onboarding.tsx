import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isOnboarded, setOnboarded } from './storage';

type OnboardingState = {
  ready: boolean;
  onboarded: boolean;
  complete: () => Promise<void>;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    isOnboarded().then((value) => {
      setOnboardedState(value);
      setReady(true);
    });
  }, []);

  const complete = async () => {
    await setOnboarded();
    setOnboardedState(true);
  };

  return (
    <OnboardingContext.Provider value={{ ready, onboarded, complete, reset: () => setOnboardedState(false) }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding doit être utilisé dans OnboardingProvider');
  return ctx;
}
