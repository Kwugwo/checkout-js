// IIFE entry — exposes a flat `KwugwoCheckout.init(...)` API on `window`.
import { KwugwoCheckout as KwugwoCheckoutNs } from './checkout';

export const init = KwugwoCheckoutNs.init;
export const MESSAGE_SOURCE = KwugwoCheckoutNs.MESSAGE_SOURCE;
