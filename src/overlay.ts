import { injectStyles } from './styles';

export interface OverlayHandle {
    root: HTMLDivElement;
    iframe: HTMLIFrameElement;
    onClose: () => void;
    markReady: () => void;
    destroy: () => void;
}

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
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => onCloseRequest());

    // Loader matches the hosted-checkout sidebar skeleton — teal panel with
    // pulsing white bars where the merchant name, amount, and details would land.
    const loader = document.createElement('div');
    loader.setAttribute('data-kwugwo-loader', '');

    const bars: Array<{ height: number; width: number; marginBottom?: number }> = [
        { height: 14, width: 140, marginBottom: 10 },
        { height: 52, width: 220, marginBottom: 40 },
        { height: 14, width: 80, marginBottom: 6 },
        { height: 18, width: 180, marginBottom: 32 },
        { height: 14, width: 100, marginBottom: 6 },
        { height: 18, width: 200 }
    ];

    bars.forEach(({ height, width, marginBottom }) => {
        const bar = document.createElement('div');
        bar.setAttribute('data-kwugwo-loader-bar', '');
        bar.style.height = `${height}px`;
        bar.style.width = `${width}px`;
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
