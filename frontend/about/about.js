// Mark "About" as current (useful if your global script doesn't handle it)
(() => {
    const aboutLinks = Array.from(document.querySelectorAll('a[href="/about"]'));
    aboutLinks.forEach(a => a.setAttribute('aria-current', 'page'));
  })();
  
  // If your ../main.js already wires up the hamburger, nothing else is required here.
  // You can add page-specific JS below as needed.
  