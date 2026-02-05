
import prisma from './src/lib/prisma';
import { listCars, createCar } from './src/modules/cars/cars.service';
import { createBooking } from './src/modules/bookings/bookings.service';
import { CarCategory, FuelType, Transmission } from '@prisma/client';
import * as fs from 'fs';

async function main() {
    let output: any = {};


    try {
        console.log('--- Starting Availability Test ---');

        // 1. Create a Test Branch
        const branch = await prisma.branch.create({
            data: {
                name: 'Test Branch',
                address: 'Test Addr',
                city: 'Test City',
                phone: '123'
            }
        });

        // 2. Create a Test Car
        const car = await createCar({
            brand: 'TestBrand',
            model: 'TestModel',
            year: 2024,
            transmission: Transmission.AUTO,
            fuel: FuelType.ELECTRIC,
            category: CarCategory.LUXURY,
            seats: 5,
            doors: 4,
            color: 'Black',
            plateNumber: 'TEST-' + Date.now(),
            dailyPrice: 1000,
            mileage: 0,
            branchId: branch.id,
            images: [],
            status: 'ACTIVE'
        });

        console.log(`Created Car: ${car.id} (${car.plateNumber})`);

        // 3. Create a Booking (Feb 10 - Feb 15)
        // Using UTC dates
        const pickupDate = new Date('2024-02-10T10:00:00Z');
        const dropoffDate = new Date('2024-02-15T10:00:00Z');

        await createBooking({
            carId: car.id,
            pickupBranchId: branch.id,
            dropoffBranchId: branch.id,
            pickupDate,
            dropoffDate,
            customerName: 'John',
            customerSurname: 'Doe',
            customerPhone: '123456',
            customerEmail: 'test@test.com',
            customerDriverLicense: '123',
            customerTC: '12345678901',
            notes: 'Test booking'
        });

        console.log('Created Booking: Feb 10 - Feb 15');

        // 4. Test Overlap Search (Feb 12 - Feb 13)
        const searchPickup = new Date('2024-02-12T10:00:00Z');
        const searchDropoff = new Date('2024-02-13T10:00:00Z');

        const result = await listCars({
            pickupDate: searchPickup,
            dropoffDate: searchDropoff,
            limit: 100,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });

        const found = result.data.find(c => c.id === car.id);
        output.overlapTest = found ? 'FAILURE' : 'SUCCESS';

        if (found) {
            console.error('❌ FAILURE: Car was found despite overlapping booking!');
        } else {
            console.log('✅ SUCCESS: Car was correctly excluded.');
        }

        // 5. Test Non-Overlap Search (Feb 20 - Feb 25)
        const searchPickup2 = new Date('2024-02-20T10:00:00Z');
        const searchDropoff2 = new Date('2024-02-25T10:00:00Z');

        const result2 = await listCars({
            pickupDate: searchPickup2,
            dropoffDate: searchDropoff2,
            limit: 100,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });

        const found2 = result2.data.find(c => c.id === car.id);

        output.nonOverlapTest = found2 ? 'SUCCESS' : 'FAILURE';

        if (found2) {
            console.log('✅ SUCCESS: Car was found for available dates.');
        } else {
            console.error('❌ FAILURE: Car was NOT found for available dates!');
        }

        // Cleanup
        await prisma.booking.deleteMany({ where: { carId: car.id } });
        await prisma.car.delete({ where: { id: car.id } });
        await prisma.branch.delete({ where: { id: branch.id } });

    } catch (error: any) {
        console.error('Test Error:', error);
        output.error = error.message;
        output.stack = error.stack;
    } finally {
        fs.writeFileSync('test_result.json', JSON.stringify(output, null, 2));
    }
}

main().catch(console.error);
