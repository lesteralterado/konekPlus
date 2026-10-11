// Coordination between the root-layout preloader (src/app/preloader.tsx)
// and page-level effects that must wait for it — e.g. Lenis smooth scroll,
// which would otherwise let wheel input scroll the hidden page underneath
// the splash.
const DONE_EVENT = "konek:preloader-done";

export function markPreloaderDone() {
  document.documentElement.dataset.preloaded = "true";
  window.dispatchEvent(new Event(DONE_EVENT));
}

export function whenPreloaderDone(callback: () => void): () => void {
  if (document.documentElement.dataset.preloaded === "true") {
    const frame = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(frame);
  }
  window.addEventListener(DONE_EVENT, callback, { once: true });
  return () => window.removeEventListener(DONE_EVENT, callback);
}
