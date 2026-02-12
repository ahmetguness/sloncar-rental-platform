
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking admin user...');

    const email = 'sloncar@gmail.com';
    const password = 'sloncar';

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ Admin user not found!');
        return;
    }

    console.log('✅ Admin user found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash.substring(0, 20) + '...',
    });

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (isMatch) {
        console.log('✅ Password "sloncar" matches the hash.');
    } else {
        console.error('❌ Password "sloncar" DOES NOT match the hash.');

        // Let's try to hash it again and see
        const newHash = await bcrypt.hash(password, 12);
        console.log('ℹ️  New hash for "sloncar" would be:', newHash.substring(0, 20) + '...');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
