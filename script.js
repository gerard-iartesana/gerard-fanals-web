document.addEventListener('DOMContentLoaded', async () => {
    // --- Gestión de Temas (Dark/Light) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Aplicar tema inicial
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateToggleIcon(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateToggleIcon(theme);
        });
    }

    function updateToggleIcon(theme) {
        if (!themeToggleBtn) return;
        // Cambiar el icono del botón (Sol para modo claro, Luna para modo oscuro)
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>`;
        } else {
            themeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        }
    }

    // --- Smooth Scroll Refinado ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                const navHeight = document.querySelector('.apple-nav').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Cargar 3 últimas noticias en la homepage ---
    const newsPreview = document.getElementById('news-preview');
    if (newsPreview) {
        function renderNewsPreview(articles) {
            newsPreview.innerHTML = articles.map(a => `
                <article class="blog-card" onclick="window.location='articulo.html?slug=${a.slug || a.id}'">
                    <div class="blog-card-image">
                        <img src="${a.image}" alt="${a.title}" loading="lazy">
                    </div>
                    <div class="blog-card-body">
                        <div class="blog-card-tag">${a.tag}</div>
                        <h3>${a.title}</h3>
                        <p>${a.excerpt}</p>
                        <div class="blog-card-meta">
                            <span class="blog-date">${a.date || new Date(a.created_at).toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})}</span>
                            <span class="blog-read">${a.read_time || a.read}</span>
                        </div>
                    </div>
                </article>
            `).join('');
        }

        // Try Supabase first
        if (typeof _supabase !== 'undefined') {
            try {
                const { data, error } = await _supabase
                    .from('articles')
                    .select('*')
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!error && data && data.length > 0) {
                    renderNewsPreview(data);
                } else {
                    throw new Error('No data');
                }
            } catch (e) {
                console.warn('Supabase fallback:', e.message);
                if (typeof ARTICLES !== 'undefined') renderNewsPreview(ARTICLES.slice(0, 3));
            }
        } else if (typeof ARTICLES !== 'undefined') {
            renderNewsPreview(ARTICLES.slice(0, 3));
        }
    }

    // --- Hamburger Menu ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            // Switch icon between hamburger and X
            if (isOpen) {
                hamburgerBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            } else {
                hamburgerBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            }
        });
    }
});

// Global function for closing mobile menu from onclick
function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu) menu.classList.remove('open');
    if (btn) btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
}
