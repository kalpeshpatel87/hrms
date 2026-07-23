import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const COLLAPSED_KEY = 'atyantik:sidebar-collapsed';

function readInitial(): boolean {
	if (!browser) return false;
	return localStorage.getItem(COLLAPSED_KEY) === '1';
}

function createSidebarStore() {
	const { subscribe, update, set } = writable<boolean>(readInitial());

	return {
		subscribe,
		toggle() {
			update((collapsed) => {
				const next = !collapsed;
				if (browser) localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
				return next;
			});
		},
		set(collapsed: boolean) {
			set(collapsed);
			if (browser) localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
		}
	};
}

export const sidebarCollapsed = createSidebarStore();
export const mobileSidebarOpen = writable(false);
