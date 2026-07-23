import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { toasts } from './toast.js';

describe('toast store', () => {
	it('pushes a success toast with the right variant', () => {
		toasts.success('Saved', 'Your changes were saved.');
		const list = get(toasts);
		const last = list[list.length - 1];
		expect(last.variant).toBe('success');
		expect(last.title).toBe('Saved');
		expect(last.message).toBe('Your changes were saved.');
	});

	it('dismiss removes the toast by id', () => {
		const id = toasts.error('Something broke');
		expect(get(toasts).some((t) => t.id === id)).toBe(true);
		toasts.dismiss(id);
		expect(get(toasts).some((t) => t.id === id)).toBe(false);
	});
});
