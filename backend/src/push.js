// Web Push sender. Returns null when the VAPID keys are not set, so the app still works without push.
// send() resolves to 'sent', or 'gone' when the browser says the subscription no longer exists.
export function createPusher(config) {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) return null;
  let lib;
  return {
    publicKey: config.vapidPublicKey,
    async send(sub, payload) {
      lib ??= (await import('web-push')).default;
      try {
        await lib.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          {
            vapidDetails: { subject: config.vapidSubject, publicKey: config.vapidPublicKey, privateKey: config.vapidPrivateKey },
            TTL: 60 * 60, // if the phone is off, drop it after an hour (a late "done" is useless)
            urgency: 'high',
          },
        );
        return 'sent';
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) return 'gone';
        throw err;
      }
    },
  };
}

// The "session finished" push is queued when a session starts or resumes, and removed when it is paused, ended, or completed in the app.
export async function scheduleDone(db, session) {
  await db.query(
    `INSERT INTO push_jobs (session_id, user_id, kind, due_at) VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_id) DO UPDATE SET due_at = EXCLUDED.due_at, kind = EXCLUDED.kind`,
    [session.id, session.user_id, session.kind === 'focus' ? 'focus' : 'break', session.target_at],
  );
}

export async function cancelDone(db, sessionId) {
  await db.query('DELETE FROM push_jobs WHERE session_id = $1', [sessionId]);
}

export const donePayload = (kind, sessionId) => (kind === 'focus'
  ? { title: 'Your plant is fully grown!', body: 'Nice focus. Take a break when you are ready.', tag: `rootine-${sessionId}` }
  : { title: 'Break is over', body: 'Ready for the next focus session?', tag: `rootine-${sessionId}` });
