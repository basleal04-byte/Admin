type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function assertLoginAllowed(key: string) {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.resetAt < now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return;
  }
  if (row.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((row.resetAt - now) / 60000);
    throw new Error(`Too many attempts. Try again in ${mins} minute(s).`);
  }
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  row.count += 1;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
