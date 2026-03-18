import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { registerSchema, MembershipTypeEnum } from '../auth.validators.js';

// Mock prisma and jwt at module level for service tests
vi.mock('../../../lib/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('../../../lib/jwt.js', () => ({
    signToken: vi.fn().mockReturnValue('mock-token'),
}));

// ─── Generators ────────────────────────────────────────────────────────────────

/** Valid email arbitrary */
const emailArb = fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.constantFrom('com', 'org', 'net', 'io'),
).map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

/** Valid password (min 8 chars) */
const passwordArb = fc.stringMatching(/^[A-Za-z0-9!@#]{8,20}$/);

/** Valid name (min 2 chars) */
const nameArb = fc.stringMatching(/^[A-Za-z]{2,15}$/);

/** Valid phone */
const phoneArb = fc.stringMatching(/^5[0-9]{9}$/);

/** Valid TC number (11 digits) */
const tcNoArb = fc.stringMatching(/^[1-9][0-9]{10}$/);

/** Valid tax number (10 digits) */
const taxNumberArb = fc.stringMatching(/^[1-9][0-9]{9}$/);

/** Valid individual registration data */
const individualRegisterArb = fc.record({
    membershipType: fc.constant('INDIVIDUAL' as const),
    email: emailArb,
    password: passwordArb,
    name: nameArb,
    phone: phoneArb,
    tcNo: fc.option(tcNoArb, { nil: undefined }),
});

/** Valid corporate registration data */
const corporateRegisterArb = fc.record({
    membershipType: fc.constant('CORPORATE' as const),
    email: emailArb,
    password: passwordArb,
    name: nameArb,
    phone: phoneArb,
    companyName: fc.stringMatching(/^[A-Za-z ]{2,20}$/).filter(s => s.trim().length >= 2),
    taxNumber: taxNumberArb,
    taxOffice: fc.option(fc.stringMatching(/^[A-Za-z ]{2,15}$/), { nil: undefined }),
    companyAddress: fc.option(fc.stringMatching(/^[A-Za-z0-9 ,]{5,30}$/), { nil: undefined }),
});

/** Either valid individual or corporate registration */
const validRegisterArb = fc.oneof(individualRegisterArb, corporateRegisterArb);

// ─── Property 1: Kayıt üyelik tipini doğru saklar ─────────────────────────────
// **Validates: Requirements 1.4, 2.3, 3.3**

describe('Property 1: Kayıt üyelik tipini doğru saklar', () => {
    it('register service stores the correct membershipType for any valid registration', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { register } = await import('../auth.service.js');

        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
        const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(validRegisterArb, async (input) => {
                mockFindUnique.mockResolvedValue(null);
                mockCreate.mockResolvedValue({
                    id: 'test-id',
                    email: input.email,
                    name: input.name,
                    role: 'USER',
                    membershipType: input.membershipType,
                });

                const result = await register(input);

                // The created user's membershipType must match the submitted value
                expect(result.user.membershipType).toBe(input.membershipType);

                // Verify prisma.user.create was called with the correct membershipType
                const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0];
                expect(lastCall.data.membershipType).toBe(input.membershipType);

                mockCreate.mockReset();
                mockFindUnique.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});

// ─── Property 2: Eksik zorunlu alanlar reddedilir ─────────────────────────────
// **Validates: Requirements 2.4, 3.4, 7.2**

describe('Property 2: Eksik zorunlu alanlar reddedilir', () => {
    const individualRequiredFields = ['email', 'password', 'name', 'phone'] as const;
    const corporateRequiredFields = ['email', 'password', 'name', 'phone', 'companyName', 'taxNumber'] as const;

    it('individual registration with any required field removed is rejected', () => {
        const fieldToRemoveArb = fc.constantFrom(...individualRequiredFields);

        fc.assert(
            fc.property(individualRegisterArb, fieldToRemoveArb, (input, fieldToRemove) => {
                const incomplete = { ...input } as Record<string, unknown>;
                delete incomplete[fieldToRemove];

                const result = registerSchema.safeParse(incomplete);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const paths = result.error.issues.map(i => i.path.join('.'));
                    expect(paths.some(p => p === fieldToRemove || p === 'membershipType' || p === '')).toBe(true);
                }
            }),
            { numRuns: 100 },
        );
    });

    it('corporate registration with any required field removed is rejected', () => {
        const fieldToRemoveArb = fc.constantFrom(...corporateRequiredFields);

        fc.assert(
            fc.property(corporateRegisterArb, fieldToRemoveArb, (input, fieldToRemove) => {
                const incomplete = { ...input } as Record<string, unknown>;
                delete incomplete[fieldToRemove];

                const result = registerSchema.safeParse(incomplete);
                expect(result.success).toBe(false);
            }),
            { numRuns: 100 },
        );
    });
});

// ─── Property 3: Vergi numarası benzersizliği ──────────────────────────────────
// **Validates: Requirements 3.5, 4.5**

describe('Property 3: Vergi numarası benzersizliği', () => {
    it('second corporate registration with same taxNumber is rejected', async () => {
        const prisma = (await import('../../../lib/prisma.js')).default;
        const { register } = await import('../auth.service.js');

        const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
        const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;

        await fc.assert(
            fc.asyncProperty(corporateRegisterArb, async (input) => {
                // First registration: email not found, taxNumber not found
                mockFindUnique
                    .mockResolvedValueOnce(null)  // email check
                    .mockResolvedValueOnce(null); // taxNumber check
                mockCreate.mockResolvedValueOnce({
                    id: 'user-1',
                    email: input.email,
                    name: input.name,
                    role: 'USER',
                    membershipType: 'CORPORATE',
                });

                await register(input);

                // Second registration with same taxNumber: email not found, taxNumber found
                const secondInput = {
                    ...input,
                    email: `other-${input.email}`,
                };
                mockFindUnique
                    .mockResolvedValueOnce(null)  // email check passes
                    .mockResolvedValueOnce({ id: 'user-1', taxNumber: input.taxNumber }); // taxNumber exists

                try {
                    await register(secondInput);
                    expect.unreachable('Second registration should have been rejected');
                } catch (error: unknown) {
                    const err = error as { statusCode?: number; name?: string; message?: string };
                    expect(err.statusCode).toBe(409);
                    expect(err.message).toContain('vergi numarası');
                }

                mockCreate.mockReset();
                mockFindUnique.mockReset();
            }),
            { numRuns: 100 },
        );
    });
});

// ─── Property 8: Geçersiz membershipType değeri reddedilir ────────────────────
// **Validates: Requirements 7.1**

describe('Property 8: Geçersiz membershipType değeri reddedilir', () => {
    it('any membershipType value other than INDIVIDUAL/CORPORATE is rejected by schema', () => {
        const invalidTypeArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => s !== 'INDIVIDUAL' && s !== 'CORPORATE');

        fc.assert(
            fc.property(invalidTypeArb, emailArb, passwordArb, nameArb, phoneArb, (invalidType, email, password, name, phone) => {
                const input = {
                    membershipType: invalidType,
                    email,
                    password,
                    name,
                    phone,
                };

                const result = registerSchema.safeParse(input);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const hasTypeError = result.error.issues.some(
                        i => i.path.includes('membershipType') || i.code === 'invalid_union_discriminator',
                    );
                    expect(hasTypeError).toBe(true);
                }
            }),
            { numRuns: 100 },
        );
    });

    it('MembershipTypeEnum rejects any value other than INDIVIDUAL/CORPORATE', () => {
        const invalidTypeArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => s !== 'INDIVIDUAL' && s !== 'CORPORATE');

        fc.assert(
            fc.property(invalidTypeArb, (invalidType) => {
                const result = MembershipTypeEnum.safeParse(invalidType);
                expect(result.success).toBe(false);
            }),
            { numRuns: 100 },
        );
    });
});

// ─── Property 9: Kimlik numarası format doğrulaması ───────────────────────────
// **Validates: Requirements 7.3, 7.4**

describe('Property 9: Kimlik numarası format doğrulaması', () => {
    it('tcNo not matching 11-digit format is rejected for individual registration', () => {
        const invalidTcNoArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => !/^\d{11}$/.test(s));

        fc.assert(
            fc.property(
                emailArb, passwordArb, nameArb, phoneArb, invalidTcNoArb,
                (email, password, name, phone, invalidTcNo) => {
                    const input = {
                        membershipType: 'INDIVIDUAL' as const,
                        email,
                        password,
                        name,
                        phone,
                        tcNo: invalidTcNo,
                    };

                    const result = registerSchema.safeParse(input);
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasTcError = result.error.issues.some(
                            i => i.path.includes('tcNo'),
                        );
                        expect(hasTcError).toBe(true);
                    }
                },
            ),
            { numRuns: 100 },
        );
    });

    it('taxNumber not matching 10-digit format is rejected for corporate registration', () => {
        const invalidTaxArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => !/^\d{10}$/.test(s));

        fc.assert(
            fc.property(
                emailArb, passwordArb, nameArb, phoneArb, invalidTaxArb,
                fc.stringMatching(/^[A-Za-z ]{2,20}$/).filter(s => s.trim().length >= 2),
                (email, password, name, phone, invalidTax, companyName) => {
                    const input = {
                        membershipType: 'CORPORATE' as const,
                        email,
                        password,
                        name,
                        phone,
                        companyName,
                        taxNumber: invalidTax,
                    };

                    const result = registerSchema.safeParse(input);
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasTaxError = result.error.issues.some(
                            i => i.path.includes('taxNumber'),
                        );
                        expect(hasTaxError).toBe(true);
                    }
                },
            ),
            { numRuns: 100 },
        );
    });
});
