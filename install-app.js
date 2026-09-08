/* Dharun Records — "Install App" support
   1. Registers the service worker (offline + installability requirement).
   2. Captures the browser's install prompt and wires it to a button
      you place in the page (id="install-app-btn").
   3. Shows a small iOS hint since Safari has no native install prompt.

   Include this AFTER the <head> links to manifest.json + icons, e.g.:

     <link rel="manifest" href="manifest.json">
     <link rel="icon" href="icons/icon-32.png" sizes="32x32">
     <link rel="icon" href="icons/icon-192.png" sizes="192x192">
     <link rel="apple-touch-icon" href="icons/icon-180.png">
     <meta name="theme-color" content="#090c18">
     ...
     <script src="install-app.js" defer></script>

   And add a button anywhere in your header, e.g.:
     <button id="install-app-btn" class="btn-pdf" style="display:none">
       ⬇ Install App
     </button>
*/

(function () {
  'use strict';

  // ---- 1. Service worker registration + auto-update ------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then((reg) => {
          console.log('[Dharun Records] service worker registered:', reg.scope);

          // Check GitHub for a newer service-worker.js every time the app
          // is opened, instead of waiting on the browser's ~24h check cycle.
          reg.update();

          // If an update was already waiting from a previous visit, activate
          // it now.
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');

          // A new version was found while this tab was open — tell it to
          // activate as soon as it's installed.
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch((err) => console.warn('[Dharun Records] service worker failed:', err));

      // Once the new worker takes control, reload once so the page picks up
      // the fresh code instead of sitting on the old cached version.
      let refreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshed) return;
        refreshed = true;
        window.location.reload();
      });
    });
  }

  // ---- 2. Capture the install prompt (Chrome / Edge / Android) ------
  let deferredPrompt = null;
  const installBtn = () => document.getElementById('install-app-btn');

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    const btn = installBtn();
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.addEventListener('click', promptInstall, { once: false });
    }
  });

  async function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[Dharun Records] install prompt outcome:', outcome);
    deferredPrompt = null;
    const btn = installBtn();
    if (btn) btn.style.display = 'none';
  }

  // Hide the install button once the app is actually installed.
  window.addEventListener('appinstalled', () => {
    const btn = installBtn();
    if (btn) btn.style.display = 'none';
    deferredPrompt = null;
    console.log('[Dharun Records] app installed');
  });

  // ---- 3. iOS Safari has no beforeinstallprompt — show a manual hint -
  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }
  function isInStandaloneMode() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isIos() && !isInStandaloneMode()) {
      const btn = installBtn();
      if (btn) {
        btn.style.display = 'inline-flex';
        btn.textContent = '⬇ Add to Home Screen';
        btn.addEventListener('click', () => {
          alert('To install: tap the Share icon, then "Add to Home Screen".');
        });
      }
    }
  });
})();
