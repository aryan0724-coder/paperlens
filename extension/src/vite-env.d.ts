/// <reference types="vite/client" />
/// <reference types="chrome" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_EXTPAY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Minimal typing for the untyped `extpay` package.
declare module 'extpay' {
  export interface ExtPayUser {
    paid: boolean;
    paidAt: Date | null;
    installedAt: Date;
    trialStartedAt: Date | null;
    subscriptionStatus: 'active' | 'past_due' | 'canceled' | null;
    subscriptionCancelAt: Date | null;
    email?: string;
  }
  export interface ExtPayInstance {
    getUser(): Promise<ExtPayUser>;
    openPaymentPage(): void;
    openTrialPage(displayText?: string): void;
    startBackground(): void;
    onPaid: { addListener(cb: (user: ExtPayUser) => void): void };
  }
  export default function ExtPay(id: string): ExtPayInstance;
}
