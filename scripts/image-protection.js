// Limit casual saving without blocking page scrolling or text controls.
(() => {
  const isArtwork = target => target instanceof Element &&
    Boolean(target.closest('img, picture, svg, canvas'));

  document.addEventListener('contextmenu', event => {
    if (isArtwork(event.target)) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (isArtwork(event.target)) event.preventDefault();
  });
})();
