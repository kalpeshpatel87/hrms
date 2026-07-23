import { apiClient } from '../../services/api-client.js';
import { authStore, setAccessToken, type AuthUser } from '../../stores/auth.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	message?: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
	const res = await apiClient.post<ApiEnvelope<{ accessToken: string; user: AuthUser }>>(
		'/auth/login',
		{
			email,
			password
		}
	);
	const { accessToken, user } = res.data.data;
	authStore.setAuthenticated(user, accessToken);
	return user;
}

export async function logout(): Promise<void> {
	try {
		await apiClient.post('/auth/logout');
	} finally {
		authStore.setUnauthenticated();
	}
}

/** Called once on app boot to silently resume a session from the httpOnly refresh cookie. */
export async function resumeSession(): Promise<AuthUser | null> {
	authStore.setLoading();
	try {
		const refreshRes = await apiClient.post<ApiEnvelope<{ accessToken: string }>>('/auth/refresh');
		setAccessToken(refreshRes.data.data.accessToken);

		const meRes = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me');
		authStore.setAuthenticated(meRes.data.data, refreshRes.data.data.accessToken);
		return meRes.data.data;
	} catch {
		authStore.setUnauthenticated();
		return null;
	}
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
	await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}

export async function forgotPassword(email: string): Promise<void> {
	await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
	await apiClient.post('/auth/reset-password', { token, newPassword });
}
