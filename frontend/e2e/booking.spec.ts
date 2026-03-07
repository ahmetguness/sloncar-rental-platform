import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock API responses at the browser level
        await page.route('**/api/cars*', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: [
                            {
                                id: 'car-123',
                                brand: 'Volkswagen',
                                model: 'Passat',
                                dailyPrice: 1500,
                                images: [],
                                transmission: 'AUTO',
                                fuel: 'DIESEL',
                                seats: 5,
                                status: 'ACTIVE',
                                type: 'RENTAL'
                            }
                        ],
                        pagination: { total: 1, totalPages: 1 }
                    })
                });
            }
        });

        await page.route('**/api/brands/admin', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ id: '1', name: 'Volkswagen', logoUrl: '' }])
            });
        });

        await page.route('**/api/cars/used-brands*', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify([{ name: 'Volkswagen' }]) });
        });

        await page.route('**/api/cars/used-categories*', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify(['Sedan']) });
        });
    });

    test('should complete a car booking from home page', async ({ page }) => {
        await page.goto('/');

        // Wait for car list
        await expect(page.getByText('Passat')).toBeVisible();

        // Click on Kirala button (in CarCard)
        await page.getByRole('button', { name: /KİRALA/i }).click();

        // Should navigate to booking page
        await expect(page).toHaveURL(/\/book\/car-123/);

        // Mock car detail for booking page
        await page.route('**/api/cars/car-123', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    id: 'car-123',
                    brand: 'Volkswagen',
                    model: 'Passat',
                    dailyPrice: 1500,
                    branchId: 'branch-1',
                    status: 'ACTIVE',
                    images: [],
                    transmission: 'AUTO',
                    fuel: 'DIESEL',
                    seats: 5
                })
            });
        });

        // Fill booking form
        await page.getByLabel('Ad').fill('Can');
        await page.getByLabel('Soyad').fill('Demir');
        await page.getByLabel('Telefon').fill('5551112233');
        await page.getByLabel('E-posta').fill('can@test.com');

        // Mock booking creation
        await page.route('**/api/bookings', async (route) => {
            await route.fulfill({
                status: 201,
                body: JSON.stringify({
                    data: { bookingCode: 'BOOK-999' }
                })
            });
        });

        // Submit form (Need to handle date picking if mandatory)
        // For E2E, we might need to interact with the DatePicker's input
        const dateInputs = page.locator('.react-datepicker__input-container input');
        // Setting dates directly if possible, or clicking through calendar
        await dateInputs.first().click();
        await page.locator('.react-datepicker__day--015').first().click(); // Select 15th
        
        await dateInputs.last().click();
        await page.locator('.react-datepicker__day--016').first().click(); // Select 16th

        await page.getByRole('button', { name: /REZERVASYONU ONAYLA/i }).click();

        // Success message should appear
        await expect(page.getByText('Rezervasyon Başarılı!')).toBeVisible();
        await expect(page.getByText('BOOK-999')).toBeVisible();
    });
});
