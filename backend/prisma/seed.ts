import { PrismaClient, Transmission, FuelType, CarCategory, CarStatus, UserRole, FranchiseApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data
    await prisma.franchiseAuditLog.deleteMany();
    await prisma.franchiseApplication.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.car.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();

    console.log('✅ Cleaned existing data');

    // Create branches
    const branches = await Promise.all([
        prisma.branch.create({
            data: {
                name: 'Istanbul Atatürk Airport',
                address: 'Yeşilköy Mah, Atatürk Havalimanı, Bakırköy',
                city: 'Istanbul',
                phone: '+90 212 555 0001',
                isActive: true,
            },
        }),
        prisma.branch.create({
            data: {
                name: 'Ankara Esenboğa Airport',
                address: 'Esenboğa Havalimanı, Çubuk',
                city: 'Ankara',
                phone: '+90 312 555 0002',
                isActive: true,
            },
        }),
        prisma.branch.create({
            data: {
                name: 'Izmir Adnan Menderes Airport',
                address: 'Adnan Menderes Havalimanı, Gaziemir',
                city: 'Izmir',
                phone: '+90 232 555 0003',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${branches.length} branches`);

    // Create users
    const passwordHash = await bcrypt.hash('password123', 12);

    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@rentacar.com',
            passwordHash,
            name: 'Admin User',
            phone: '+90 555 000 0001',
            role: UserRole.ADMIN,
        },
    });

    const regularUser = await prisma.user.create({
        data: {
            email: 'user@example.com',
            passwordHash,
            name: 'John Doe',
            phone: '+90 555 000 0002',
            role: UserRole.USER,
        },
    });

    console.log('✅ Created 2 users (1 admin, 1 regular)');

    // Create cars
    const cars = await Promise.all([
        // Economy cars
        prisma.car.create({
            data: {
                brand: 'Fiat',
                model: 'Egea',
                year: 2023,
                transmission: Transmission.MANUAL,
                fuel: FuelType.PETROL,
                category: CarCategory.ECONOMY,
                seats: 5,
                doors: 4,
                color: 'White',
                plateNumber: '34 ABC 123',
                dailyPrice: 450,
                weeklyPrice: 2800,
                deposit: 1000,
                mileage: 25000,
                images: ['https://example.com/images/fiat-egea-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Economical and fuel-efficient sedan',
                branchId: branches[0]!.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: 'Renault',
                model: 'Clio',
                year: 2022,
                transmission: Transmission.AUTO,
                fuel: FuelType.DIESEL,
                category: CarCategory.ECONOMY,
                seats: 5,
                doors: 4,
                color: 'Red',
                plateNumber: '34 DEF 456',
                dailyPrice: 500,
                weeklyPrice: 3000,
                deposit: 1000,
                mileage: 35000,
                images: ['https://example.com/images/renault-clio-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Compact car perfect for city driving',
                branchId: branches[0]!.id,
            },
        }),
        // Compact
        prisma.car.create({
            data: {
                brand: 'Volkswagen',
                model: 'Golf',
                year: 2023,
                transmission: Transmission.AUTO,
                fuel: FuelType.PETROL,
                category: CarCategory.COMPACT,
                seats: 5,
                doors: 4,
                color: 'Gray',
                plateNumber: '06 GHI 789',
                dailyPrice: 650,
                weeklyPrice: 4000,
                deposit: 1500,
                mileage: 15000,
                images: ['https://example.com/images/vw-golf-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Premium compact with excellent handling',
                branchId: branches[1]!.id,
            },
        }),
        // SUV
        prisma.car.create({
            data: {
                brand: 'Toyota',
                model: 'RAV4',
                year: 2023,
                transmission: Transmission.AUTO,
                fuel: FuelType.HYBRID,
                category: CarCategory.SUV,
                seats: 5,
                doors: 5,
                color: 'Black',
                plateNumber: '35 JKL 012',
                dailyPrice: 950,
                weeklyPrice: 6000,
                deposit: 2500,
                mileage: 12000,
                images: ['https://example.com/images/toyota-rav4-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Hybrid SUV with great fuel economy',
                branchId: branches[2]!.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: 'BMW',
                model: 'X3',
                year: 2022,
                transmission: Transmission.AUTO,
                fuel: FuelType.DIESEL,
                category: CarCategory.SUV,
                seats: 5,
                doors: 5,
                color: 'White',
                plateNumber: '34 MNO 345',
                dailyPrice: 1200,
                weeklyPrice: 7500,
                deposit: 3000,
                mileage: 28000,
                images: ['https://example.com/images/bmw-x3-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Luxury SUV with premium features',
                branchId: branches[0]!.id,
            },
        }),
        // Van
        prisma.car.create({
            data: {
                brand: 'Mercedes',
                model: 'Vito',
                year: 2021,
                transmission: Transmission.AUTO,
                fuel: FuelType.DIESEL,
                category: CarCategory.VAN,
                seats: 8,
                doors: 4,
                color: 'Silver',
                plateNumber: '06 PQR 678',
                dailyPrice: 1100,
                weeklyPrice: 7000,
                deposit: 2500,
                mileage: 45000,
                images: ['https://example.com/images/mercedes-vito-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Spacious van for group travel',
                branchId: branches[1]!.id,
            },
        }),
        // Luxury
        prisma.car.create({
            data: {
                brand: 'Mercedes',
                model: 'E-Class',
                year: 2023,
                transmission: Transmission.AUTO,
                fuel: FuelType.PETROL,
                category: CarCategory.LUXURY,
                seats: 5,
                doors: 4,
                color: 'Black',
                plateNumber: '34 STU 901',
                dailyPrice: 1500,
                weeklyPrice: 9000,
                deposit: 5000,
                mileage: 8000,
                images: ['https://example.com/images/mercedes-e-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Executive luxury sedan',
                branchId: branches[0]!.id,
            },
        }),
        // Maintenance car
        prisma.car.create({
            data: {
                brand: 'Ford',
                model: 'Focus',
                year: 2020,
                transmission: Transmission.MANUAL,
                fuel: FuelType.DIESEL,
                category: CarCategory.COMPACT,
                seats: 5,
                doors: 4,
                color: 'Blue',
                plateNumber: '35 VWX 234',
                dailyPrice: 450,
                deposit: 1000,
                mileage: 68000,
                images: [],
                status: CarStatus.MAINTENANCE,
                description: 'Currently in maintenance',
                branchId: branches[2]!.id,
            },
        }),
        // Electric
        prisma.car.create({
            data: {
                brand: 'Tesla',
                model: 'Model 3',
                year: 2023,
                transmission: Transmission.AUTO,
                fuel: FuelType.ELECTRIC,
                category: CarCategory.MIDSIZE,
                seats: 5,
                doors: 4,
                color: 'White',
                plateNumber: '34 YZA 567',
                dailyPrice: 1300,
                weeklyPrice: 8000,
                deposit: 4000,
                mileage: 5000,
                images: ['https://example.com/images/tesla-model3-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'All-electric sedan with autopilot',
                branchId: branches[0]!.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: 'Hyundai',
                model: 'Tucson',
                year: 2022,
                transmission: Transmission.AUTO,
                fuel: FuelType.HYBRID,
                category: CarCategory.SUV,
                seats: 5,
                doors: 5,
                color: 'Green',
                plateNumber: '06 BCD 890',
                dailyPrice: 800,
                weeklyPrice: 5000,
                deposit: 2000,
                mileage: 32000,
                images: ['https://example.com/images/hyundai-tucson-1.jpg'],
                status: CarStatus.ACTIVE,
                description: 'Modern SUV with hybrid technology',
                branchId: branches[1]!.id,
            },
        }),
    ]);

    console.log(`✅ Created ${cars.length} cars`);

    // Create a sample booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await prisma.booking.create({
        data: {
            carId: cars[0]!.id,
            userId: regularUser.id,
            customerName: 'John Doe',
            customerPhone: '+90 555 000 0002',
            pickupDate: tomorrow,
            dropoffDate: nextWeek,
            pickupBranchId: branches[0]!.id,
            dropoffBranchId: branches[0]!.id,
            totalPrice: 3150,
            status: 'RESERVED',
        },
    });

    console.log('✅ Created 1 sample booking');

    // Create sample franchise application (submitted)
    const franchiseApp = await prisma.franchiseApplication.create({
        data: {
            userId: regularUser.id,
            status: FranchiseApplicationStatus.SUBMITTED,
            contactName: 'Ali Yılmaz',
            contactEmail: 'ali.yilmaz@example.com',
            contactPhone: '+90 532 111 2233',
            companyName: 'Yılmaz Otomotiv Ltd.',
            city: 'Antalya',
            submittedAt: new Date(),
            details: {
                personalInfo: {
                    fullName: 'Ali Yılmaz',
                    tcNumber: '12345678901',
                    birthDate: '1985-05-15',
                    address: 'Konyaaltı Mah. 123 Sok. No:45 Antalya',
                },
                companyInfo: {
                    legalName: 'Yılmaz Otomotiv Tic. Ltd. Şti.',
                    taxNumber: '1234567890',
                    taxOffice: 'Antalya',
                    foundedYear: 2015,
                    companyType: 'Limited',
                },
                locationDetails: {
                    proposedAddress: 'Antalya Airport Terminal 1',
                    city: 'Antalya',
                    squareMeters: 350,
                    parkingSpaces: 30,
                    propertyType: 'RENTED',
                },
                financials: {
                    initialCapital: 750000,
                    fundingSource: 'Own funds + Bank credit',
                },
                experience: {
                    yearsInBusiness: 8,
                    industryExperience: 'Automotive retail and service',
                },
                fleetPlan: {
                    initialFleetSize: 30,
                    economyCars: 15,
                    midrangeCars: 10,
                    suvs: 5,
                },
                declarations: {
                    acceptsTerms: true,
                    noCriminalRecord: true,
                    informationAccurate: true,
                },
                documentUrls: [],
            },
        },
    });

    // Add audit log for the franchise application
    await prisma.franchiseAuditLog.createMany({
        data: [
            {
                applicationId: franchiseApp.id,
                action: 'CREATED',
                performedBy: regularUser.id,
                newValue: { status: 'DRAFT' },
            },
            {
                applicationId: franchiseApp.id,
                action: 'SUBMITTED',
                performedBy: regularUser.id,
                previousValue: { status: 'DRAFT' },
                newValue: { status: 'SUBMITTED' },
            },
        ],
    });

    console.log('✅ Created 1 sample franchise application with audit logs');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Test credentials:');
    console.log('  Admin: admin@rentacar.com / password123');
    console.log('  User:  user@example.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
