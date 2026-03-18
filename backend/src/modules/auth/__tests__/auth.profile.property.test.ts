import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock prisma at module level
vi.mock('../../../lib/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('../../../lib/jwt.js', () => ({
    signToken: vi.fn().mockReturnValue('mock-token'),
}));

// ─── Generators ────────────────────────────────────────────────────────────────

const emailArb = fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.constantFrom('com', 'org', 'net', 'io'),
).map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

const nameArb = fc.stringMatching(/^[A-Za-z]{2,15}$/);
const phoneArb = fc.stringMatching(/^5[0-9]{9}$/);
const tcNoArb = fc.stringMatching(/^[1-9][0-9]{10}$/);
const taxNumberArb = fc.stringMatching(/^[1-9][0-9]{9}$/);
const companyNameArb = fc.stringMatching(/^[A-Za-z ]{2,20}$/).filter(s => s.trim().length >= 2);
const taxOfficeArb = fc.stringMatching(/^[A-Za-z ]{2,15}$/);
const companyAddressArb = fc.stringMatching(/^[A-Za-z0-9 ,]{5,30}$/);
const userIdArb = fc.uuid();

/** Individual user DB record */
const individualUserArb = fc.record({
    id: userIdArb,
    email: emailArb,
    name: nameArb,
    phone: phoneArb,
    role: fc.constant('USER' as const),
    membershipType: fc.constant('INDIVIDUAL' as const),
    passwordHash: fc.constant('$2a$01$hashedpassword'),
    tcNo: fc.option(tcNoArb, { nil: null }),
    companyName: fc.constant(null),
    taxNumber: fc.constant(null),
    taxOffice: fc.constant(null),
    companyAddress: fc.constant(null),
    whatsappEnabled: fc.boolean(),
    emailEnabled: fc.boolean(),
    emailBookingEnabled: fc.boolean(),
    emailInsuranceEnabled: fc.boolean(),
});

/** Corporate user DB record */
const corporateUserArb = fc.record({
    id: userIdArb,
    email: emailArb,
    name: nameArb,
    phone: phoneArb,
    role: fc.constant('USER' as const),
    membershipType: fc.constant('CORPORATE' as const),
    passwordHash: fc.constant('$2a$01$hashedpassword'),
    tcNo: fc.constant(null),
    companyName: companyNameArb,
    taxNumber: taxNumberArb,
    taxOffice: fc.option(taxOfficeArb, { nil: null }),
    companyAddress: fc.option(companyAddressArb, { nil: null }),
    whatsappEnabled: fc.boolean(),
    emailEnabled: fc.boolean(),
    emailBookingEnabled: fc.boolean(),
    emailInsuranceEnabled: fc.boolean(),
});

/** Any user (individual or corporate) */
const anyUserArb = fc.oneof(individualUserArb, corporateUserArb);

// ─── Property 4: Profil yanıtı üyelik tipine uygun alanları içerir ────────────
// **Validates: Requirements 5.1, 5.2, 6.3**

describe('Property 4: Profil yanıtı üyelik tipine uygun alanları içerir', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('individual user profile contains tcNo field', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { getProfile } = await import('../auth.service.js');
        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(individualUserArb, async (user) => {
                mockFindUnique.mockResolvedValue(user);

                const profile = await getProfile(user.id);

                expect(profile.membershipType).toBe('INDIVIDUAL');
                expect('tcNo' in profile).toBe(true);
                expect(profile.tcNo).toBe(user.tcNo);

                mockFindUnique.mockReset();
            }),
            { numRuns: 100 },
        );
    });

    it('corporate user profile contains companyName, taxNumber, taxOffice, companyAddress fields', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { getProfile } = await import('../auth.service.js');
        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(corporateUserArb, async (user) => {
                mockFindUnique.mockResolvedValue(user);

                const profile = await getProfile(user.id);

                expect(profile.membershipType).toBe('CORPORATE');
                expect('companyName' in profile).toBe(true);
                expect('taxNumber' in profile).toBe(true);
                expect('taxOffice' in profile).toBe(true);
                expect('companyAddress' in profile).toBe(true);
                expect(profile.companyName).toBe(user.companyName);
                expect(profile.taxNumber).toBe(user.taxNumber);
                expect(profile.taxOffice).toBe(user.taxOffice);
                expect(profile.companyAddress).toBe(user.companyAddress);

                mockFindUnique.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});


// ─── Property 5: Profil güncelleme round-trip ──────────────────────────────────
// **Validates: Requirements 5.3**

describe('Property 5: Profil güncelleme round-trip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('individual user profile update reflects new values', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { updateProfile } = await import('../auth.service.js');
        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
        const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

        /** Update data for individual users */
        const individualUpdateArb = fc.record({
            name: fc.option(nameArb, { nil: undefined }),
            phone: fc.option(phoneArb, { nil: undefined }),
            tcNo: fc.option(tcNoArb, { nil: undefined }),
        });

        await fc.assert(
            fc.asyncProperty(individualUserArb, individualUpdateArb, async (user, updateData) => {
                // findUnique returns the current user
                mockFindUnique.mockResolvedValue(user);

                // Compute expected updated user
                const updatedUser = {
                    ...user,
                    name: updateData.name ?? user.name,
                    phone: updateData.phone ?? user.phone,
                    tcNo: updateData.tcNo ?? user.tcNo,
                };
                mockUpdate.mockResolvedValue(updatedUser);

                const result = await updateProfile(user.id, updateData);

                // Verify the returned profile reflects the updated values
                expect(result.name).toBe(updatedUser.name);
                if (updateData.tcNo !== undefined) {
                    expect(result.tcNo).toBe(updateData.tcNo);
                }

                mockFindUnique.mockReset();
                mockUpdate.mockReset();
            }),
            { numRuns: 100 },
        );
    });

    it('corporate user profile update reflects new values', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { updateProfile } = await import('../auth.service.js');
        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
        const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

        /** Update data for corporate users */
        const corporateUpdateArb = fc.record({
            name: fc.option(nameArb, { nil: undefined }),
            phone: fc.option(phoneArb, { nil: undefined }),
            companyName: fc.option(companyNameArb, { nil: undefined }),
            taxOffice: fc.option(taxOfficeArb, { nil: undefined }),
            companyAddress: fc.option(companyAddressArb, { nil: undefined }),
        });

        await fc.assert(
            fc.asyncProperty(corporateUserArb, corporateUpdateArb, async (user, updateData) => {
                mockFindUnique.mockResolvedValue(user);

                const updatedUser = {
                    ...user,
                    name: updateData.name ?? user.name,
                    phone: updateData.phone ?? user.phone,
                    companyName: updateData.companyName ?? user.companyName,
                    taxOffice: updateData.taxOffice ?? user.taxOffice,
                    companyAddress: updateData.companyAddress ?? user.companyAddress,
                };
                mockUpdate.mockResolvedValue(updatedUser);

                const result = await updateProfile(user.id, updateData);

                expect(result.name).toBe(updatedUser.name);
                if (updateData.companyName !== undefined) {
                    expect(result.companyName).toBe(updateData.companyName);
                }
                if (updateData.taxOffice !== undefined) {
                    expect(result.taxOffice).toBe(updateData.taxOffice);
                }
                if (updateData.companyAddress !== undefined) {
                    expect(result.companyAddress).toBe(updateData.companyAddress);
                }

                mockFindUnique.mockReset();
                mockUpdate.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});

// ─── Property 6: Üyelik tipi profil üzerinden değiştirilemez ───────────────────
// **Validates: Requirements 5.4**

describe('Property 6: Üyelik tipi profil üzerinden değiştirilemez', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('membershipType remains unchanged after profile update regardless of submitted value', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { updateProfile } = await import('../auth.service.js');
        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
        const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

        const membershipTypeAttemptArb = fc.constantFrom('INDIVIDUAL', 'CORPORATE', 'PREMIUM', 'VIP', 'BASIC');

        await fc.assert(
            fc.asyncProperty(anyUserArb, membershipTypeAttemptArb, async (user, attemptedType) => {
                const originalType = user.membershipType;

                mockFindUnique.mockResolvedValue(user);
                // prisma.user.update should return user with ORIGINAL membershipType
                // (since updateProfile should not pass membershipType to update)
                mockUpdate.mockResolvedValue({ ...user });

                const result = await updateProfile(user.id, {
                    name: 'UpdatedName',
                    membershipType: attemptedType,
                });

                // The returned membershipType must be the original
                expect(result.membershipType).toBe(originalType);

                // Verify prisma.user.update was NOT called with membershipType
                const updateCall = mockUpdate.mock.calls[mockUpdate.mock.calls.length - 1];
                if (updateCall) {
                    const updateData = updateCall[0].data;
                    expect(updateData).not.toHaveProperty('membershipType');
                }

                mockFindUnique.mockReset();
                mockUpdate.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});
