import { test, expect } from '@playwright/test';

test('shows login form', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Task Manager' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
