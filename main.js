// landing page only

// smooth scroll for # links — using event delegation on the document
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }
});

// animate hero bars on load
window.addEventListener('load', () => {
  document.querySelectorAll('.mock-bar').forEach(bar => {
    const finalWidth = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = finalWidth; }, 400);
  });
});

// close mobile nav when a link inside it is clicked
document.querySelector('.nav-mobile')?.addEventListener('click', e => {
  if (e.target.classList.contains('nav-link')) {
    document.querySelector('.nav-mobile').classList.remove('open');
  }
});
