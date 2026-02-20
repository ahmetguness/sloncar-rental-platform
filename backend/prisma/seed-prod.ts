import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting production seed...');

    // 1. Create Initial Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sloncar.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'SlonCarAdmin2026!';

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: 'System Admin',
                phone: '+90 000 000 0000',
                role: UserRole.ADMIN,
            },
        });
        console.log(`✅ Created initial admin user: ${adminEmail}`);
        console.log('⚠️  IMPORTANT: Please change the admin password after first login.');
    } else {
        console.log('ℹ️  Admin user already exists, skipping user creation.');
    }

    // 2. Create Initial Branch
    const existingBranch = await prisma.branch.findFirst();
    if (!existingBranch) {
        await prisma.branch.create({
            data: {
                name: 'Merkez Ofis',
                address: 'Merkez',
                city: 'İstanbul',
                phone: '+90 000 000 0000',
                isActive: true,
            },
        });
        console.log('✅ Created default branch: Merkez Ofis');
    }

    // Note: CarBrand model is not present in the current schema. 
    // Brands are managed via constants and dynamic discovery from the Car model.
    // If you add a CarBrand model in the future, you can re-enable brand seeding here.

    console.log('\n🎉 Production seed completed successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Production seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
