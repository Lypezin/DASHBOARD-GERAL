export const JSON_HEADERS = {
    'Content-Type': 'application/json',
} as const;

export const INTERNAL_FETCH_OPTIONS = {
    credentials: 'same-origin',
    cache: 'no-store',
} as const satisfies Pick<RequestInit, 'credentials' | 'cache'>;
