import { http } from './http';

const BASE = '/settings';

export const listSettings = () => http.get(BASE);

/** @param {{ key: string, value: string }[]} items */
export const updateSettings = (items) => http.put(BASE, { items });
