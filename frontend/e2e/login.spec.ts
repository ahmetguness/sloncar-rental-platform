import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test('should login successfully as admin', async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    
    // Navigate to admin login (manual URL for now as it might not be in nav)
    await page.goto('/admin/login');
    
    // Expect page to contain "Yönetici Paneli"
    await expect(page.getByText('Yönetici Paneli')).toBeVisible();
    
    // Fill the login form
    await page.getByPlaceholder('admin@example.com').fill('admin@test.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    
    // Click "Giriş Yap"
    // Note: We need a way to mock the API response for real E2E to pass without a backend
    // Or we rely on the backend if it's running. 
    // For this demonstration, I'll mock the API at the browser level if possible or just show the flow.
    
    await page.route(/\/api\/auth\/login$/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'fake-jwt-token',
          user: { id: '1', name: 'Admin User', role: 'ADMIN' }
        }),
      });
    });

    await page.getByRole('button', { name: /giriş yap/i }).click();
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Admin Panel')).toBeVisible();
  });

  test('should show error on failed login', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Hatalı e-posta veya şifre' }),
      });
    });

    await page.getByPlaceholder('admin@example.com').fill('wrong@test.com');
    await page.getByPlaceholder('••••••••').fill('wrongpass');
    await page.getByRole('button', { name: /giriş yap/i }).click();
    
    await expect(page.getByText('Hatalı e-posta veya şifre')).toBeVisible();
  });
});
