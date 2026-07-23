import { expect, test } from '@playwright/test';

test.describe('unauthenticated access', () => {
	test('visiting the app root redirects to /login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login$/);
	});

	test('visiting a protected route redirects to /login', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login$/);
	});
});

test.describe('login page', () => {
	test('renders the sign-in form', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveTitle(/Sign in/);
		await expect(page.getByLabel('Work email')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	});

	test('shows an error message when the API rejects the credentials', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Work email').fill('nobody@atyantik.com');
		await page.getByLabel('Password').fill('wrong-password');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
	});
});
