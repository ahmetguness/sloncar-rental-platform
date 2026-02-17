import { ApiError } from '../middlewares/errorHandler.js';

/**
 * Performs an optimistic-lock update using `updateMany`.
 * Returns the number of affected rows (0 means version mismatch = conflict).
 *
 * @param model  - Prisma model delegate (e.g. prisma.car or tx.car)
 * @param id     - Record id
 * @param expectedVersion - The version the client last read
 * @param data   - Fields to update (version is auto-incremented)
 */
export async function optimisticUpdate<T extends { updateMany: Function; findUnique: Function }>(
    model: T,
    id: string,
    expectedVersion: number,
    data: Record<string, unknown>,
): Promise<void> {
    const result = await model.updateMany({
        where: { id, version: expectedVersion },
        data: { ...data, version: { increment: 1 } },
    });

    if (result.count === 0) {
        throw ApiError.conflict(
            'Bu kayıt başka bir kullanıcı tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
        );
    }
}
