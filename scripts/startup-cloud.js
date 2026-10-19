// Dynamically inserted scripts do not hold DOMContentLoaded hostage to a CDN.
// async=false preserves Firebase's dependency order while downloads overlap.
(() => {
  function loadScript(src, ordered = true) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = !ordered;
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Service script unavailable'));
      document.head.appendChild(script);
    });
  }
  window.sansaFirebaseReady = Promise.all(['app', 'auth', 'database', 'storage'].map(name =>
    loadScript(`https://www.gstatic.com/firebasejs/10.12.2/firebase-${name}-compat.js`)
  ));
  // Attach an error observer immediately; startup handles fallback separately.
  window.sansaFirebaseReady.catch(() => {});
  let pdfPromise;
  window.sansaLoadPdf = () => {
    if (window.jspdf?.jsPDF) return Promise.resolve();
    if (!pdfPromise) {
      const download = loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', false);
      pdfPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('PDF connection timed out')), 12000);
        download.then(() => {
          clearTimeout(timer);
          if (window.jspdf?.jsPDF) resolve();
          else reject(new Error('PDF tool unavailable'));
        }, error => { clearTimeout(timer); reject(error); });
      }).catch(error => { pdfPromise = null; throw error; });
    }
    return pdfPromise;
  };
})();
