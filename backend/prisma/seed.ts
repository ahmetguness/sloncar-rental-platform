import { PrismaClient, Transmission, FuelType, CarCategory, CarStatus, UserRole, FranchiseApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Data cleaning is handled by scripts/clean_db.ts
    // to avoid foreign key issues and Prisma errors.
    console.log('✨ Database assumed clean (run scripts/clean_db.ts if needed)');

    // Create branches
    const branches = await Promise.all([
        prisma.branch.create({
            data: {
                name: 'Manisa Şehzadeler',
                address: 'Şehzadeler, Manisa',
                city: 'Manisa',
                phone: '+90 555 555 5555',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${branches.length} branches`);

    // Create users
    const passwordHash = await bcrypt.hash('sloncar', 12);

    const adminUser = await prisma.user.create({
        data: {
            email: 'sloncar@gmail.com',
            passwordHash,
            name: 'Admin User',
            phone: '+90 555 000 0001',
            role: UserRole.ADMIN,
        },
    });

    console.log('✅ Created 1 admin user');

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
                images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'],
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
                images: ['https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&w=800&q=80'],
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
                images: ['https://images.unsplash.com/photo-1616423664033-22877bc95768?auto=format&fit=crop&w=800&q=80'],
                status: CarStatus.ACTIVE,
                description: 'Premium compact with excellent handling',
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
                plateNumber: '06 GHI 790',
                dailyPrice: 650,
                weeklyPrice: 4000,
                deposit: 1500,
                mileage: 15000,
                images: ['https://images.unsplash.com/photo-1616423664033-22877bc95768?auto=format&fit=crop&w=800&q=80'],
                status: CarStatus.ACTIVE,
                description: 'Premium compact with excellent handling',
                branchId: branches[0]!.id,
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
                plateNumber: '35 JKL 013',
                dailyPrice: 950,
                weeklyPrice: 6000,
                deposit: 2500,
                mileage: 12000,
                images: ['https://images.unsplash.com/photo-1626077388041-33f11050d5ce?auto=format&fit=crop&w=800&q=80'],
                status: CarStatus.ACTIVE,
                description: 'Hybrid SUV with great fuel economy',
                branchId: branches[0]!.id,
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
                plateNumber: '34 MNO 346',
                dailyPrice: 1200,
                weeklyPrice: 7500,
                deposit: 3000,
                mileage: 28000,
                images: ['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=800&q=80'],
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
                plateNumber: '06 PQR 679',
                dailyPrice: 1100,
                weeklyPrice: 7000,
                deposit: 2500,
                mileage: 45000,
                images: ['https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=800&q=80'],
                status: CarStatus.ACTIVE,
                description: 'Spacious van for group travel',
                branchId: branches[0]!.id,
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
                plateNumber: '34 STU 902',
                dailyPrice: 1500,
                weeklyPrice: 9000,
                deposit: 5000,
                mileage: 8000,
                images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'],
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
                plateNumber: '35 VWX 235',
                dailyPrice: 450,
                deposit: 1000,
                mileage: 68000,
                images: [],
                status: CarStatus.MAINTENANCE,
                description: 'Currently in maintenance',
                branchId: branches[0]!.id,
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
                plateNumber: '34 YZA 568',
                dailyPrice: 1300,
                weeklyPrice: 8000,
                deposit: 4000,
                mileage: 5000,
                images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'],
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
                plateNumber: '06 BCD 891',
                dailyPrice: 800,
                weeklyPrice: 5000,
                deposit: 2000,
                mileage: 32000,
                images: ['https://images.unsplash.com/photo-1629831720876-0f3747b0e14c?auto=format&fit=crop&w=800&q=80'],
                status: CarStatus.ACTIVE,
                description: 'Modern SUV with hybrid technology',
                branchId: branches[0]!.id,
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
            userId: adminUser.id,
            customerName: 'Slon Car Admin',
            customerPhone: '+90 555 000 0001',
            pickupDate: tomorrow,
            dropoffDate: nextWeek,
            pickupBranchId: branches[0]!.id,
            dropoffBranchId: branches[0]!.id,
            totalPrice: 3150,
            status: 'RESERVED',
            bookingCode: 'RNT-SEED01',
        },
    });

    console.log('✅ Created 1 sample booking');

    // Create sample franchise application (submitted)
    const franchiseApp = await prisma.franchiseApplication.create({
        data: {
            userId: adminUser.id,
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
                performedBy: adminUser.id,
                newValue: { status: 'DRAFT' },
            },
            {
                applicationId: franchiseApp.id,
                action: 'SUBMITTED',
                performedBy: adminUser.id,
                previousValue: { status: 'DRAFT' },
                newValue: { status: 'SUBMITTED' },
            },
        ],
    });

    console.log('✅ Created 1 sample franchise application with audit logs');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Test credentials:');
    console.log('  Admin: sloncar@gmail.com / sloncar');


    // Seed Car Brands
    console.log('Seeding car brands...');
    const brands = [
        // German
        { name: 'BMW', logoUrl: '/brands/bmw.svg' },
        { name: 'Mercedes', logoUrl: '/brands/mercedes.svg' },
        { name: 'Audi', logoUrl: '/brands/audi.svg' },
        { name: 'Volkswagen', logoUrl: '/brands/volkswagen.svg' },
        { name: 'Opel', logoUrl: '/brands/opel.png' },
        { name: 'Porsche', logoUrl: '/brands/porsche.png' },
        // French
        { name: 'Renault', logoUrl: '/brands/renault.png' },
        { name: 'Peugeot', logoUrl: '/brands/peugeot.svg' },
        { name: 'Citroen', logoUrl: '/brands/citroen.png' },
        { name: 'Dacia', logoUrl: '/brands/dacia.png' },
        // Italian
        { name: 'Fiat', logoUrl: '/brands/fiat.svg' },
        { name: 'Alfa Romeo', logoUrl: '/brands/alfa-romeo.png' },
        // Japanese
        { name: 'Toyota', logoUrl: '/brands/toyota.svg' },
        { name: 'Honda', logoUrl: '/brands/honda.svg' },
        { name: 'Nissan', logoUrl: '/brands/nissan.png' },
        { name: 'Suzuki', logoUrl: '/brands/suzuki.png' },
        // Korean
        { name: 'Hyundai', logoUrl: '/brands/hyundai.png' },
        { name: 'Kia', logoUrl: '/brands/kia.png' },
        // American
        { name: 'Ford', logoUrl: '/brands/ford.svg' },
        { name: 'Jeep', logoUrl: '/brands/jeep.png' },
        { name: 'Tesla', logoUrl: '/brands/tesla.png' },
        // British
        { name: 'Land Rover', logoUrl: '/brands/land-rover.png' },
        { name: 'Mini', logoUrl: '/brands/mini.svg' },
        // Other
        { name: 'Volvo', logoUrl: '/brands/volvo.png' },
        { name: 'Skoda', logoUrl: '/brands/skoda.png' },
        { name: 'SEAT', logoUrl: '/brands/seat.png' },
        { name: 'Cupra', logoUrl: '/brands/cupra.png' },
        { name: 'Chery', logoUrl: '/brands/chery.png' },
        { name: 'MG', logoUrl: '/brands/mg.svg' },
        { name: 'TOGG', logoUrl: '/brands/togg.svg' },
    ];

    for (const brand of brands) {
        await prisma.carBrand.upsert({
            where: { name: brand.name },
            update: { logoUrl: brand.logoUrl },
            create: { name: brand.name, logoUrl: brand.logoUrl },
        });
    }

    console.log('✅ Car brands seeded.');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
