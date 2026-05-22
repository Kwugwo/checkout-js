// Single namespaced stylesheet, injected once per page. All selectors are
// scoped by [data-kwugwo-root] so merchant CSS cannot accidentally style them
// and we cannot accidentally style merchant elements.

const STYLE_ID = 'kwugwo-checkout-styles';

export function injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
[data-kwugwo-root] {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 180ms ease;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
[data-kwugwo-root][data-open="true"] { opacity: 1; }

[data-kwugwo-root] [data-kwugwo-backdrop] {
  position: absolute;
  inset: 0;
  background: rgba(0, 25, 21, 0.6);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

[data-kwugwo-root] [data-kwugwo-frame-wrap] {
  position: relative;
  width: 340px;
  max-width: 100%;
  height: 570px;
  max-height: 100vh;
  box-shadow: 0 30px 80px -25px rgba(0, 25, 21, 0.5);
  transform: translateY(20px);
  transition:
    width 340ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 340ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

[data-kwugwo-root] [data-kwugwo-frame-inner] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #14B8A6;
}
[data-kwugwo-root][data-open="true"] [data-kwugwo-frame-wrap] { transform: translateY(0); }

/* Once the iframe signals ready, the wrap expands to full modal size */
[data-kwugwo-root][data-ready="true"] [data-kwugwo-frame-wrap] {
  width: min(980px, 100vw);
  height: min(720px, 100vh);
}

/* Iframe is always rendered at the FINAL target dimensions so the hosted page
   boots at desktop viewport (no reflow when the wrap expands). The wrap clips
   it during loading; iframe is invisible until ready. */
[data-kwugwo-root] iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: min(980px, 100vw);
  height: min(720px, 100vh);
  border: 0;
  background: #ffffff;
  visibility: hidden;
  display: block;
}
[data-kwugwo-root][data-ready="true"] iframe { visibility: visible; }

[data-kwugwo-root] [data-kwugwo-close] {
  position: absolute;
  top: -44px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: background 0.15s;
}
[data-kwugwo-root] [data-kwugwo-close]:hover { background: rgba(255, 255, 255, 0.25); }

[data-kwugwo-root] [data-kwugwo-countdown] {
  position: absolute;
  top: -44px;
  left: 0;
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  pointer-events: none;
  display: none;
  align-items: center;
}
[data-kwugwo-root] [data-kwugwo-countdown][data-visible="true"] { display: inline-flex; }

/* Loader = teal sidebar skeleton (mirrors the hosted-checkout sidebar) */
[data-kwugwo-root] [data-kwugwo-loader] {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 3rem 2.5rem;
  background: #14B8A6;
  color: #ffffff;
  pointer-events: none;
  z-index: 1;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  transition: opacity 250ms ease 80ms;
}

[data-kwugwo-root][data-ready="true"] [data-kwugwo-loader] {
  opacity: 0;
}

[data-kwugwo-root] [data-kwugwo-loader-bar] {
  background: rgba(255, 255, 255, 0.2);
  animation: kwugwo-pulse 1.5s ease-in-out infinite;
}

@keyframes kwugwo-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

@media (max-width: 820px) {
  [data-kwugwo-root] [data-kwugwo-frame-wrap],
  [data-kwugwo-root][data-ready="true"] [data-kwugwo-frame-wrap] {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
  }
  [data-kwugwo-root] [data-kwugwo-close] {
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.4);
  }
  [data-kwugwo-root] [data-kwugwo-countdown] {
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.4);
  }
}

html[data-kwugwo-locked] { overflow: hidden !important; }
`;
    document.head.appendChild(style);
}
