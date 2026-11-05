// Centralized client configuration sourced from Vite env vars.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
/** Hosted checkout URL for the Pro subscription (the Gumroad product URL). */
export const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || '';

/** When false, the UI shows "Pro coming soon" instead of a (dead) upgrade button. */
export const IS_PAYMENTS_CONFIGURED = Boolean(CHECKOUT_URL);

export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '')
).replace(/\/$/, '');

/** Whether Supabase auth + backend calls can be made. */
export const IS_BACKEND_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Hard cap on characters sent to the model (keeps latency + token cost sane). */
export const MAX_CHARS = 48_000;

export const PRIVACY_URL = 'https://aryan0724-coder.github.io/paperlens/privacy/';
export const SUPPORT_EMAIL = 'support@paperlens.app';
