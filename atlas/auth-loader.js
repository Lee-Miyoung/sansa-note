// Optional authentication must not block the episode's local reader startup.
window.sansaAtlasAuthReady = Promise.all(['app', 'auth', 'database'].map(name => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.async = false;
  script.src = `https://www.gstatic.com/firebasejs/10.12.2/firebase-${name}-compat.js`;
  script.onload = resolve;
  script.onerror = () => reject(new Error('Account service unavailable'));
  document.head.append(script);
})));
window.sansaAtlasAuthReady.catch(() => {});
