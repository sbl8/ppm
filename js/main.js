'use strict'; document.addEventListener('DOMContentLoaded', () => { initMobileNavigation(); initScrollAnimations(); initPodcastPlayer(); initShareDialog(); initBackToTop(); initAccessibility(); initIntersectionAnimations(); initParallaxEffects(); initActiveNavHighlighting() }); const podcastConfig = { spotify: { showId: 'ParaPowerMapping', baseUrl: 'https://open.spotify.com', embedBaseUrl: 'https://open.spotify.com/embed-podcast/show' }, apple: { podcastId: '1674362158', embedBaseUrl: 'https://embed.podcasts.apple.com/us/podcast' }, defaultProvider: 'apple' }; function initMobileNavigation() { const menuToggle = document.querySelector('.nav__toggle'); const menu = document.querySelector('.nav__list'); const body = document.body; if (!menuToggle || !menu) return; menuToggle.addEventListener('click', () => { const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true'; menuToggle.setAttribute('aria-expanded', !isExpanded); body.classList.toggle('menu-open'); if (window.innerWidth < 600) { menu.style.display = isExpanded ? 'none' : 'flex'; menu.style.position = isExpanded ? 'static' : 'fixed'; menu.style.top = isExpanded ? 'auto' : '4rem'; menu.style.left = isExpanded ? 'auto' : '0'; menu.style.width = isExpanded ? 'auto' : '100%'; menu.style.backgroundColor = isExpanded ? 'transparent' : 'rgba(26, 26, 26, 0.95)'; menu.style.padding = isExpanded ? '0' : '2rem'; menu.style.flexDirection = isExpanded ? 'row' : 'column'; menu.style.alignItems = isExpanded ? 'center' : 'flex-start'; menu.style.zIndex = isExpanded ? 'auto' : 'var(--z-header)'; menu.style.boxShadow = isExpanded ? 'none' : '0 5px 15px rgba(0, 0, 0, 0.3)' } }); const navLinks = menu.querySelectorAll('.nav__link'); navLinks.forEach(link => { link.addEventListener('click', () => { navLinks.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current') }); link.classList.add('active'); link.setAttribute('aria-current', 'page'); if (window.innerWidth < 769) { menuToggle.setAttribute('aria-expanded', 'false'); body.classList.remove('menu-open'); menu.style.display = ''; menu.style.position = ''; menu.style.top = ''; menu.style.left = ''; menu.style.width = ''; menu.style.backgroundColor = ''; menu.style.padding = ''; menu.style.flexDirection = ''; menu.style.alignItems = ''; menu.style.zIndex = ''; menu.style.boxShadow = '' } }) }); window.addEventListener('resize', debounce(() => { if (window.innerWidth >= 769) { menu.style.display = ''; menu.style.position = ''; menu.style.top = ''; menu.style.left = ''; menu.style.width = ''; menu.style.backgroundColor = ''; menu.style.padding = ''; menu.style.flexDirection = ''; menu.style.boxShadow = ''; body.classList.remove('menu-open'); menuToggle.setAttribute('aria-expanded', 'false') } else if (!body.classList.contains('menu-open')) { menu.style.display = 'none' } }, 150)) }
function initActiveNavHighlighting() { const sections = document.querySelectorAll('main > section[id]'); const navLinks = document.querySelectorAll('.nav__link'); if (!sections.length || !navLinks.length) return; const observerOptions = { root: null, rootMargin: '-40% 0px -60% 0px', threshold: 0 }; const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { const id = entry.target.getAttribute('id'); navLinks.forEach(link => { link.classList.remove('active'); link.removeAttribute('aria-current'); if (link.getAttribute('href') === `#${id}`) { link.classList.add('active'); link.setAttribute('aria-current', 'page') } }) } }) }, observerOptions); sections.forEach(section => { observer.observe(section) }); const homeObserver = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { navLinks.forEach(link => { link.classList.remove('active'); link.removeAttribute('aria-current'); if (link.getAttribute('href') === '#home') { link.classList.add('active'); link.setAttribute('aria-current', 'page') } }) } }, { threshold: 0.5, rootMargin: '0px 0px -90% 0px' }); const header = document.querySelector('#header'); if (header) { homeObserver.observe(header) } }
function initPodcastPlayer() {
    const playerContainer = document.getElementById('podcast-player'); if (!playerContainer) return; playerContainer.innerHTML = `
        <div class="podcast-player__container">
            <div class="podcast-player__tabs">
                <button class="podcast-player__tab active" data-provider="apple">
                    <span class="icon icon-apple"></span> Apple Podcasts
                </button>
                <button class="podcast-player__tab" data-provider="spotify">
                    <span class="icon icon-spotify"></span> Spotify
                </button>
            </div>
            <div id="podcast-embed" class="podcast-player__embed">
                <div class="loading-spinner">
                    <span class="visually-hidden">Loading podcast player...</span>
                </div>
            </div>
        </div>
    `; const tabs = playerContainer.querySelectorAll('.podcast-player__tab'); const embedContainer = document.getElementById('podcast-embed'); loadPodcastEmbed(podcastConfig.defaultProvider, embedContainer); tabs.forEach(tab => { tab.addEventListener('click', () => { tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); const provider = tab.dataset.provider; loadPodcastEmbed(provider, embedContainer) }) })
}
function loadPodcastEmbed(provider, container) {
    if (!container) return; container.innerHTML = `<div class="loading-spinner"><span class="visually-hidden">Loading podcast player...</span></div>`; let embedHtml = ''; if (provider === 'spotify') {
        embedHtml = `
            <iframe style="border-radius:12px" 
                src="https://open.spotify.com/embed/show/6fw1VCpTK9W4K56N1kyR6O?utm_source=generator&theme=0" 
                width="100%" 
                height="352" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
            </iframe>
        `} else if (provider === 'apple') {
        embedHtml = `
            <iframe 
                height="450" 
                width="100%" 
                title="Media player" 
                src="https://embed.podcasts.apple.com/us/podcast/parapower-mapping/id1674362158?itscg=30200&amp;itsct=podcast_box_player&amp;ls=1&amp;mttnsubad=1674362158&amp;theme=dark" 
                id="embedPlayer" 
                style="border: 0px; border-radius: 12px; width: 100%; height: 450px; max-width: 100%;" 
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" 
                allow="autoplay; encrypted-media; clipboard-write">
            </iframe>
        `}
    container.innerHTML = embedHtml; const iframe = container.querySelector('iframe'); if (iframe) {
        iframe.onerror = () => {
            container.innerHTML = `
                <div class="error-message">
                    <p>Unable to load podcast player from ${provider}.</p>
                    <p>Please try another provider or visit directly:</p>
                    <div class="podcast-player__fallback-buttons">
                        <a href="https://open.spotify.com/show/6fw1VCpTK9W4K56N1kyR6O" 
                           class="btn btn--secondary" target="_blank" rel="noopener">
                            <span class="icon icon-spotify"></span> Spotify
                        </a>
                        <a href="https://podcasts.apple.com/us/podcast/parapower-mapping/id1674362158" 
                           class="btn btn--secondary" target="_blank" rel="noopener">
                            <span class="icon icon-apple"></span> Apple Podcasts
                        </a>
                    </div>
                </div>
            `}
    }
}
function initScrollAnimations() { const animatedElements = document.querySelectorAll('.animate-on-scroll'); if (animatedElements.length === 0) return; const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target) } }) }, { rootMargin: '0px', threshold: 0.15 }); animatedElements.forEach(el => { observer.observe(el) }) }
function initIntersectionAnimations() { const staggeredElements = document.querySelectorAll('[data-stagger]'); const revealElements = document.querySelectorAll('[data-reveal]'); const staggerObserver = new IntersectionObserver((entries) => { entries.forEach((entry, index) => { if (entry.isIntersecting) { setTimeout(() => { entry.target.classList.add('revealed') }, index * 100); staggerObserver.unobserve(entry.target) } }) }, { threshold: 0.1 }); staggeredElements.forEach(el => { staggerObserver.observe(el) }); const revealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { const direction = entry.target.dataset.reveal || 'up'; entry.target.classList.add(`reveal-${direction}`); revealObserver.unobserve(entry.target) } }) }, { threshold: 0.1 }); revealElements.forEach(el => { revealObserver.observe(el) }) }
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.parallax'); const aboutBackground = document.querySelector('.about-background'); if (aboutBackground && 'IntersectionObserver' in window) { const parallaxObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { aboutBackground.style.animation = 'slow-drift 20s ease-in-out infinite alternate' } else { aboutBackground.style.animation = 'none' } }) }, { threshold: 0.1 }); parallaxObserver.observe(aboutBackground.parentNode) }
    if (parallaxElements.length === 0) return; const supportsParallax = !isMobileDevice(); if (supportsParallax) { window.addEventListener('scroll', throttle(() => { const scrollY = window.scrollY; parallaxElements.forEach(el => { const speed = el.dataset.speed || 0.3; const yPos = -(scrollY * speed); el.style.transform = `translate3d(0, ${yPos}px, 0)` }) }, 16)) }
}
function initShareDialog() {
    const shareDialog = document.getElementById('share-dialog'); if (!shareDialog) return; const closeButton = shareDialog.querySelector('.dialog__close'); if (closeButton) { closeButton.addEventListener('click', () => { shareDialog.close() }) }
    shareDialog.addEventListener('click', e => { if (e.target === shareDialog) { shareDialog.close() } }); document.addEventListener('keydown', e => { if (e.key === 'Escape' && shareDialog.open) { shareDialog.close() } }); const copyLinkButton = document.getElementById('copy-link'); if (copyLinkButton) { copyLinkButton.addEventListener('click', () => { const link = copyLinkButton.getAttribute('data-link') || window.location.href; navigator.clipboard.writeText(link).then(() => { const confirmation = document.getElementById('copy-confirmation'); if (confirmation) { confirmation.classList.remove('hidden'); setTimeout(() => { confirmation.classList.add('hidden') }, 2000) } }).catch(err => { console.error('Could not copy text: ', err) }) }) }
    const shareOptions = shareDialog.querySelectorAll('.share-option[data-platform]'); shareOptions.forEach(option => { option.addEventListener('click', () => { const platform = option.getAttribute('data-platform'); if (platform !== 'copy') { const url = shareDialog.dataset.shareUrl || window.location.href; const title = 'Check out this episode of ParaPowerMapping!'; switch (platform) { case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank'); break; case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'); break; case 'email': window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`; break } } }) })
}
function initBackToTop() { const backToTopButton = document.getElementById('back-to-top'); if (!backToTopButton) return; const showButton = () => { const scrollPosition = window.scrollY; if (scrollPosition > 800) { backToTopButton.classList.add('visible') } else { backToTopButton.classList.remove('visible') } }; window.addEventListener('scroll', debounce(showButton, 100)); backToTopButton.addEventListener('click', (e) => { e.preventDefault(); if ('scrollBehavior' in document.documentElement.style) { window.scrollTo({ top: 0, behavior: 'smooth' }) } else { const scrollToTop = () => { const c = document.documentElement.scrollTop || document.body.scrollTop; if (c > 0) { window.requestAnimationFrame(scrollToTop); window.scrollTo(0, c - c / 8) } }; scrollToTop() } }) }
function initAccessibility() { const dialogs = document.querySelectorAll('dialog'); dialogs.forEach(dialog => { dialog.addEventListener('keydown', e => { if (e.key === 'Tab') { const focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); const firstElement = focusableElements[0]; const lastElement = focusableElements[focusableElements.length - 1]; if (e.shiftKey && document.activeElement === firstElement) { e.preventDefault(); lastElement.focus() } else if (!e.shiftKey && document.activeElement === lastElement) { e.preventDefault(); firstElement.focus() } } }) }); document.addEventListener('keydown', e => { if (e.key === 'Tab') { document.body.classList.add('keyboard-navigation') } }); document.addEventListener('mousedown', () => { document.body.classList.remove('keyboard-navigation') }); document.querySelectorAll('a, button, h1, h2, h3, h4, h5, h6').forEach(element => { element.style.textShadow = element.style.textShadow || '1px 1px 1px rgba(0,0,0,.2)' }) }
function isMobileDevice() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) }
function debounce(func, wait) { let timeout; return function (...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait) } }
function throttle(func, limit) { let inThrottle; return function (...args) { if (!inThrottle) { func.apply(this, args); inThrottle = !0; setTimeout(() => inThrottle = !1, limit) } } }
function formatDate(dateString) { const date = new Date(dateString); const options = { year: 'numeric', month: 'long', day: 'numeric' }; return date.toLocaleDateString('en-US', options) }
function truncateText(text, maxLength) { if (!text) return ''; return text.length > maxLength ? text.substring(0, maxLength) + '...' : text }