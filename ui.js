(() => {
  const bar = document.getElementById('scrollProgressBar');
  const navLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const desktopQuery = window.matchMedia('(min-width: 701px)');
  const mobileQuery = window.matchMedia('(max-width: 700px)');
  const tabs = { top: '.hero', analyze: '#analyze', build: '#build', saved: '#saved', guides: '#guides' };

  const setActiveLink = tab => navLinks.forEach(link => {
    const active = link.getAttribute('href') === '#' + tab;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });

  const activateDesktopTab = (tab, updateHash = true) => {
    if (!desktopQuery.matches || !tabs[tab]) return;
    document.body.classList.add('desktop-app-view');
    document.body.dataset.desktopTab = tab;
    setActiveLink(tab);
    if (updateHash) history.replaceState(null, '', tab === 'top' ? location.pathname : '#' + tab);
    window.scrollTo({ top: 0, behavior: mobileQuery.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    updateProgress();
  };

  const syncLayout = () => {
    if (desktopQuery.matches) {
      document.body.classList.remove('mobile-app-view');
      const requested = location.hash.slice(1);
      activateDesktopTab(tabs[requested] ? requested : 'top', false);
    } else {
      document.body.classList.remove('desktop-app-view');
      document.body.removeAttribute('data-desktop-tab');
      navLinks.forEach(link => link.classList.remove('active'));
    }
  };

  function updateProgress() {
    if (!bar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
    bar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  navLinks.forEach(link => link.addEventListener('click', event => {
    if (!desktopQuery.matches) return;
    const tab = link.getAttribute('href').slice(1);
    if (!tabs[tab]) return;
    event.preventDefault();
    activateDesktopTab(tab);
  }));

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (navLinks.includes(link)) return;
    link.addEventListener('click', event => {
      if (!desktopQuery.matches) return;
      const tab = link.getAttribute('href').slice(1);
      if (!tabs[tab]) return;
      event.preventDefault();
      activateDesktopTab(tab);
    });
  });

  desktopQuery.addEventListener?.('change', syncLayout);
  window.addEventListener('hashchange', syncLayout);
  syncLayout();
  updateProgress();
})();
