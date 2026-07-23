import { derived, writable, get } from 'svelte/store';

export interface EmployeeSummary {
	id: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	photoUrl?: string | null;
	department?: { id: string; name: string } | null;
	designation?: { id: string; title: string } | null;
	branch?: { id: string; name: string } | null;
}

export interface AuthUser {
	id: string;
	email: string;
	mustChangePassword: boolean;
	mfaEnabled: boolean;
	roles: string[];
	permissions: string[];
	employee: EmployeeSummary | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
	status: AuthStatus;
	user: AuthUser | null;
}

// The access token lives in module-level memory only — never localStorage —
// so a stored XSS payload can't exfiltrate it; only the httpOnly refresh
// cookie persists across reloads, and a fresh access token is re-minted from
// it on boot via /auth/refresh.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
	return accessToken;
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({ status: 'idle', user: null });

	return {
		subscribe,
		setLoading() {
			update((s) => ({ ...s, status: 'loading' }));
		},
		setAuthenticated(user: AuthUser, token: string) {
			setAccessToken(token);
			set({ status: 'authenticated', user });
		},
		setUnauthenticated() {
			setAccessToken(null);
			set({ status: 'unauthenticated', user: null });
		},
		get(): AuthState {
			return get({ subscribe });
		}
	};
}

export const authStore = createAuthStore();

export function clearSession(): void {
	authStore.setUnauthenticated();
}

export const currentUser = derived(authStore, ($auth) => $auth.user);
export const isAuthenticated = derived(authStore, ($auth) => $auth.status === 'authenticated');

export function hasPermission(permissionKey: string): boolean {
	const state = authStore.get();
	return state.user?.permissions.includes(permissionKey) ?? false;
}

export function hasAnyPermission(...permissionKeys: string[]): boolean {
	const state = authStore.get();
	if (!state.user) return false;
	return permissionKeys.some((key) => state.user!.permissions.includes(key));
}

export function isSuperAdmin(): boolean {
	const state = authStore.get();
	return state.user?.roles.includes('super_admin') ?? false;
}
