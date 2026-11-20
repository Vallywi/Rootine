# Push notifications (alerts when the app is closed)

When a focus session or break starts or resumes, the server stores a job with the end time. A scheduler calls
`GET /api/push/dispatch` every minute, and the server sends a Web Push for every job that is due. The phone's
service worker (`frontend/public/sw-notify.js`) shows it, even if Rootine is closed or the phone is locked.

Pausing, giving up, or finishing in the app removes the job.

## Environment variables (Vercel, Production)

| Name | Purpose |
| --- | --- |
| `VAPID_PUBLIC_KEY` | Public key. Sent to the browser. |
| `VAPID_PRIVATE_KEY` | Secret. Never commit it. |
| `VAPID_SUBJECT` | `mailto:you@example.com` or the site URL. |
| `CRON_SECRET` | Secret. The scheduler sends it as `Authorization: Bearer <secret>`. |

New keys: `npx web-push generate-vapid-keys`. If you change the keys, everyone has to turn notifications off and on again.

## The scheduler (required)

Vercel has no always-on server, and its free cron runs once a day, so use a free external pinger that can run every minute.
With https://cron-job.org:

1. Create a job with URL `https://<your-site>/api/push/dispatch`, schedule every 1 minute.
2. Under Advanced, add the header `Authorization` = `Bearer <CRON_SECRET>`.
3. Check the response: `{"due":0,"sent":0}`.

Alerts arrive up to a minute after the end time.

## On the phone

Open the site (https), install it (Chrome menu, Install app; on iPhone, Share, Add to Home Screen), then Settings,
Enable notifications. iPhone needs iOS 16.4 or newer and the home-screen app.
