// src/utils/analytics.ts
// Google Analytics Integration Utility

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initializes Google Analytics dynamically by injecting the gtag.js script
 * @param measurementId Google Analytics Measurement ID (G-XXXXXXXXXX)
 */
export const initGA = (measurementId: string) => {
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.log('[Analytics] Google Analytics skipped: No valid Measurement ID provided.');
    return;
  }

  // Prevent duplicate script insertion
  if (document.getElementById('google-analytics-script')) return;

  try {
    // 1. Inject the tracking script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.id = 'google-analytics-script';
    document.head.appendChild(script);

    // 2. Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments as any);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true // Automatically send initial page view
    });

    console.log(`[Analytics] Google Analytics (${measurementId}) initialized successfully!`);
  } catch (err) {
    console.error('[Analytics] Failed to initialize Google Analytics:', err);
  }
};

/**
 * Tracks a page view event manually (useful for React single-page apps)
 * @param path The URL path (e.g. '/dashboard', '/profile')
 */
export const trackPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title
    });
  }
};

/**
 * Tracks a custom event in Google Analytics
 * @param action Event action (e.g., 'exercise_completed', 'signup_success')
 * @param category Event category (e.g., 'Practice', 'Auth')
 * @param label Event label (e.g., 'Chord Spelling - Success')
 * @param value Optional numeric value (e.g., score, streak count)
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};
