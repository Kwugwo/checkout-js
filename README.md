# @kwugwo/checkout-js

The official embed SDK for [Kwugwo](https://kwugwo.com) Checkout. Drops a payment overlay onto any website — no React, no framework, ~5 KB gzipped.

The merchant's backend creates an `ugwo` (payment session) and returns its `uid` to the frontend. This SDK opens an iframe overlay pointed at the hosted checkout, listens for the result, and fires your callbacks.

## Install

```bash
npm install @kwugwo/checkout
```

Or via script tag:

```html
<script src="https://cdn.kwugwo.com/checkout-js/v1/kwugwo-checkout.global.js"></script>
```

## Usage

### ES modules

```js
import { KwugwoCheckout } from '@kwugwo/checkout-js';

const checkout = KwugwoCheckout.init({
    publicKey: 'pk.live.YOUR_PUBLIC_KEY'
});

document.getElementById('pay').addEventListener('click', async () => {
    // 1. Your backend creates the ugwo and returns its uid
    const { ugwoUid } = await fetch('/checkout/create', { method: 'POST' }).then(r => r.json());

    // 2. Open the checkout overlay
    const result = await checkout.open({
        ugwoUid,
        returnUrl: 'https://merchant.com/thanks',
        onSuccess: ({ activityUid }) => console.log('Paid', activityUid),
        onClose: () => console.log('User closed the modal'),
        onError: (e) => console.error(e.code, e.message)
    });

    // result is { type: 'success' | 'closed' | 'error', ... }
});
```

### Script tag

```html
<script src="https://cdn.kwugwo.com/checkout-js/v1/kwugwo-checkout.global.js"></script>
<script>
    var checkout = KwugwoCheckout.init({ publicKey: 'pk.live.YOUR_PUBLIC_KEY' });

    document.getElementById('pay').onclick = function () {
        checkout.open({
            ugwoUid: 'ugw.XXXX.YYYYYYYYYYYYYYYYYYYYYYYY',
            onSuccess: function (r) { console.log('paid', r); }
        });
    };
</script>
```

## API

### `KwugwoCheckout.init(options)`

| Option       | Type     | Required | Default                          | Description                                                |
|--------------|----------|----------|----------------------------------|------------------------------------------------------------|
| `publicKey`  | `string` | yes      | —                                | Merchant public key. Must start with `pk.`.                |
| `baseUrl`    | `string` | no       | `https://checkout.kwugwo.com`    | Override the hosted-checkout origin (useful for staging).  |

Returns a `KwugwoCheckoutInstance`.

### `instance.open(options)` → `Promise<CheckoutResult>`

| Option       | Type                              | Required | Description                                                                                      |
|--------------|-----------------------------------|----------|--------------------------------------------------------------------------------------------------|
| `ugwoUid`    | `string`                          | yes      | Ugwo session uid (e.g. `ugw.XXXX.YYYY...`). Created by your backend.                             |
| `returnUrl`  | `string`                          | no       | If set, the parent window navigates here after a successful payment.                             |
| `onSuccess`  | `(result) => void` &#124; Promise | no       | Fires on successful payment. The promise is awaited before redirecting to `returnUrl`.           |
| `onClose`    | `() => void`                      | no       | Fires when the user dismisses the modal without completing payment.                              |
| `onError`    | `(err) => void`                   | no       | Fires when the checkout cannot complete (invalid session, expired, network, etc).                |

The returned promise always resolves (never rejects) with one of:

- `{ type: 'success', ugwoUid, activityUid? }`
- `{ type: 'closed', ugwoUid }`
- `{ type: 'error', ugwoUid?, code, message }`

### `instance.close()`

Programmatically dismiss the overlay (fires `onClose`).

## How it works

The SDK injects a fixed-position overlay with an iframe pointed at `${baseUrl}/${ugwoUid}?pk=${publicKey}&embed=1&embed_origin=${merchantOrigin}`. The hosted checkout runs entirely on Kwugwo's origin — card and bank-transfer data never touch the merchant's page. Outcomes flow back via `postMessage` events tagged `{ source: 'kwugwo', type, payload }`. All messages are validated against the configured `baseUrl` origin.

The overlay handles:

- Backdrop click → close
- Escape key → close
- Body scroll lock while open
- Loading spinner until the iframe fires `ready`
- Responsive sizing (desktop modal, full-screen on mobile)

## Browser support

ES2020 targets — Chrome 80+, Edge 80+, Firefox 74+, Safari 13.1+. No polyfills needed for modern browsers; if you support older targets, bundle through your existing toolchain.
