'use client';

import { useEffect } from 'react';

/**
 * ExtensionErrorGuard prevents third-party Chrome/Firefox browser extension scripts
 * (e.g. Emily, Grammarly, Loom, etc.) from triggering Next.js runtime error overlays
 * when their injected content scripts fail to mount into the DOM.
 */
export function ExtensionErrorGuard() {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const isExtensionError =
        (typeof event.filename === 'string' &&
          (event.filename.includes('chrome-extension://') ||
            event.filename.includes('moz-extension://'))) ||
        (event.error &&
          typeof event.error.stack === 'string' &&
          (event.error.stack.includes('chrome-extension://') ||
            event.error.stack.includes('moz-extension://')));

      if (isExtensionError) {
        // Prevent extension errors from bubbling to Next.js dev error overlay
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const isExtensionRejection =
        event.reason &&
        typeof event.reason.stack === 'string' &&
        (event.reason.stack.includes('chrome-extension://') ||
          event.reason.stack.includes('moz-extension://'));

      if (isExtensionRejection) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return null;
}
