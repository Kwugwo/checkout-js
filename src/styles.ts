// Single namespaced stylesheet, injected once per page. All selectors are
// scoped by [data-kwugwo-root] so merchant CSS cannot accidentally style them
// and we cannot accidentally style merchant elements.
//
// The look follows the hosted checkout: square edges everywhere, depth from
// hard offset shadows rather than blurred ones, mint summary band, teal
// accents. The frame carries the checkout's 14px offset slab (the hosted page
// drops its own in embed mode); its colour follows the page's accent, which a
// payment processor can take over, via the `theme` message.

const STYLE_ID = 'kwugwo-checkout-styles';

export function injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
@property --kwugwo-slab { syntax: '<color>'; inherits: true; initial-value: #BFE9E1; }

[data-kwugwo-root] {
  --kwugwo-surface: #FFFFFF;
  --kwugwo-wash: #D9FCF7;
  --kwugwo-bar: #BFE9E1;
  --kwugwo-sheen: rgba(255, 255, 255, 0.55);
  --kwugwo-hard: #001915;
  --kwugwo-backdrop: rgba(0, 25, 21, 0.5);
  --kwugwo-accent: #14B8A6;
  /* The accent-line colour of the page, reported by the hosted checkout.
     Falls back to Kwugwo teal for the current theme. */
  --kwugwo-slab: var(--kwugwo-slab-reported, #BFE9E1);
  --kwugwo-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --kwugwo-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* --kwugwo-content-height is set inline from the hosted page's resize
     message. The frame never shrinks below the default modal height and never
     grows past the viewport (less room for the close button above it), so a
     page taller than the screen still scrolls internally. The 96px reserve is
     split above and below by the centering, leaving room for the close button
     that sits 48px above the frame and the 14px slab below it. */
  --kwugwo-frame-height: min(max(720px, var(--kwugwo-content-height, 720px)), calc(100vh - 96px));
  /* Leaves room on the right for the offset slab. */
  --kwugwo-frame-width: min(980px, calc(100vw - 48px));
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 180ms ease, --kwugwo-slab 1.6s var(--kwugwo-ease);
  font-family: 'Mona Sans', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
[data-kwugwo-root][data-open="true"] { opacity: 1; }

/* Before the hosted page reports its theme, follow the OS preference. */
@media (prefers-color-scheme: dark) {
  [data-kwugwo-root]:not([data-theme="light"]) {
    --kwugwo-surface: #0B2326;
    --kwugwo-wash: #0F3331;
    --kwugwo-bar: #1E4845;
    --kwugwo-sheen: rgba(255, 255, 255, 0.07);
    --kwugwo-hard: #000000;
    --kwugwo-backdrop: rgba(2, 10, 11, 0.7);
    --kwugwo-accent: #2DD4BF;
    --kwugwo-slab: var(--kwugwo-slab-reported, #1E4845);
  }
}
[data-kwugwo-root][data-theme="dark"] {
  --kwugwo-surface: #0B2326;
  --kwugwo-wash: #0F3331;
  --kwugwo-bar: #1E4845;
  --kwugwo-sheen: rgba(255, 255, 255, 0.07);
  --kwugwo-hard: #000000;
  --kwugwo-backdrop: rgba(2, 10, 11, 0.7);
  --kwugwo-accent: #2DD4BF;
  --kwugwo-slab: var(--kwugwo-slab-reported, #1E4845);
}

[data-kwugwo-root] [data-kwugwo-backdrop] {
  position: absolute;
  inset: 0;
  background: var(--kwugwo-backdrop);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

[data-kwugwo-root] [data-kwugwo-frame-wrap] {
  position: relative;
  width: 340px;
  max-width: 100%;
  height: 570px;
  max-height: 100vh;
  box-shadow: 14px 14px 0 var(--kwugwo-slab);
  transform: translate(0, 20px);
  transition:
    width 340ms var(--kwugwo-ease),
    height 340ms var(--kwugwo-ease),
    transform 220ms var(--kwugwo-ease);
}

[data-kwugwo-root] [data-kwugwo-frame-inner] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--kwugwo-wash);
}
[data-kwugwo-root][data-open="true"] [data-kwugwo-frame-wrap] { transform: translate(0, 0); }

/* Once the iframe signals ready, the wrap expands to full modal size */
[data-kwugwo-root][data-ready="true"] [data-kwugwo-frame-wrap] {
  width: var(--kwugwo-frame-width);
  height: var(--kwugwo-frame-height);
}

/* Iframe is always rendered at the FINAL target dimensions so the hosted page
   boots at desktop viewport (no reflow when the wrap expands). The wrap clips
   it during loading; iframe is invisible until ready. It tracks the same
   height as the wrap so the hosted page's viewport matches the frame — that's
   what keeps long content from scrolling inside it. */
[data-kwugwo-root] iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--kwugwo-frame-width);
  height: var(--kwugwo-frame-height);
  border: 0;
  background: var(--kwugwo-surface);
  color-scheme: normal;
  visibility: hidden;
  display: block;
}
[data-kwugwo-root][data-ready="true"] iframe { visibility: visible; }

/* Close and countdown sit on the backdrop above the frame: square, outlined,
   and the close button lifts onto a hard shadow like the checkout's buttons. */
[data-kwugwo-root] [data-kwugwo-close] {
  position: absolute;
  top: -48px;
  right: 0;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 25, 21, 0.35);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    transform 0.3s var(--kwugwo-bounce),
    box-shadow 0.3s var(--kwugwo-bounce);
}
[data-kwugwo-root] [data-kwugwo-close] svg {
  display: block;
  transition: transform 0.3s var(--kwugwo-bounce);
}
[data-kwugwo-root] [data-kwugwo-close]:focus-visible {
  outline: 3px solid var(--kwugwo-accent);
  outline-offset: 2px;
}
@media (hover: hover) {
  [data-kwugwo-root] [data-kwugwo-close]:hover,
  [data-kwugwo-root] [data-kwugwo-close]:focus-visible {
    background: rgba(0, 25, 21, 0.6);
    border-color: #ffffff;
    transform: translate(-2px, -2px);
    box-shadow: 3px 3px 0 var(--kwugwo-slab);
  }
  [data-kwugwo-root] [data-kwugwo-close]:hover svg,
  [data-kwugwo-root] [data-kwugwo-close]:focus-visible svg { transform: rotate(90deg); }
}
[data-kwugwo-root] [data-kwugwo-close]:active {
  transform: translate(0, 0);
  box-shadow: 0 0 0 var(--kwugwo-slab);
}

[data-kwugwo-root] [data-kwugwo-countdown] {
  position: absolute;
  top: -48px;
  left: 0;
  height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 25, 21, 0.35);
  color: #ffffff;
  font-size: 13px;
  font-weight: 550;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  display: none;
  align-items: center;
}
[data-kwugwo-root] [data-kwugwo-countdown][data-visible="true"] { display: inline-flex; }

/* Loader mirrors the hosted checkout's summary skeleton: the mint band with
   square bars where the merchant, amount and customer land, a sheen passing
   over them, and the reference at the bottom. */
[data-kwugwo-root] [data-kwugwo-loader] {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 2.5rem 2.25rem 2rem;
  background: var(--kwugwo-wash);
  pointer-events: none;
  z-index: 1;
  transition: opacity 250ms ease 80ms;
}

[data-kwugwo-root][data-ready="true"] [data-kwugwo-loader] {
  opacity: 0;
}

[data-kwugwo-root] [data-kwugwo-loader-bar] {
  position: relative;
  overflow: hidden;
  max-width: 100%;
  background: var(--kwugwo-bar);
}
[data-kwugwo-root] [data-kwugwo-loader-bar][data-push] { margin-top: auto; }
[data-kwugwo-root] [data-kwugwo-loader-bar]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, var(--kwugwo-sheen) 50%, transparent 70%);
  transform: translateX(-100%);
  animation: kwugwo-sheen 1.6s var(--kwugwo-ease) infinite;
}

@keyframes kwugwo-sheen {
  to { transform: translateX(100%); }
}

/* Phones and narrow windows: the checkout goes full screen, as the hosted
   page does, so there's no room (or need) for the slab. */
@media (max-width: 820px) {
  [data-kwugwo-root] [data-kwugwo-frame-wrap],
  [data-kwugwo-root][data-ready="true"] [data-kwugwo-frame-wrap] {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    box-shadow: none;
  }
  /* The iframe is sized for the desktop modal, but the full-screen mobile
     modal is taller than 720px on most phones. Without this the iframe stays
     720px tall and the frame-inner background shows as a band below it. */
  [data-kwugwo-root] iframe {
    width: 100%;
    height: 100%;
  }
  [data-kwugwo-root] [data-kwugwo-loader] {
    padding: 1.5rem 16px 1.25rem;
  }
  /* Over the page's own header now, so solid rather than see-through, and
     44px to stay an easy tap. */
  [data-kwugwo-root] [data-kwugwo-close] {
    top: 12px;
    right: 12px;
    width: 44px;
    height: 44px;
    background: rgba(0, 25, 21, 0.7);
  }
  [data-kwugwo-root] [data-kwugwo-countdown] {
    top: 12px;
    left: 12px;
    height: 44px;
    background: rgba(0, 25, 21, 0.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-kwugwo-root],
  [data-kwugwo-root] *,
  [data-kwugwo-root] *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

html[data-kwugwo-locked] { overflow: hidden !important; }
`;
    document.head.appendChild(style);
}
