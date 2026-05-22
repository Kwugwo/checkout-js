import type {
    KwugwoInitOptions,
    KwugwoOpenOptions,
    CheckoutResult,
    SuccessResult,
    ErrorResult,
    ClosedResult
} from './types';
import { isKwugwoMessage, MESSAGE_SOURCE } from './messages';
import { createOverlay, type OverlayHandle } from './overlay';

const DEFAULT_BASE_URL = 'https://checkout.kwugwo.africa';

const UGWO_UID_RE = /^ugw\.[a-zA-Z0-9]{4}\.[a-zA-Z0-9_]{24}$/;

const SUCCESS_CLOSE_DELAY_SECONDS = 5;

export class KwugwoCheckoutInstance {
    private readonly publicKey: string;
    private readonly baseUrl: string;
    private overlay: OverlayHandle | null = null;
    private messageListener: ((e: MessageEvent) => void) | null = null;

    constructor(opts: KwugwoInitOptions) {
        if (!opts || typeof opts !== 'object') {
            throw new Error('[Kwugwo] init() requires an options object.');
        }
        if (!opts.publicKey || typeof opts.publicKey !== 'string' || !opts.publicKey.startsWith('pk.')) {
            throw new Error('[Kwugwo] init({ publicKey }) must be a string starting with "pk.".');
        }
        this.publicKey = opts.publicKey;
        this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    }

    open(options: KwugwoOpenOptions): Promise<CheckoutResult> {
        if (!options || typeof options !== 'object') {
            throw new Error('[Kwugwo] open() requires an options object.');
        }
        if (!options.ugwoUid || !UGWO_UID_RE.test(options.ugwoUid)) {
            throw new Error('[Kwugwo] open({ ugwoUid }) is required and must match ugw.XXXX.YYYY... format.');
        }
        if (typeof document === 'undefined') {
            throw new Error('[Kwugwo] open() must be called in a browser environment.');
        }

        const merchantOrigin = window.location.origin;
        if (merchantOrigin === 'null' || window.location.protocol === 'file:') {
            throw new Error(
                '[Kwugwo] Cannot run on file:// — postMessage requires a real origin. ' +
                'Serve this page over HTTP (e.g. `npx serve .` or `python3 -m http.server`) and reload.'
            );
        }

        if (this.overlay) {
            // already open — close existing first
            this.close();
        }

        const expectedOrigin = new URL(this.baseUrl).origin;
        const url = new URL(`${this.baseUrl}/${encodeURIComponent(options.ugwoUid)}`);
        url.searchParams.set('pk', this.publicKey);
        url.searchParams.set('embed', '1');
        url.searchParams.set('embed_origin', merchantOrigin);

        return new Promise<CheckoutResult>((resolve) => {
            let settled = false;
            let countdownTimer: ReturnType<typeof setTimeout> | null = null;
            let finalizeCountdown: (() => void) | null = null;

            const closeAndResolve = (result: CheckoutResult) => {
                if (countdownTimer !== null) {
                    clearTimeout(countdownTimer);
                    countdownTimer = null;
                }
                finalizeCountdown = null;
                this.teardown();
                if (result.type === 'success' && options.returnUrl) {
                    window.location.href = options.returnUrl;
                }
                resolve(result);
            };

            const finish = async (result: CheckoutResult) => {
                if (settled) return;
                settled = true;

                try {
                    if (result.type === 'success' && options.onSuccess) {
                        await options.onSuccess(result);
                    } else if (result.type === 'closed' && options.onClose) {
                        options.onClose();
                    } else if (result.type === 'error' && options.onError) {
                        options.onError(result);
                    }
                } catch (err) {
                    // user callback threw — surface to console but don't break flow
                    if (typeof console !== 'undefined') {
                        console.error('[Kwugwo] callback threw:', err);
                    }
                }

                if (result.type === 'success') {
                    let remaining = SUCCESS_CLOSE_DELAY_SECONDS;
                    this.overlay?.setCountdown(remaining);
                    finalizeCountdown = () => closeAndResolve(result);
                    const tick = () => {
                        remaining -= 1;
                        if (remaining <= 0) {
                            closeAndResolve(result);
                        } else {
                            this.overlay?.setCountdown(remaining);
                            countdownTimer = setTimeout(tick, 1000);
                        }
                    };
                    countdownTimer = setTimeout(tick, 1000);
                    return;
                }

                closeAndResolve(result);
            };

            const requestClose = () => {
                // After success, the countdown is running and `settled` is true —
                // honor an explicit close (ESC/backdrop/×) by closing immediately
                // with the original success result rather than swallowing the click.
                if (finalizeCountdown) {
                    finalizeCountdown();
                    return;
                }
                finish({ type: 'closed', ugwoUid: options.ugwoUid } as ClosedResult);
            };

            this.overlay = createOverlay(url.toString(), requestClose);

            this.messageListener = (event: MessageEvent) => {
                if (event.origin !== expectedOrigin) return;
                if (event.source !== this.overlay?.iframe.contentWindow) return;
                if (!isKwugwoMessage(event.data)) return;

                const payload = (event.data.payload || {}) as Record<string, unknown>;

                switch (event.data.type) {
                    case 'ready':
                        this.overlay?.markReady();
                        break;
                    case 'success':
                        finish({
                            type: 'success',
                            ugwoUid: options.ugwoUid,
                            activityUid: typeof payload.activityUid === 'string' ? payload.activityUid : undefined
                        } as SuccessResult);
                        break;
                    case 'error':
                        finish({
                            type: 'error',
                            ugwoUid: options.ugwoUid,
                            code: typeof payload.code === 'string' ? payload.code : 'unknown',
                            message: typeof payload.message === 'string' ? payload.message : 'Checkout failed'
                        } as ErrorResult);
                        break;
                    case 'close':
                        requestClose();
                        break;
                }
            };

            window.addEventListener('message', this.messageListener);
        });
    }

    close(): void {
        if (this.overlay) {
            this.teardown();
        }
    }

    private teardown(): void {
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
    }
}

export const KwugwoCheckout = {
    init(opts: KwugwoInitOptions): KwugwoCheckoutInstance {
        return new KwugwoCheckoutInstance(opts);
    },
    MESSAGE_SOURCE
};
