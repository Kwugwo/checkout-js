export interface KwugwoInitOptions {
    /** Merchant public key. Must start with "pk.". */
    publicKey: string;
    /** Override the hosted-checkout origin. Defaults to https://checkout.kwugwo.com */
    baseUrl?: string;
}

export interface KwugwoOpenOptions {
    /** Ugwo session ID generated server-side (e.g. ugw.XXXX.YYYY...). */
    ugwoUid: string;
    /** Optional URL to navigate the parent window to after a successful payment. */
    returnUrl?: string;
    /** Fires when the payment completes successfully. */
    onSuccess?: (result: SuccessResult) => void | Promise<void>;
    /** Fires when the user closes the checkout before completing. */
    onClose?: () => void;
    /** Fires when an error prevents the checkout from completing. */
    onError?: (error: ErrorResult) => void;
}

export interface SuccessResult {
    type: 'success';
    ugwoUid: string;
    activityUid?: string;
}

export interface ClosedResult {
    type: 'closed';
    ugwoUid: string;
}

export interface ErrorResult {
    type: 'error';
    code: string;
    message: string;
    ugwoUid?: string;
}

export type CheckoutResult = SuccessResult | ClosedResult | ErrorResult;
