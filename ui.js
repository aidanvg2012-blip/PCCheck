(() => {
  const bar = document.getElementById('scrollProgressBar');
  const navLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const sections = ['analyze','build','saved','guides'].map(id => document.getElementById(id)).filter(Boolean);
  const updateProgress = () => {
    if (!bar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
    bar.style.width = progress + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0,0.15,0.35,0.6] });
    sections.forEach(section => observer.observe(section));
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      if (window.matchMedia('(max-width: 700px)').matches) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });
})();
