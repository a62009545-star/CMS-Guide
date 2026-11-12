// Applies the saved theme before first paint to avoid a flash. Light is the default.
try {
  if (localStorage.getItem('cms-theme') === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
