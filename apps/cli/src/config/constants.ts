/**
 * Hardcoded Githancer service endpoints.
 *
 * These are baked into the published package — the user is never asked for them.
 * `timeline init` uses the dashboard URL to open the browser and the API URL to
 * write `.timeline.json`.
 */
export const GITHANCER_API_URL = 'https://githancer-production.up.railway.app';
export const GITHANCER_DASHBOARD_URL = 'https://githancer-frontend.vercel.app';

/** Port the local callback server listens on during `timeline init`. */
export const CLI_CALLBACK_PORT = 7842;
