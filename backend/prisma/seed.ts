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
                images: ['https://images.unsplash.com/photo-1626077388041-33f11050d5ce?auto=format&fit=crop&w=800&q=80'],
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
                plateNumber: '06 PQR 678',
                dailyPrice: 1100,
                weeklyPrice: 7000,
                deposit: 2500,
                mileage: 45000,
                images: ['https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=800&q=80'],
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
                plateNumber: '06 BCD 890',
                dailyPrice: 800,
                weeklyPrice: 5000,
                deposit: 2000,
                mileage: 32000,
                images: ['https://images.unsplash.com/photo-1629831720876-0f3747b0e14c?auto=format&fit=crop&w=800&q=80'],
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
            bookingCode: 'RNT-SEED01',
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

    // Seed Car Brands
    console.log('Seeding car brands...');
    const brands = [
        // German
        { name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
        { name: 'Mercedes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg' },
        { name: 'Audi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg' },
        { name: 'Volkswagen', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
        { name: 'Opel', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Opel_Logo_2024.svg' },
        { name: 'Porsche', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Porsche_logo.svg/1200px-Porsche_logo.svg.png' },
        // French
        { name: 'Renault', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Textless_logo.svg' },
        { name: 'Peugeot', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
        { name: 'Citroen', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Citroen_2022_logo.svg' },
        { name: 'Dacia', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Dacia_Logo.svg' },
        // Italian
        { name: 'Fiat', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg' },
        { name: 'Alfa Romeo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfa_Romeo_logo.png' },
        // Japanese
        { name: 'Toyota', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
        { name: 'Honda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
        { name: 'Nissan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png' },
        { name: 'Suzuki', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg' },
        // Korean
        { name: 'Hyundai', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hyundai_Motor_Company_logo.svg' },
        { name: 'Kia', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo.svg' },
        // American
        { name: 'Ford', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
        { name: 'Jeep', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/JEEP_logo.svg' },
        { name: 'Tesla', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
        // British
        { name: 'Land Rover', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png' },
        { name: 'Mini', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Mini_logo.svg' },
        // Other
        { name: 'Volvo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo_Iron_Mark.svg' },
        { name: 'Skoda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Skoda_Auto_logo_%282023%29.svg' },
        { name: 'SEAT', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/SEAT_Logo_2021.svg' },
        { name: 'Cupra', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Cupra_Logo.svg' },
        { name: 'Chery', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Chery_Automobile_logo.svg' },
        { name: 'MG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MG_Motor_logo.svg' },
        { name: 'TOGG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Togg_logo.svg' },
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
