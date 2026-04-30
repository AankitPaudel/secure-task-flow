import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: 'SecureTaskFlow' })).toBeVisible();
}

test('shows login form', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'SecureTaskFlow' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('owner can create and edit a task', async ({ page }) => {
  await login(page, 'owner@acme.com');

  const title = `Portfolio task ${Date.now()}`;
  const editedTitle = `${title} edited`;

  await page.getByRole('button', { name: /\+ new task/i }).click();
  await page.locator('input[name="title"]').fill(title);
  await page.locator('textarea[name="description"]').fill('Created by Playwright');
  await page.getByRole('button', { name: /create task/i }).click();

  await expect(page.getByText(title)).toBeVisible();

  const taskCard = page.locator('.task-card').filter({ hasText: title });
  await taskCard.getByLabel('Edit task').click();
  await page.locator('input[name="editTitle"]').fill(editedTitle);
  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByText(editedTitle)).toBeVisible();
});

test('viewer sees read-only dashboard controls', async ({ page }) => {
  await login(page, 'viewer@acme.com');

  await expect(page.getByRole('button', { name: /\+ new task/i })).toHaveCount(0);
  await expect(page.getByLabel('Edit task')).toHaveCount(0);
  await expect(page.getByLabel('Delete task')).toHaveCount(0);
});

test('owner can open audit log panel', async ({ page }) => {
  await login(page, 'owner@acme.com');

  await page.getByRole('button', { name: /audit log/i }).click();

  await expect(page.getByRole('heading', { name: /recent activity/i })).toBeVisible();
  await expect(page.getByText(/last 100 scoped events/i)).toBeVisible();
});
