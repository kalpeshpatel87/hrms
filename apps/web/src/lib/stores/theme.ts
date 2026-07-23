import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Direction = 'ltr' | 'rtl';

const THEME_KEY = 'atyantik:theme';
const DIR_KEY = 'atyantik:dir';

function readInitialTheme(): ThemePreference {
	if (!browser) return 'system';
	return (localStorage.getItem(THEME_KEY) as ThemePreference | null) ?? 'system';
}

function readInitialDir(): Direction {
	if (!browser) return 'ltr';
	return (localStorage.getItem(DIR_KEY) as Direction | null) ?? 'ltr';
}

function applyTheme(theme: ThemePreference) {
	if (!browser) return;
	const root = document.documentElement;

	if (theme === 'system') {
		root.removeAttribute('data-theme');
	} else {
		root.setAttribute('data-theme', theme);
	}

	// Bootstrap 5.3's own component styles (form-control, card, etc.) only
	// react to `data-bs-theme`, which — unlike our custom `data-theme` — has
	// no OS-level "system" value, so resolve it explicitly here.
	const resolved =
		theme === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: theme;
	root.setAttribute('data-bs-theme', resolved);
}

function applyDirection(dir: Direction) {
	if (!browser) return;
	document.documentElement.setAttribute('dir', dir);
}

function createThemeStore() {
	const { subscribe, set } = writable<ThemePreference>(readInitialTheme());

	return {
		subscribe,
		set(theme: ThemePreference) {
			set(theme);
			if (browser) localStorage.setItem(THEME_KEY, theme);
			applyTheme(theme);
		},
		init() {
			const theme = readInitialTheme();
			set(theme);
			applyTheme(theme);

			if (browser) {
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
					if (readInitialTheme() === 'system') applyTheme('system');
				});
			}
		}
	};
}

function createDirectionStore() {
	const { subscribe, set } = writable<Direction>(readInitialDir());

	return {
		subscribe,
		set(dir: Direction) {
			set(dir);
			if (browser) localStorage.setItem(DIR_KEY, dir);
			applyDirection(dir);
		},
		init() {
			const dir = readInitialDir();
			set(dir);
			applyDirection(dir);
		}
	};
}

export const theme = createThemeStore();
export const direction = createDirectionStore();
