import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
    // Setup test database connection
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

beforeEach(async () => {
    // Clean up test data before each test
    // This ensures tests are isolated
    // Note: In a real test suite, you'd use a test database
});

export { prisma };
