# Luxtronic Portal — Notifications API

This document is for other Luxtronic services (rental, service form, quotation form, mastex catalog, etc.) that want to push a notification to the portal's home page. It's self-contained — no need to read the rest of this repo to implement against it.

## Overview

The portal ([http://192.168.68.255/](http://192.168.68.255/)) shows a bell icon with unread notifications on its home page. Any service on the LAN can push a notification into it with a single `POST` request. There is no polling or webhook required on your side — fire the request when something notification-worthy happens, and you're done.

- **Base URL:** `http://192.168.68.255`
- **Auth:** none. The endpoint is only reachable from the internal LAN and is intentionally open — do not add auth headers.
- **Transport:** plain HTTP, JSON.

## Endpoint: create a notification

```
POST /api/notifications
Content-Type: application/json
```

### Request body

| Field     | Type   | Required | Limit       | Notes |
|-----------|--------|----------|-------------|-------|
| `source`  | string | yes      | 50 chars    | Short identifier for your service, e.g. `"rental"`, `"service-form"`, `"quotation"`. Shown next to the timestamp. |
| `title`   | string | yes      | 200 chars   | Short headline, e.g. `"New rental booking"`. |
| `message` | string | yes      | 1000 chars  | The body text. Plain text only — it is rendered with `textContent`, so HTML/markdown will show as literal text, not be interpreted. |
| `level`   | string | no       | —           | One of `"info"`, `"warning"`, `"error"`. Defaults to `"info"` if omitted or invalid. Controls the accent color shown in the portal UI. |
| `url`     | string | no       | 500 chars   | A link back into your service (e.g. the specific booking/ticket). Rendered as an "Open" button. Omit if there's nothing to link to. |

Any fields beyond these are ignored. Values longer than their limit are silently truncated server-side, not rejected.

### Example request

```bash
curl -X POST http://192.168.68.255/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rental",
    "level": "warning",
    "title": "Rental overdue",
    "message": "Booking #482 for John Smith is 2 days overdue",
    "url": "http://192.168.68.255:8003/bookings/482"
  }'
```

```js
// Node / fetch example
await fetch('http://192.168.68.255/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'rental',
    level: 'warning',
    title: 'Rental overdue',
    message: `Booking #${booking.id} for ${booking.customerName} is 2 days overdue`,
    url: `http://192.168.68.255:8003/bookings/${booking.id}`,
  }),
}).catch(() => {}); // see "Failure handling" below
```

### Responses

**Success — `201 Created`**, body is the stored notification:

```json
{
  "id": "n_1788922581707_5f7b46cc",
  "source": "rental",
  "level": "warning",
  "title": "Rental overdue",
  "message": "Booking #482 for John Smith is 2 days overdue",
  "url": "http://192.168.68.255:8003/bookings/482",
  "createdAt": "2026-09-09T02:56:21.707Z"
}
```

**Validation error — `400 Bad Request`** (missing `source`, `title`, or `message`, or the body isn't valid JSON):

```json
{ "error": "source, title, and message are required" }
```

There's no other status code to handle — any 5xx / connection failure just means the portal is unreachable.

## Failure handling (important)

Treat this call as **best-effort and fire-and-forget**. A failed or slow notification must never block or fail your own operation (e.g. don't let a down portal prevent a rental booking from completing). Send it after your main action succeeds, and swallow errors:

```js
notifyPortal({...}).catch(() => {});
```

There's no retry queue on the portal side — if the request fails, the notification is simply lost. If that matters for your use case, retry a couple of times with a short backoff on your end, but don't block the caller waiting on it.

## Reading notifications back

You shouldn't need this, but for completeness: `GET /api/notifications` returns the stored list (JSON array, newest first, capped at the 200 most recent). This is what the portal page itself polls every 20s — sending services don't need to call it.
