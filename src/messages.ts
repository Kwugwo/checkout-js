// postMessage protocol between embedded checkout iframe and the merchant SDK.
// All messages share a `source: 'kwugwo'` tag so we don't collide with other
// embeds or browser extensions sending postMessage events.

export const MESSAGE_SOURCE = 'kwugwo';

export type IncomingMessageType =
    | 'ready'
    | 'success'
    | 'error'
    | 'close';

export interface IncomingMessage {
    source: typeof MESSAGE_SOURCE;
    type: IncomingMessageType;
    payload?: Record<string, unknown>;
}

export function isKwugwoMessage(data: unknown): data is IncomingMessage {
    if (!data || typeof data !== 'object') return false;
    const m = data as Partial<IncomingMessage>;
    return m.source === MESSAGE_SOURCE && typeof m.type === 'string';
}
