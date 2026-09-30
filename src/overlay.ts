import { injectStyles } from './styles';

export interface OverlayHandle {
    root: HTMLDivElement;
    iframe: HTMLIFrameElement;
    onClose: () => void;
    markReady: () => void;
    setContentHeight: (height: number | null) => void;
    setCountdown: (seconds: number | null) => void;
    setTheme: (theme: 'light' | 'dark' | null, slab: string | null) => void;
    destroy: () => void;
}

// Linearicons Free "cross", the icon set the hosted checkout uses.
const CROSS_PATH =
    'M548.203 537.6l289.099-289.098c9.998-9.998 9.998-26.206 0-36.205-9.997-9.997-26.206-9.997-36.203 0l-289.099 289.099-289.098-289.099c-9.998-9.997-26.206-9.997-36.205 0-9.997 9.998-9.997 26.206 0 36.205l289.099 289.098-289.099 289.099c-9.997 9.997-9.997 26.206 0 36.203 5 4.998 11.55 7.498 18.102 7.498s13.102-2.499 18.102-7.499l289.098-289.098 289.099 289.099c4.998 4.998 11.549 7.498 18.101 7.498s13.102-2.499 18.101-7.499c9.998-9.997 9.998-26.206 0-36.203l-289.098-289.098z';

const SVG_NS = 'http://www.w3.org/2000/svg';

function crossIcon(): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1024 1024');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', CROSS_PATH);
    svg.appendChild(path);
    return svg;
}

const HEX_COLOUR_RE = /^#[0-9a-fA-F]{6}$/;

export function createOverlay(iframeSrc: string, onCloseRequest: () => void): OverlayHandle {
    injectStyles();

    const root = document.createElement('div');
    root.setAttribute('data-kwugwo-root', '');
    root.setAttribute('data-open', 'false');
    root.setAttribute('data-ready', 'false');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Kwugwo Checkout');

    const backdrop = document.createElement('div');
    backdrop.setAttribute('data-kwugwo-backdrop', '');
    backdrop.addEventListener('click', () => onCloseRequest());

    const frameWrap = document.createElement('div');
    frameWrap.setAttribute('data-kwugwo-frame-wrap', '');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('data-kwugwo-close', '');
    closeBtn.setAttribute('aria-label', 'Close checkout');
    closeBtn.appendChild(crossIcon());
    closeBtn.addEventListener('click', () => onCloseRequest());

    const countdown = document.createElement('div');
    countdown.setAttribute('data-kwugwo-countdown', '');
    countdown.setAttribute('role', 'status');
    countdown.setAttribute('aria-live', 'polite');

    // Loader matches the hosted checkout's summary skeleton: the mint band
    // with bars where the merchant, amount and customer land, and the
    // reference pushed to the bottom.
    const loader = document.createElement('div');
    loader.setAttribute('data-kwugwo-loader', '');

    const bars: Array<{ height: number; width: string; marginBottom?: number; push?: boolean }> = [
        { height: 14, width: '62%', marginBottom: 14 },
        { height: 38, width: '80%', marginBottom: 28 },
        { height: 11, width: '64px', marginBottom: 10 },
        { height: 13, width: '96px', marginBottom: 10 },
        { height: 13, width: '170px' },
        { height: 11, width: '72%', push: true }
    ];

    bars.forEach(({ height, width, marginBottom, push }) => {
        const bar = document.createElement('div');
        bar.setAttribute('data-kwugwo-loader-bar', '');
        if (push) bar.setAttribute('data-push', '');
        bar.style.height = `${height}px`;
        bar.style.width = width;
        if (marginBottom) bar.style.marginBottom = `${marginBottom}px`;
        loader.appendChild(bar);
    });

    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.title = 'Kwugwo Checkout';
    iframe.allow = 'payment *';
    // Note: not setting `sandbox` because the hosted checkout calls its own
    // backend, posts to its parent, and needs same-origin storage for theme
    // persistence. The iframe is on a separate origin from the merchant.

    // Fallback ready signal: hide the spinner once the iframe document loads,
    // even if no `ready` postMessage arrives. The postMessage path is still
    // preferred (and may set data-ready first), but this prevents an indefinite
    // loading state if the embedded page is an older build, an error page, etc.
    iframe.addEventListener('load', () => {
        root.setAttribute('data-ready', 'true');
    });

    // frameInner holds the iframe + loader and does the clipping during the
    // loading phase. The close button stays on frameWrap (outside the clip box)
    // so its top:-44px placement above the modal isn't cut off.
    const frameInner = document.createElement('div');
    frameInner.setAttribute('data-kwugwo-frame-inner', '');
    frameInner.appendChild(iframe);
    frameInner.appendChild(loader);

    frameWrap.appendChild(countdown);
    frameWrap.appendChild(closeBtn);
    frameWrap.appendChild(frameInner);
    root.appendChild(backdrop);
    root.appendChild(frameWrap);

    document.body.appendChild(root);
    document.documentElement.setAttribute('data-kwugwo-locked', '');

    // Trigger transition next frame
    requestAnimationFrame(() => {
        root.setAttribute('data-open', 'true');
    });

    // ESC key closes
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCloseRequest();
    };
    document.addEventListener('keydown', onKeyDown);

    return {
        root,
        iframe,
        onClose: onCloseRequest,
        markReady: () => root.setAttribute('data-ready', 'true'),
        // The hosted page reports how tall its content actually is; the
        // stylesheet turns that into the frame height (floored at the default
        // modal height, capped at the viewport). Passing null restores the
        // default — used when nothing has been reported yet.
        setContentHeight: (height: number | null) => {
            if (height === null || !Number.isFinite(height) || height <= 0) {
                root.style.removeProperty('--kwugwo-content-height');
                return;
            }
            root.style.setProperty('--kwugwo-content-height', `${Math.ceil(height)}px`);
        },
        setCountdown: (seconds: number | null) => {
            if (seconds === null) {
                countdown.removeAttribute('data-visible');
                countdown.textContent = '';
                return;
            }
            const label = seconds === 1 ? 'second' : 'seconds';
            countdown.textContent = `Closing in ${seconds} ${label}…`;
            countdown.setAttribute('data-visible', 'true');
        },
        // The hosted page reports its theme and the accent-line colour it
        // is using (Kwugwo teal, or the processor's), so the frame's slab and
        // loader match what's inside. null falls back to the OS preference
        // and Kwugwo teal.
        setTheme: (theme: 'light' | 'dark' | null, slab: string | null) => {
            if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
            else root.removeAttribute('data-theme');
            if (slab && HEX_COLOUR_RE.test(slab)) root.style.setProperty('--kwugwo-slab-reported', slab);
            else root.style.removeProperty('--kwugwo-slab-reported');
        },
        destroy: () => {
            document.removeEventListener('keydown', onKeyDown);
            root.setAttribute('data-open', 'false');
            // Wait for the fade-out before removing
            setTimeout(() => {
                root.remove();
                if (!document.querySelector('[data-kwugwo-root]')) {
                    document.documentElement.removeAttribute('data-kwugwo-locked');
                }
            }, 200);
        }
    };
}
