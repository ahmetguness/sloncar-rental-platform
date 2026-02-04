import { Request, Response, NextFunction } from 'express';
import * as franchiseService from './franchise.service.js';
import {
    CreateFranchiseInput,
    UpdateFranchiseInput,
    UpdateStatusInput,
    FranchiseQueryInput,
} from './franchise.validators.js';

// User endpoints
export async function createApplication(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.userId;
        const application = await franchiseService.createApplication(userId, req.body as CreateFranchiseInput);
        res.status(201).json({
            success: true,
            data: application,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateApplication(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.userId;
        const application = await franchiseService.updateApplication(
            req.params.id!,
            userId,
            req.body as UpdateFranchiseInput
        );
        res.json({
            success: true,
            data: application,
        });
    } catch (error) {
        next(error);
    }
}

export async function submitApplication(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.userId;
        const application = await franchiseService.submitApplication(req.params.id!, userId);
        res.json({
            success: true,
            data: application,
        });
    } catch (error) {
        next(error);
    }
}

export async function getUserApplications(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.userId;
        const result = await franchiseService.getUserApplications(userId, req.query as unknown as FranchiseQueryInput);
        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

// Admin endpoints
export async function getAdminApplications(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await franchiseService.getAdminApplications(req.query as unknown as FranchiseQueryInput);
        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAdminApplicationById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const application = await franchiseService.getAdminApplicationById(req.params.id!);
        res.json({
            success: true,
            data: application,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateApplicationStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const adminUserId = req.user!.userId;
        const application = await franchiseService.updateApplicationStatus(
            req.params.id!,
            adminUserId,
            req.body as UpdateStatusInput
        );
        res.json({
            success: true,
            data: application,
        });
    } catch (error) {
        next(error);
    }
}

export async function getApplicationAuditLog(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const auditLogs = await franchiseService.getApplicationAuditLog(req.params.id!);
        res.json({
            success: true,
            data: auditLogs,
        });
    } catch (error) {
        next(error);
    }
}
