import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
	id: string;
	variant: ToastVariant;
	title: string;
	message?: string;
	duration: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function dismiss(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	function push(variant: ToastVariant, title: string, message?: string, duration = 5000) {
		const id = crypto.randomUUID();
		update((toasts) => [...toasts, { id, variant, title, message, duration }]);
		if (duration > 0) {
			setTimeout(() => dismiss(id), duration);
		}
		return id;
	}

	return {
		subscribe,
		dismiss,
		success: (title: string, message?: string) => push('success', title, message),
		error: (title: string, message?: string) => push('danger', title, message),
		warning: (title: string, message?: string) => push('warning', title, message),
		info: (title: string, message?: string) => push('info', title, message)
	};
}

export const toasts = createToastStore();
