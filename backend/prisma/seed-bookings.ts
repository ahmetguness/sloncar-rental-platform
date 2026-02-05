import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ['Ahmet', 'Mehmet', 'Ali', 'Fatma', 'Ayşe', 'Zeynep', 'Mustafa', 'Emre', 'Cem', 'Deniz', 'Elif', 'Berk', 'Can', 'Derya', 'Ece', 'Furkan', 'Gizem', 'Hakan', 'Işıl', 'Kaan', 'Leyla'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Yıldız', 'Erdoğan'];

function generateBookingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RNT-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function randomPhone(): string {
    return `05${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('🚗 Seeding 21 dummy bookings...');

    // Get first car and branch
    const car = await prisma.car.findFirst();
    const branch = await prisma.branch.findFirst();

    if (!car || !branch) {
        console.error('❌ No car or branch found. Please seed cars and branches first.');
        return;
    }

    const statuses: BookingStatus[] = ['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

    for (let i = 0; i < 21; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const pickupDate = randomDate(new Date('2025-01-01'), new Date('2026-02-04'));
        const dropoffDate = new Date(pickupDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);
        const dailyPrice = Number(car.dailyPrice);
        const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = dailyPrice * days;

        try {
            await prisma.booking.create({
                data: {
                    bookingCode: generateBookingCode(),
                    carId: car.id,
                    customerName: firstName,
                    customerSurname: lastName,
                    customerPhone: randomPhone(),
                    customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
                    pickupDate,
                    dropoffDate,
                    pickupBranchId: branch.id,
                    dropoffBranchId: branch.id,
                    totalPrice,
                    status,
                    paymentStatus: status === 'COMPLETED' ? 'PAID' : 'UNPAID'
                }
            });
            console.log(`✅ Created booking ${i + 1}/21: ${firstName} ${lastName}`);
        } catch (err: any) {
            if (err.code === 'P2002') {
                console.log(`⚠️ Duplicate booking code, retrying...`);
                i--; // Retry
            } else {
                throw err;
            }
        }
    }

    console.log('🎉 Done! 21 dummy bookings created.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
