export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as "MacIntel" in the UA string but is touch-capable,
  // unlike a real Mac - the standard trick for telling them apart.
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isIPadOS;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true;
}
