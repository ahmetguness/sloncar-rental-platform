import { Prisma, FranchiseApplicationStatus } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import {
    CreateFranchiseInput,
    UpdateFranchiseInput,
    UpdateStatusInput,
    FranchiseQueryInput,
    PublicFranchiseInput,
} from './franchise.validators.js';
import { FranchiseApplicationWithUser, FranchiseApplicationWithAudit } from './franchise.types.js';
import { PaginatedResponse } from '../cars/cars.types.js';

// Helper to create audit log entry
async function createAuditLog(
    tx: Prisma.TransactionClient,
    applicationId: string,
    action: string,
    performedBy: string,
    previousValue?: unknown,
    newValue?: unknown,
    note?: string
): Promise<void> {
    await tx.franchiseAuditLog.create({
        data: {
            applicationId,
            action,
            previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : undefined,
            newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
            performedBy,
            note,
        },
    });
}

export async function createApplication(
    userId: string,
    input: CreateFranchiseInput
): Promise<FranchiseApplicationWithUser> {
    const application = await prisma.$transaction(async (tx) => {
        const app = await tx.franchiseApplication.create({
            data: {
                userId,
                contactName: input.contactName,
                contactEmail: input.contactEmail,
                contactPhone: input.contactPhone,
                companyName: input.companyName,
                city: input.city,
                details: input.details || {},
                status: FranchiseApplicationStatus.DRAFT,
            },
            include: { user: true },
        });

        await createAuditLog(tx, app.id, 'CREATED', userId, null, {
            status: 'DRAFT',
            contactName: input.contactName,
            contactEmail: input.contactEmail,
        });

        return app;
    });

    return application as FranchiseApplicationWithUser;
}

export async function updateApplication(
    applicationId: string,
    userId: string,
    input: UpdateFranchiseInput
): Promise<FranchiseApplicationWithUser> {
    const application = await prisma.$transaction(async (tx) => {
        // Find existing
        const existing = await tx.franchiseApplication.findUnique({
            where: { id: applicationId },
        });

        if (!existing) {
            throw ApiError.notFound('Application not found');
        }

        // Check ownership
        if (existing.userId !== userId) {
            throw ApiError.forbidden('You can only update your own applications');
        }

        // Only allow updates if in DRAFT status
        if (existing.status !== FranchiseApplicationStatus.DRAFT) {
            throw ApiError.badRequest('Can only update applications in DRAFT status');
        }

        // Merge details if provided
        let newDetails: Record<string, unknown> = (existing.details as Record<string, unknown>) ?? {};
        if (input.details) {
            newDetails = {
                ...newDetails,
                ...(input.details as Record<string, unknown>),
            };
        }

        const updated = await tx.franchiseApplication.update({
            where: { id: applicationId },
            data: {
                contactName: input.contactName ?? existing.contactName,
                contactEmail: input.contactEmail ?? existing.contactEmail,
                contactPhone: input.contactPhone ?? existing.contactPhone,
                companyName: input.companyName ?? existing.companyName,
                city: input.city ?? existing.city,
                details: newDetails as Prisma.InputJsonValue,
            },
            include: { user: true },
        });

        await createAuditLog(
            tx,
            applicationId,
            'UPDATED',
            userId,
            { details: existing.details },
            { details: newDetails }
        );

        return updated;
    });

    return application as FranchiseApplicationWithUser;
}

export async function submitApplication(
    applicationId: string,
    userId: string
): Promise<FranchiseApplicationWithUser> {
    const application = await prisma.$transaction(async (tx) => {
        const existing = await tx.franchiseApplication.findUnique({
            where: { id: applicationId },
        });

        if (!existing) {
            throw ApiError.notFound('Application not found');
        }

        if (existing.userId !== userId) {
            throw ApiError.forbidden('You can only submit your own applications');
        }

        if (existing.status !== FranchiseApplicationStatus.DRAFT) {
            throw ApiError.badRequest('Application has already been submitted');
        }

        // Basic validation - ensure required fields are present
        if (!existing.contactName || !existing.contactEmail || !existing.contactPhone) {
            throw ApiError.badRequest('Please fill in all required contact information');
        }

        const updated = await tx.franchiseApplication.update({
            where: { id: applicationId },
            data: {
                status: FranchiseApplicationStatus.SUBMITTED,
                submittedAt: new Date(),
            },
            include: { user: true },
        });

        await createAuditLog(
            tx,
            applicationId,
            'SUBMITTED',
            userId,
            { status: 'DRAFT' },
            { status: 'SUBMITTED' }
        );

        return updated;
    });

    return application as FranchiseApplicationWithUser;
}

export async function getUserApplications(
    userId: string,
    query: FranchiseQueryInput
): Promise<PaginatedResponse<FranchiseApplicationWithUser>> {
    const { status, page, limit } = query;

    const where: Prisma.FranchiseApplicationWhereInput = { userId };
    if (status) where.status = status;

    const total = await prisma.franchiseApplication.count({ where });

    const applications = await prisma.franchiseApplication.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        data: applications as FranchiseApplicationWithUser[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Admin functions
export async function getAdminApplications(
    query: FranchiseQueryInput
): Promise<PaginatedResponse<FranchiseApplicationWithUser>> {
    const { status, city, search, fromDate, toDate, page, limit } = query;

    const where: Prisma.FranchiseApplicationWhereInput = {};

    if (search) {
        where.OR = [
            { contactName: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (fromDate || toDate) {
        where.submittedAt = {};
        if (fromDate) where.submittedAt.gte = fromDate;
        if (toDate) where.submittedAt.lte = toDate;
    }

    const total = await prisma.franchiseApplication.count({ where });

    const applications = await prisma.franchiseApplication.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        data: applications as FranchiseApplicationWithUser[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getAdminApplicationById(
    applicationId: string
): Promise<FranchiseApplicationWithAudit> {
    const application = await prisma.franchiseApplication.findUnique({
        where: { id: applicationId },
        include: {
            user: true,
            auditLogs: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!application) {
        throw ApiError.notFound('Application not found');
    }

    return application as unknown as FranchiseApplicationWithAudit;
}

export async function updateApplicationStatus(
    applicationId: string,
    adminUserId: string,
    input: UpdateStatusInput
): Promise<FranchiseApplicationWithUser> {
    const application = await prisma.$transaction(async (tx) => {
        const existing = await tx.franchiseApplication.findUnique({
            where: { id: applicationId },
        });

        if (!existing) {
            throw ApiError.notFound('Application not found');
        }

        // Cannot change status of draft applications
        if (existing.status === FranchiseApplicationStatus.DRAFT) {
            throw ApiError.badRequest('Cannot change status of draft applications. Wait for submission.');
        }

        const previousStatus = existing.status;

        const updated = await tx.franchiseApplication.update({
            where: { id: applicationId },
            data: {
                status: input.status,
                adminNotes: input.adminNote
                    ? (existing.adminNotes ? `${existing.adminNotes}\n\n---\n\n` : '') +
                    `[${new Date().toISOString()}] ${input.adminNote}`
                    : existing.adminNotes,
                reviewedBy: adminUserId,
                reviewedAt: new Date(),
            },
            include: { user: true },
        });

        await createAuditLog(
            tx,
            applicationId,
            'STATUS_CHANGE',
            adminUserId,
            { status: previousStatus },
            { status: input.status },
            input.adminNote
        );

        return updated;
    });

    return application as FranchiseApplicationWithUser;
}

export async function getApplicationAuditLog(
    applicationId: string
): Promise<FranchiseApplicationWithAudit['auditLogs']> {
    const application = await prisma.franchiseApplication.findUnique({
        where: { id: applicationId },
        include: {
            auditLogs: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!application) {
        throw ApiError.notFound('Application not found');
    }

    return application.auditLogs;
}

// PUBLIC - Create franchise application without user authentication
export async function createPublicApplication(
    input: PublicFranchiseInput
): Promise<{ id: string; applicationNumber: string }> {
    // Generate unique application number
    const date = new Date();
    const prefix = 'FRN';
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const applicationNumber = `${prefix}-${datePart}-${randomPart}`;

    const application = await prisma.franchiseApplication.create({
        data: {
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            companyName: input.companyName || null,
            city: input.city,
            status: FranchiseApplicationStatus.SUBMITTED,
            submittedAt: new Date(),
            details: {
                investmentBudget: input.investmentBudget,
                experience: input.experience,
                message: input.message,
                applicationNumber,
            },
        },
    });

    return {
        id: application.id,
        applicationNumber,
    };
}
