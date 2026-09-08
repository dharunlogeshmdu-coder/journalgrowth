# Making "Dharun Records" installable (PWA)

This package adds a proper app icon and turns your existing single-page
trading journal into an installable app (desktop, Android, iOS).

## Files
```
dharun-records-app/
├── manifest.json        ← app name, colors, icon list
├── service-worker.js    ← offline caching
├── install-app.js       ← install button + iOS "Add to Home Screen" hint
├── favicon.ico
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-180.png     ← apple-touch-icon
    ├── icon-192.png
    └── icon-512.png
```

## 1. Put these files next to your HTML file
Copy the whole `dharun-records-app` folder contents (manifest.json,
service-worker.js, install-app.js, favicon.ico, icons/) into the same
folder as your `trading-journal.html`.

If your HTML file has a different name than `trading-journal.html`,
update `start_url` in `manifest.json` and the two paths in
`service-worker.js`'s `PRECACHE_URLS` to match.

## 2. Add these lines inside `<head>` of trading-journal.html
Paste this right after your existing `<title>` tag:

```html
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" sizes="32x32" href="icons/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="theme-color" content="#090c18">
<script src="install-app.js" defer></script>
```

## 3. Add an install button (optional but recommended)
In your header's `.hdr-right` div, alongside the existing PDF button,
add:

```html
<button id="install-app-btn" class="btn-pdf" style="display:none">⬇ Install App</button>
```

`install-app.js` will automatically:
- show this button once Chrome/Edge/Android decides the app is installable,
- trigger the native install prompt on click,
- hide the button again after install,
- on iPhone/iPad (which has no install prompt), show the button with an
  "Add to Home Screen" hint instead.

## 4. Serve over HTTPS (or localhost)
Service workers and install prompts only work on `https://` or
`http://localhost` — not on a plain `file://` path. If you're just
testing locally, run e.g. `python3 -m http.server` in the folder and
open `http://localhost:8000/trading-journal.html`.

## Notes
- The app icon reuses your existing logo (ring + rising bars + trend
  line + glow dot) scaled up to a 512×512 master, matching your site's
  purple→cyan gradient and dark background.
- `service-worker.js` caches the app shell so it still opens offline;
  it always tries the network first for the page itself so you get your
  latest edits when online.
