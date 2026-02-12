
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating admin user...');

    const email = 'sloncar@gmail.com';
    const password = 'sloncar';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash, // Update password if user exists
            role: UserRole.ADMIN,
        },
        create: {
            email,
            passwordHash,
            name: 'Admin User',
            phone: '+90 555 000 0001',
            role: UserRole.ADMIN,
        },
    });

    console.log('✅ Admin user created/updated successfully!');
    console.log('   Email:', user.email);
    console.log('   Password:', password);
    console.log('   Role:', user.role);
}

main()
    .catch((e) => {
        console.error('❌ Failed to create admin user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
