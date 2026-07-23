import { PUBLIC_API_URL } from '$env/static/public';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearSession } from '../stores/auth.js';

export const apiClient = axios.create({
	baseURL: PUBLIC_API_URL,
	withCredentials: true
});

function readCookie(name: string): string | undefined {
	if (typeof document === 'undefined') return undefined;
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : undefined;
}

apiClient.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	const csrfToken = readCookie('csrf_token');
	if (csrfToken && config.method && !['get', 'head', 'options'].includes(config.method)) {
		config.headers.set('x-csrf-token', csrfToken);
	}
	return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
	if (!refreshPromise) {
		refreshPromise = axios
			.post<{ data: { accessToken: string } }>(
				`${PUBLIC_API_URL}/auth/refresh`,
				{},
				{ withCredentials: true, headers: { 'x-csrf-token': readCookie('csrf_token') ?? '' } }
			)
			.then((res) => {
				const token = res.data.data.accessToken;
				setAccessToken(token);
				return token;
			})
			.catch(() => {
				clearSession();
				return null;
			})
			.finally(() => {
				refreshPromise = null;
			});
	}
	return refreshPromise;
}

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as
			(InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry &&
			!originalRequest.url?.includes('/auth/')
		) {
			originalRequest._retry = true;
			const newToken = await refreshAccessToken();
			if (newToken) {
				originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
				return apiClient(originalRequest);
			}
		}

		return Promise.reject(error);
	}
);

export function extractErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		if (data?.message) return data.message;
		if (error.message) return error.message;
	}
	if (error instanceof Error) return error.message;
	return 'Something went wrong. Please try again.';
}
