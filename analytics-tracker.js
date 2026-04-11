// Analytics Tracker - gerardfanals.online
// Tracks page views, button clicks, device, location, and unique visitors

(function() {
    // --- Generate/Get Visitor ID ---
    function getVisitorId() {
        let id = localStorage.getItem('gf_visitor_id');
        if (!id) {
            id = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gf_visitor_id', id);
        }
        return id;
    }

    // --- Parse Device & Browser from User Agent ---
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        if (/Mobi|Android/i.test(ua)) device = 'Mobile';
        else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

        let browser = 'Otro';
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        return { device, browser };
    }

    // --- Track Session Duration ---
    const sessionStart = Date.now();
    window.addEventListener('beforeunload', () => {
        const duration = Math.round((Date.now() - sessionStart) / 1000);
        if (typeof _supabase !== 'undefined') {
            // Use sendBeacon-compatible approach
            const url = 'https://uidilhuybmtuokunutgz.supabase.co/rest/v1/analytics_events';
            const body = JSON.stringify({
                event_type: 'session_end',
                event_name: 'Duración: ' + duration + 's',
                page: window.location.pathname,
                visitor_id: getVisitorId(),
                session_duration: duration,
                device: getDeviceInfo().device,
                browser: getDeviceInfo().browser
            });
            navigator.sendBeacon(url + '?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM', new Blob([body], { type: 'application/json' }));
        }
    });

    // Wait for Supabase to be ready
    function waitForSupabase(callback) {
        if (typeof _supabase !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForSupabase(callback), 100);
        }
    }

    waitForSupabase(async function() {
        const { device, browser } = getDeviceInfo();
        const visitorId = getVisitorId();

        // --- Get Country/City via free IP API ---
        let country = null, city = null;
        try {
            const geo = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
            const geoData = await geo.json();
            country = geoData.country_name || null;
            city = geoData.city || null;
        } catch (e) { /* Silently fail */ }

        // --- Track Page View ---
        _supabase.from('analytics_events').insert([{
            event_type: 'page_view',
            event_name: document.title,
            page: window.location.pathname + window.location.search,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            device,
            browser,
            country,
            city,
            visitor_id: visitorId
        }]).then(() => {}).catch(() => {});

        // --- Track Button Clicks ---
        const trackedButtons = [
            { selector: '#btn-agendar-cita, a[href*="calendar.app.google"]', name: 'Agendar Reunión' },
            { selector: 'a[href*="wa.me"]', name: 'WhatsApp' },
            { selector: '.btn-apple-buy', name: 'Contactar (Nav)' },
            { selector: 'a[href*="linkedin"]', name: 'LinkedIn' },
            { selector: '.blog-card', name: 'Click Noticia' },
            { selector: 'a[href="blog.html"]', name: 'Ver Blog' },
        ];

        trackedButtons.forEach(({ selector, name }) => {
            document.querySelectorAll(selector).forEach(el => {
                el.addEventListener('click', () => {
                    // Track to Supabase
                    _supabase.from('analytics_events').insert([{
                        event_type: 'button_click',
                        event_name: name,
                        page: window.location.pathname,
                        visitor_id: visitorId,
                        device,
                        browser,
                        country,
                        city
                    }]).then(() => {}).catch(() => {});
                    // Track to GA4
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'click', {
                            event_category: 'button',
                            event_label: name,
                            page_path: window.location.pathname
                        });
                    }
                });
            });
        });
    });
})();
