import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock prisma at module level
vi.mock('../../../lib/prisma.js', () => ({
    default: {
        user: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

// ─── Generators ────────────────────────────────────────────────────────────────

const emailArb = fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.constantFrom('com', 'org', 'net', 'io'),
).map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

const nameArb = fc.stringMatching(/^[A-Za-z]{2,15}$/);
const phoneArb = fc.stringMatching(/^5[0-9]{9}$/);
const taxNumberArb = fc.stringMatching(/^[1-9][0-9]{9}$/);
const companyNameArb = fc.stringMatching(/^[A-Za-z ]{2,20}$/).filter(s => s.trim().length >= 2);

const membershipTypeArb = fc.constantFrom('INDIVIDUAL' as const, 'CORPORATE' as const);

/** Individual user record as returned by Prisma select */
const individualUserRecordArb = fc.record({
    id: fc.uuid(),
    name: nameArb,
    email: emailArb,
    phone: phoneArb,
    role: fc.constantFrom('USER', 'ADMIN', 'STAFF'),
    membershipType: fc.constant('INDIVIDUAL' as const),
    companyName: fc.constant(null),
    taxNumber: fc.constant(null),
    version: fc.constant(1),
    createdAt: fc.constant(new Date('2025-01-01')),
});

/** Corporate user record as returned by Prisma select */
const corporateUserRecordArb = fc.record({
    id: fc.uuid(),
    name: nameArb,
    email: emailArb,
    phone: phoneArb,
    role: fc.constantFrom('USER', 'ADMIN', 'STAFF'),
    membershipType: fc.constant('CORPORATE' as const),
    companyName: companyNameArb,
    taxNumber: taxNumberArb,
    version: fc.constant(1),
    createdAt: fc.constant(new Date('2025-01-01')),
});

/** Mixed list of users (both INDIVIDUAL and CORPORATE) */
const mixedUsersArb = fc.array(
    fc.oneof(individualUserRecordArb, corporateUserRecordArb),
    { minLength: 1, maxLength: 20 },
);

// ─── Property 7: Admin üyelik tipi filtrelemesi ────────────────────────────────
// **Validates: Requirements 6.1, 6.2**

describe('Property 7: Admin üyelik tipi filtrelemesi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getUsers with membershipType filter returns only users of that type', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { getUsers } = await import('../admin.service.js');
        const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
        const mockCount = prisma.user.count as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(mixedUsersArb, membershipTypeArb, async (allUsers, filterType) => {
                // Simulate what Prisma would return after filtering
                const filteredUsers = allUsers.filter(u => u.membershipType === filterType);

                mockFindMany.mockResolvedValue(filteredUsers);
                mockCount.mockResolvedValue(filteredUsers.length);

                const result = await getUsers({ membershipType: filterType });

                // Every returned user must have the requested membershipType
                for (const user of result.data) {
                    expect(user.membershipType).toBe(filterType);
                }

                // The count should match the filtered set
                expect(result.pagination.total).toBe(filteredUsers.length);

                // Verify Prisma was called with the correct where clause
                const findManyCall = mockFindMany.mock.calls[mockFindMany.mock.calls.length - 1][0];
                expect(findManyCall.where.membershipType).toBe(filterType);

                const countCall = mockCount.mock.calls[mockCount.mock.calls.length - 1][0];
                expect(countCall.where.membershipType).toBe(filterType);

                mockFindMany.mockReset();
                mockCount.mockReset();
            }),
            { numRuns: 100 },
        );
    });

    it('getUsers without membershipType filter does not constrain by type', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { getUsers } = await import('../admin.service.js');
        const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
        const mockCount = prisma.user.count as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(mixedUsersArb, async (allUsers) => {
                mockFindMany.mockResolvedValue(allUsers);
                mockCount.mockResolvedValue(allUsers.length);

                const result = await getUsers({});

                // All users should be returned (no type filtering)
                expect(result.data.length).toBe(allUsers.length);
                expect(result.pagination.total).toBe(allUsers.length);

                // Verify Prisma where clause does NOT contain membershipType
                const findManyCall = mockFindMany.mock.calls[mockFindMany.mock.calls.length - 1][0];
                expect(findManyCall.where).not.toHaveProperty('membershipType');

                mockFindMany.mockReset();
                mockCount.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});
