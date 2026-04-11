// Analytics Tracker - gerardfanals.online
// Tracks page views and button clicks to Supabase

(function() {
    // Wait for Supabase to be ready
    function waitForSupabase(callback) {
        if (typeof _supabase !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForSupabase(callback), 100);
        }
    }

    waitForSupabase(function() {
        // --- Track Page View ---
        _supabase.from('analytics_events').insert([{
            event_type: 'page_view',
            event_name: document.title,
            page: window.location.pathname + window.location.search,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent
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
                    _supabase.from('analytics_events').insert([{
                        event_type: 'button_click',
                        event_name: name,
                        page: window.location.pathname,
                        referrer: null,
                        user_agent: navigator.userAgent
                    }]).then(() => {}).catch(() => {});
                });
            });
        });
    });
})();
