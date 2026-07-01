// API for persisting static-breath-hold history to Workers KV.
//
// This Worker only handles requests that don't match a static asset —
// Cloudflare serves the built React app directly for everything else.
// See: https://developers.cloudflare.com/workers/static-assets/
//
// Single fixed key, single user — see project notes. If this ever needs
// to support multiple people, swap HOLDS_KEY for something derived from
// a per-visitor identity instead of a constant.

const HOLDS_KEY = 'hold-history';
const MAX_RECORDS = 200; // keep the stored list from growing unbounded forever

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function isValidRecord(record) {
  return (
    record &&
    typeof record === 'object' &&
    Number.isFinite(record.seconds) &&
    record.seconds >= 0 &&
    record.seconds <= 3600 && // sanity ceiling — an hour is already absurd for this
    typeof record.date === 'string' &&
    record.date.length <= 32
  );
}

async function readHoldHistory(env) {
  const stored = await env.HOLD_HISTORY.get(HOLDS_KEY, 'json');
  if (!Array.isArray(stored)) return [];
  // defensive filter in case of any malformed legacy data
  return stored.filter(isValidRecord);
}

async function handleGetHolds(env) {
  const history = await readHoldHistory(env);
  return jsonResponse({ holdHistory: history });
}

async function handlePostHold(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const seconds = Math.round(Number(body?.seconds));
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 3600) {
    return jsonResponse({ error: 'seconds must be a number between 0 and 3600' }, 400);
  }

  const today = new Date();
  const date = `${today.getMonth() + 1}/${today.getDate()}`;
  const newRecord = { seconds, date };

  const history = await readHoldHistory(env);
  const updated = [...history, newRecord].slice(-MAX_RECORDS);

  try {
    await env.HOLD_HISTORY.put(HOLDS_KEY, JSON.stringify(updated));
  } catch (err) {
    // Most likely cause: the 1-write-per-second-per-key KV limit, if someone
    // double-taps stop or a request gets retried. Surface a clear, retryable error
    // rather than a generic 500 — the client can decide whether to retry.
    const message = err && err.message ? err.message : 'KV write failed';
    const isRateLimited = /429|rate/i.test(message);
    return jsonResponse(
      { error: isRateLimited ? 'Saved too quickly after the last one — try again in a second.' : 'Could not save right now.' },
      isRateLimited ? 429 : 500
    );
  }

  return jsonResponse({ holdHistory: updated }, 201);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/holds') {
      if (request.method === 'GET') {
        return handleGetHolds(env);
      }
      if (request.method === 'POST') {
        return handlePostHold(request, env);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Any other path: this Worker doesn't handle it. With static assets
    // configured, Cloudflare already serves matching files before this
    // fetch handler ever runs — this branch is effectively unreachable
    // for real asset paths, but kept as an explicit fallback.
    return new Response('Not found', { status: 404 });
  },
};
